const mongoose = require('mongoose');

// Schema para registro de asistencia individual
const attendanceRecordSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  status: {
    type: String,
    enum: ["present", "absent", "justified", "late"],
    required: true
  },
  justification: {
    type: String,
    trim: true
  },
  arrivedAt: {
    type: String, // Formato "HH:MM"
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Hora de llegada debe tener formato HH:MM'
    }
  },
  leftAt: {
    type: String, // Formato "HH:MM"
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Hora de retiro debe tener formato HH:MM'
    }
  },
  retiredBy: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  gardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  date: {
    type: String, // Formato YYYY-MM-DD
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Fecha debe tener formato YYYY-MM-DD'
    }
  },
  
  records: [attendanceRecordSchema],

  // Quién cargó la asistencia
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
attendanceSchema.index({ gardenId: 1, date: 1 });
attendanceSchema.index({ classroomId: 1, date: 1 }, { unique: true }); // Solo un documento por sala por día

// Virtual para obtener resumen de asistencia
attendanceSchema.virtual('summary').get(function() {
  const total = this.records.length;
  const present = this.records.filter(r => r.status === 'present').length;
  const absent = this.records.filter(r => r.status === 'absent').length;
  const justified = this.records.filter(r => r.status === 'justified').length;
  const late = this.records.filter(r => r.status === 'late').length;
  
  return {
    total,
    present,
    absent,
    justified,
    late,
    attendanceRate: total > 0 ? Math.round((present + late) / total * 100) : 0
  };
});

// Método para agregar o actualizar asistencia de un niño
attendanceSchema.methods.setChildAttendance = function(childId, attendanceData) {
  const existingIndex = this.records.findIndex(r => r.childId.toString() === childId.toString());
  
  if (existingIndex >= 0) {
    // Actualizar registro existente
    Object.assign(this.records[existingIndex], attendanceData, { childId });
  } else {
    // Agregar nuevo registro
    this.records.push({ ...attendanceData, childId });
  }
  
  return this.save();
};

// Método para obtener asistencia de un niño específico
attendanceSchema.methods.getChildAttendance = function(childId) {
  return this.records.find(r => r.childId.toString() === childId.toString());
};

// Método estático para obtener asistencia por rango de fechas
attendanceSchema.statics.getAttendanceByDateRange = function(classroomId, startDate, endDate) {
  return this.find({
    classroomId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('records.childId', 'firstName lastName nickname')
    .populate('recordedBy', 'profile.firstName profile.lastName')
    .sort({ date: 1 });
};

// Método estático para crear asistencia del día con todos los niños de la sala
attendanceSchema.statics.createDailyAttendance = async function(classroomId, date, recordedById) {
  const Child = mongoose.model('Child');
  
  // Obtener todos los niños activos de la sala
  const children = await Child.find({
    classroomId,
    status: 'active',
    deletedAt: null
  }).select('_id');
  
  // Crear registros de asistencia con status 'absent' por defecto
  const records = children.map(child => ({
    childId: child._id,
    status: 'absent'
  }));
  
  const classroom = await mongoose.model('Classroom').findById(classroomId);
  if (!classroom) {
    throw new Error('Sala no encontrada');
  }
  
  return this.create({
    classroomId,
    gardenId: classroom.gardenId,
    date,
    records,
    recordedBy: recordedById
  });
};

module.exports = mongoose.model('Attendance', attendanceSchema);