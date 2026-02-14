const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  gardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date // Si dura más de un día
  },
  time: {
    type: String, // Formato "HH:MM"
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Hora debe tener formato HH:MM'
    }
  },
  endTime: {
    type: String, // Formato "HH:MM"
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Hora de fin debe tener formato HH:MM'
    }
  },
  
  type: {
    type: String,
    enum: ["event", "holiday", "meeting", "deadline", "birthday", "other"],
    default: "event"
  },
  
  // Alcance
  scope: {
    type: String,
    enum: ["garden", "classroom"],
    default: "garden"
  },
  classroomIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  }],
  
  color: {
    type: String,
    default: "#F2A7B3" // Rosa Nido del design system
  },
  
  // Ubicación (opcional)
  location: {
    type: String,
    trim: true
  },
  
  // Recordatorios
  reminders: [{
    type: {
      type: String,
      enum: ["email", "notification", "sms"],
      default: "notification"
    },
    minutesBefore: {
      type: Number,
      min: 0,
      default: 60 // 1 hora antes por defecto
    }
  }],
  
  // Recurrencia (para eventos que se repiten)
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"]
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    endDate: Date,
    daysOfWeek: [Number], // 0-6 (domingo-sábado)
    dayOfMonth: Number,   // 1-31 para recurrencia mensual
    weekOfMonth: Number   // 1-4 para "primer lunes del mes"
  },
  
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Estado
  status: {
    type: String,
    enum: ["scheduled", "cancelled", "completed"],
    default: "scheduled"
  },
  
  // Metadatos adicionales
  metadata: {
    isAllDay: {
      type: Boolean,
      default: false
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    maxAttendees: Number,
    attendeeCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
calendarEventSchema.index({ gardenId: 1, date: 1 });
calendarEventSchema.index({ gardenId: 1, type: 1 });
calendarEventSchema.index({ classroomIds: 1, date: 1 });
calendarEventSchema.index({ date: 1, endDate: 1 }); // Para consultas por rango

// Virtual para saber si el evento ya pasó
calendarEventSchema.virtual('isPast').get(function() {
  const eventDateTime = this.endDate || this.date;
  return new Date() > eventDateTime;
});

// Virtual para saber si el evento es hoy
calendarEventSchema.virtual('isToday').get(function() {
  const today = new Date().toDateString();
  return this.date.toDateString() === today;
});

// Virtual para saber si el evento es mañana
calendarEventSchema.virtual('isTomorrow').get(function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return this.date.toDateString() === tomorrow.toDateString();
});

// Virtual para duración en días
calendarEventSchema.virtual('durationDays').get(function() {
  if (!this.endDate) return 1;
  
  const diffTime = this.endDate - this.date;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

// Virtual para obtener rango de fechas en formato legible
calendarEventSchema.virtual('dateRange').get(function() {
  const startDate = this.date.toLocaleDateString('es-AR');
  
  if (!this.endDate) {
    return startDate;
  }
  
  const endDate = this.endDate.toLocaleDateString('es-AR');
  return `${startDate} - ${endDate}`;
});

// Validación: endDate debe ser posterior a date
calendarEventSchema.pre('validate', function() {
  if (this.endDate && this.endDate <= this.date) {
    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
  }
  
  // Si scope es 'classroom', debe tener classroomIds
  if (this.scope === 'classroom' && (!this.classroomIds || this.classroomIds.length === 0)) {
    throw new Error('Los eventos por sala deben especificar al menos una sala');
  }
  
  // Limpiar classroomIds si es para todo el jardín
  if (this.scope === 'garden') {
    this.classroomIds = [];
  }
});

// Método para marcar como completado
calendarEventSchema.methods.markCompleted = function() {
  this.status = 'completed';
  return this.save();
};

// Método para cancelar evento
calendarEventSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Método para verificar si hay conflicto con otro evento
calendarEventSchema.methods.hasConflict = async function(excludeId = null) {
  const query = {
    gardenId: this.gardenId,
    status: { $ne: 'cancelled' },
    $and: [
      { date: { $lte: this.endDate || this.date } },
      { $or: [
        { endDate: { $gte: this.date } },
        { endDate: null, date: { $gte: this.date } }
      ]}
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  // Si es por sala específica, verificar solo esas salas
  if (this.scope === 'classroom') {
    query.$or = [
      { scope: 'garden' },
      { scope: 'classroom', classroomIds: { $in: this.classroomIds } }
    ];
  }
  
  const conflicts = await this.constructor.find(query);
  return conflicts.length > 0 ? conflicts : null;
};

// Método estático para obtener eventos del mes
calendarEventSchema.statics.getMonthEvents = function(gardenId, year, month, classroomIds = []) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const query = {
    gardenId,
    status: { $ne: 'cancelled' },
    date: { $lte: endDate },
    $or: [
      { endDate: { $gte: startDate } },
      { endDate: null, date: { $gte: startDate } }
    ]
  };
  
  // Si se especifican salas, filtrar eventos relevantes
  if (classroomIds.length > 0) {
    query.$and = [{
      $or: [
        { scope: 'garden' },
        { scope: 'classroom', classroomIds: { $in: classroomIds } }
      ]
    }];
  }
  
  return this.find(query)
    .populate('authorId', 'profile.firstName profile.lastName')
    .populate('classroomIds', 'name emoji color')
    .sort({ date: 1, time: 1 });
};

// Método estático para obtener próximos eventos
calendarEventSchema.statics.getUpcomingEvents = function(gardenId, days = 7, classroomIds = []) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  const query = {
    gardenId,
    status: 'scheduled',
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (classroomIds.length > 0) {
    query.$or = [
      { scope: 'garden' },
      { scope: 'classroom', classroomIds: { $in: classroomIds } }
    ];
  }
  
  return this.find(query)
    .populate('classroomIds', 'name emoji')
    .sort({ date: 1, time: 1 })
    .limit(10);
};

// Método estático para obtener eventos de hoy
calendarEventSchema.statics.getTodayEvents = function(gardenId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  return this.find({
    gardenId,
    status: 'scheduled',
    date: { $gte: startOfDay, $lte: endOfDay }
  })
  .populate('classroomIds', 'name emoji')
  .sort({ time: 1 });
};

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);