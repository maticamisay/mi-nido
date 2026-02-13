const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  gardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  
  // Período
  period: {
    type: String, // Formato YYYY-MM
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}$/.test(v);
      },
      message: 'Período debe tener formato YYYY-MM'
    }
  },
  concept: {
    type: String,
    enum: ["cuota", "inscripción", "material", "evento", "otro"],
    default: "cuota"
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Montos (en centavos para evitar problemas de precision)
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Estado
  status: {
    type: String,
    enum: ["pending", "paid", "partial", "overdue", "waived"],
    default: "pending"
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Pago
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidAt: Date,
  paymentMethod: {
    type: String,
    enum: ["efectivo", "transferencia", "mercadopago", "debito", "credito", "otro"]
  },
  paymentReference: {
    type: String,
    trim: true
  },
  paymentNotes: {
    type: String,
    trim: true
  },
  
  // Quién registró el pago
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices
paymentSchema.index({ gardenId: 1, period: 1 });
paymentSchema.index({ childId: 1, period: 1 }, { unique: true }); // Un pago por niño por período
paymentSchema.index({ gardenId: 1, status: 1 });
paymentSchema.index({ gardenId: 1, dueDate: 1 });
paymentSchema.index({ dueDate: 1, status: 1 }); // Para consultar vencimientos

// Virtual para saber si está vencido
paymentSchema.virtual('isOverdue').get(function() {
  return this.status !== 'paid' && this.status !== 'waived' && new Date() > this.dueDate;
});

// Virtual para días de atraso
paymentSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  
  const today = new Date();
  const diffTime = today - this.dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual para saldo pendiente
paymentSchema.virtual('balance').get(function() {
  return Math.max(0, this.total - this.paidAmount);
});

// Virtual para porcentaje pagado
paymentSchema.virtual('paidPercentage').get(function() {
  if (this.total === 0) return 100;
  return Math.round((this.paidAmount / this.total) * 100);
});

// Virtual para mes/año en formato legible
paymentSchema.virtual('periodDisplay').get(function() {
  const [year, month] = this.period.split('-');
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
});

// Middleware para calcular total automáticamente
paymentSchema.pre('save', function(next) {
  this.total = this.amount + this.lateFee - this.discount;
  
  // Actualizar estado según pagos
  if (this.paidAmount >= this.total) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.isOverdue && this.status === 'pending') {
    this.status = 'overdue';
  }
  
  next();
});

// Método para registrar un pago
paymentSchema.methods.recordPayment = function(amount, method, reference = '', notes = '', recordedBy) {
  this.paidAmount += amount;
  this.paidAt = new Date();
  this.paymentMethod = method;
  this.paymentReference = reference;
  this.paymentNotes = notes;
  this.recordedBy = recordedBy;
  
  return this.save();
};

// Método para aplicar recargo por mora
paymentSchema.methods.applyLateFee = function(percentage) {
  if (this.isOverdue && this.lateFee === 0) {
    this.lateFee = Math.round(this.amount * (percentage / 100));
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para condonar (waive) el pago
paymentSchema.methods.waive = function(recordedBy, reason = '') {
  this.status = 'waived';
  this.paymentNotes = reason;
  this.recordedBy = recordedBy;
  return this.save();
};

// Método estático para crear cuota mensual
paymentSchema.statics.createMonthlyFee = async function(childId, period, amount, dueDay = 10) {
  const Child = mongoose.model('Child');
  const child = await Child.findById(childId).populate('classroomId');
  
  if (!child) {
    throw new Error('Niño no encontrado');
  }
  
  const [year, month] = period.split('-');
  const dueDate = new Date(parseInt(year), parseInt(month) - 1, dueDay);
  
  return this.create({
    gardenId: child.gardenId,
    childId: child._id,
    classroomId: child.classroomId._id,
    period,
    concept: 'cuota',
    description: `Cuota ${child.classroomId.name} - ${period}`,
    amount,
    dueDate,
    total: amount
  });
};

// Método estático para obtener estado de cuenta de una familia
paymentSchema.statics.getAccountStatus = function(gardenId, childrenIds) {
  return this.find({
    gardenId,
    childId: { $in: childrenIds }
  })
  .populate('childId', 'firstName lastName')
  .populate('classroomId', 'name emoji')
  .sort({ period: -1, dueDate: -1 });
};

// Método estático para obtener morosos
paymentSchema.statics.getOverduePayments = function(gardenId) {
  const today = new Date();
  
  return this.find({
    gardenId,
    status: { $in: ['pending', 'partial', 'overdue'] },
    dueDate: { $lt: today }
  })
  .populate('childId', 'firstName lastName')
  .populate('classroomId', 'name')
  .sort({ dueDate: 1 });
};

// Método estático para reporte de ingresos
paymentSchema.statics.getIncomeReport = function(gardenId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        gardenId: new mongoose.Types.ObjectId(gardenId),
        paidAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'paid'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$paidAt' },
          month: { $month: '$paidAt' },
          concept: '$concept'
        },
        totalAmount: { $sum: '$paidAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);