const mongoose = require('mongoose');

const gardenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    zip: { type: String, default: '' }
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  logo: {
    type: String // Path al logo
  },
  
  // Configuración
  settings: {
    shifts: {
      type: [String],
      default: ["mañana", "tarde", "jornada completa"]
    },
    schoolYear: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    currency: {
      type: String,
      default: "ARS"
    },
    timezone: {
      type: String,
      default: "America/Argentina/Buenos_Aires"
    }
  },

  // Plan y suscripción
  subscription: {
    plan: {
      type: String,
      enum: ["semillita", "brote", "jardin"],
      default: "semillita"
    },
    status: {
      type: String,
      enum: ["active", "trial", "suspended", "cancelled"],
      default: "trial"
    },
    trialEndsAt: Date,
    currentPeriodEnd: Date
  },

  // Dueño/Admin principal
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
gardenSchema.index({ slug: 1 });
gardenSchema.index({ ownerId: 1 });

// Virtual para saber si está eliminado (soft delete)
gardenSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Método para soft delete
gardenSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Garden', gardenSchema);