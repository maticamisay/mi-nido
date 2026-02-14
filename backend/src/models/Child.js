const mongoose = require('mongoose');

// Schema para medicaciones
const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  notes: String
}, { _id: false });

// Schema para personas autorizadas a retirar
const authorizedPickupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  dni: { type: String, required: true },
  phone: String,
  photo: String // Path a la foto
}, { _id: false });

// Schema para contactos de emergencia
const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

// Schema para documentos
const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["dni", "birth_certificate", "medical_cert", "other"],
    required: true
  },
  label: { type: String, required: true },
  file: { type: String, required: true }, // Path al archivo
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const childSchema = new mongoose.Schema({
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
  
  // Datos personales
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
  nickname: {
    type: String,
    trim: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ["F", "M", "X"],
    required: true
  },
  dni: {
    type: String,
    trim: true
  },
  photo: {
    type: String // Path a la foto
  },
  
  // Turno y estado
  shift: {
    type: String,
    required: true,
    enum: ["mañana", "tarde", "jornada completa"]
  },
  enrollmentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["active", "withdrawn", "graduated"],
    default: "active"
  },
  
  // Ficha médica (embebida)
  medical: {
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]
    },
    allergies: [String],
    conditions: [String],
    medications: [medicationSchema],
    healthInsurance: {
      provider: String,
      planNumber: String,
      memberId: String
    },
    pediatrician: {
      name: String,
      phone: String
    },
    notes: String
  },

  // Personas autorizadas a retirar (embebida)
  authorizedPickups: [authorizedPickupSchema],

  // Contactos de emergencia (embebida)
  emergencyContacts: [emergencyContactSchema],

  // Documentos subidos
  documents: [documentSchema],

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
childSchema.index({ gardenId: 1 });
childSchema.index({ classroomId: 1 });
childSchema.index({ gardenId: 1, status: 1 });

// Virtual para nombre completo
childSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual para nombre a mostrar (nickname si existe, sino firstName)
childSchema.virtual('displayName').get(function() {
  return this.nickname || this.firstName;
});

// Virtual para edad
childSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual para saber si está eliminado (soft delete)
childSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Validación: debe tener al menos un contacto de emergencia + solo un contacto primario
childSchema.pre('validate', function() {
  if (this.emergencyContacts.length === 0) {
    throw new Error('Debe tener al menos un contacto de emergencia');
  }
  const primaryContacts = this.emergencyContacts.filter(contact => contact.isPrimary);
  if (primaryContacts.length > 1) {
    throw new Error('Solo puede haber un contacto de emergencia primario');
  }
});

// Método para soft delete
childSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Método para obtener contacto primario
childSchema.methods.getPrimaryContact = function() {
  return this.emergencyContacts.find(contact => contact.isPrimary) || this.emergencyContacts[0];
};

// Método para verificar si tiene alergias
childSchema.methods.hasAllergies = function() {
  return this.medical.allergies && this.medical.allergies.length > 0;
};

module.exports = mongoose.model('Child', childSchema);