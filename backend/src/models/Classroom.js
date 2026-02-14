const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  gardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  emoji: {
    type: String,
    default: "🐥"
  },
  color: {
    type: String,
    default: "#FDE8A0" // Amarillo Pollito del design system
  },
  
  ageRange: {
    from: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    to: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    }
  },
  shift: {
    type: String,
    required: true,
    enum: ["mañana", "tarde", "jornada completa"]
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  
  teacherIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Configuración de cuota
  fee: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
      default: 10
    },
    lateFeePercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    }
  },

  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
classroomSchema.index({ gardenId: 1 });
classroomSchema.index({ gardenId: 1, shift: 1 });

// Virtual para saber si está eliminado (soft delete)
classroomSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Virtual para nombre con emoji
classroomSchema.virtual('displayName').get(function() {
  return `${this.emoji} ${this.name}`;
});

// Validación: ageRange.from debe ser menor o igual a ageRange.to
classroomSchema.pre('validate', function() {
  if (this.ageRange && this.ageRange.from > this.ageRange.to) {
    throw new Error('La edad mínima no puede ser mayor a la edad máxima');
  }
});

// Método para soft delete
classroomSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Método para obtener cantidad de niños actuales
classroomSchema.methods.getCurrentChildrenCount = async function() {
  const Child = mongoose.model('Child');
  return await Child.countDocuments({ 
    classroomId: this._id, 
    status: 'active',
    deletedAt: null 
  });
};

// Método para verificar si tiene capacidad disponible
classroomSchema.methods.hasCapacity = async function() {
  const currentCount = await this.getCurrentChildrenCount();
  return currentCount < this.capacity;
};

module.exports = mongoose.model('Classroom', classroomSchema);