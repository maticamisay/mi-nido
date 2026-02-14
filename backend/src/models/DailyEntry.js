const mongoose = require('mongoose');

// Schema para comidas
const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["desayuno", "almuerzo", "merienda", "colación"],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  ate: {
    type: String,
    enum: ["bien", "poco", "nada", "no aplica"],
    default: "bien"
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

// Schema para actividades
const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["pedagógica", "artística", "motriz", "musical", "libre", "paseo"],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

// Schema para fotos
const photoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Schema para "visto por" (lectura por familias)
const seenBySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seenAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const dailyEntrySchema = new mongoose.Schema({
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
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
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
  
  // Alimentación
  meals: [mealSchema],

  // Descanso
  nap: {
    slept: {
      type: Boolean,
      default: true
    },
    from: {
      type: String, // Formato "HH:MM"
      validate: {
        validator: function(v) {
          return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Hora inicio siesta debe tener formato HH:MM'
      }
    },
    to: {
      type: String, // Formato "HH:MM"
      validate: {
        validator: function(v) {
          return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Hora fin siesta debe tener formato HH:MM'
      }
    },
    quality: {
      type: String,
      enum: ["bien", "inquieto", "no durmió"],
      default: "bien"
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // Higiene
  hygiene: {
    diaperChanges: {
      type: Number,
      min: 0,
      default: 0
    },
    bathroomVisits: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // Actividades del día
  activities: [activitySchema],

  // Estado de ánimo / observaciones
  mood: {
    type: String,
    enum: ["contento", "tranquilo", "inquieto", "llorón", "cansado"],
    default: "contento"
  },
  observations: {
    type: String,
    trim: true
  },

  // Fotos del día
  photos: [photoSchema],

  // Estado del entry
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },
  publishedAt: Date,
  
  // Quién lo cargó
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Visto por la familia
  seenBy: [seenBySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
dailyEntrySchema.index({ childId: 1, date: 1 }, { unique: true }); // Solo una entrada por niño por día
dailyEntrySchema.index({ classroomId: 1, date: 1 });
dailyEntrySchema.index({ gardenId: 1, date: 1 });

// Virtual para saber si fue visto por alguna familia
dailyEntrySchema.virtual('hasBeenSeen').get(function() {
  return this.seenBy && this.seenBy.length > 0;
});

// Virtual para contar fotos
dailyEntrySchema.virtual('photoCount').get(function() {
  return this.photos ? this.photos.length : 0;
});

// Virtual para resumen de actividades
dailyEntrySchema.virtual('activitySummary').get(function() {
  if (!this.activities || this.activities.length === 0) return '';
  return this.activities.map(a => a.description).join(', ');
});

// Método para publicar la entrada
dailyEntrySchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Método para marcar como visto por un usuario
dailyEntrySchema.methods.markAsSeenBy = function(userId) {
  const alreadySeen = this.seenBy.some(s => s.userId.toString() === userId.toString());
  
  if (!alreadySeen) {
    this.seenBy.push({ userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Método para agregar foto
dailyEntrySchema.methods.addPhoto = function(url, caption = '') {
  this.photos.push({ url, caption });
  return this.save();
};

// Método estático para obtener entradas por rango de fechas
dailyEntrySchema.statics.getEntriesByDateRange = function(childId, startDate, endDate) {
  return this.find({
    childId,
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'published'
  }).populate('authorId', 'profile.firstName profile.lastName')
    .sort({ date: -1 });
};

// Middleware para actualizar publishedAt al cambiar status a published
dailyEntrySchema.pre('save', function() {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

module.exports = mongoose.model('DailyEntry', dailyEntrySchema);