const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const membershipSchema = new mongoose.Schema({
  gardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  role: {
    type: String,
    enum: ["owner", "admin", "teacher", "family"],
    required: true
  },
  classroomIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  }],
  childrenIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["active", "invited", "inactive"],
    default: "active"
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String // Path a la imagen
    },
    dni: {
      type: String,
      trim: true
    }
  },

  // Roles por jardín (un usuario puede estar en varios jardines)
  memberships: [membershipSchema],

  // Auth
  lastLoginAt: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  resetToken: String,
  resetTokenExpiresAt: Date,

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
userSchema.index({ email: 1 });
userSchema.index({ 'memberships.gardenId': 1 });
userSchema.index({ 'memberships.role': 1 });

// Virtual para nombre completo
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual para saber si está eliminado (soft delete)
userSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Método para hashear password antes de guardar
userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) return;
  
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Método para obtener rol en un jardín específico
userSchema.methods.getRoleInGarden = function(gardenId) {
  const membership = this.memberships.find(m => m.gardenId.toString() === gardenId.toString());
  return membership ? membership.role : null;
};

// Método para verificar si tiene acceso a un jardín
userSchema.methods.hasAccessToGarden = function(gardenId) {
  return this.memberships.some(m => 
    m.gardenId.toString() === gardenId.toString() && m.status === 'active'
  );
};

// Método para soft delete
userSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);