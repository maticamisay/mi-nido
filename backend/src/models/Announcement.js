const mongoose = require('mongoose');

// Schema para archivos adjuntos
const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String, // MIME type
    required: true
  },
  size: {
    type: Number // Tamaño en bytes
  }
}, { _id: false });

// Schema para confirmaciones de lectura
const acknowledgementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ackedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const announcementSchema = new mongoose.Schema({
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
  body: {
    type: String,
    required: true,
    trim: true
  },
  
  // Alcance
  scope: {
    type: String,
    enum: ["garden", "classroom"],
    required: true
  },
  classroomIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  }],
  
  // Adjuntos
  attachments: [attachmentSchema],

  // Requiere confirmación de lectura
  requiresAck: {
    type: Boolean,
    default: false
  },
  
  // Confirmaciones
  acknowledgements: [acknowledgementSchema],

  // Publicación
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  },
  publishedAt: Date,
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Flags
  pinned: {
    type: Boolean,
    default: false
  },
  urgent: {
    type: Boolean,
    default: false
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
announcementSchema.index({ gardenId: 1, status: 1 });
announcementSchema.index({ gardenId: 1, publishedAt: -1 });
announcementSchema.index({ classroomIds: 1 });
announcementSchema.index({ pinned: 1, publishedAt: -1 });

// Virtual para saber si está eliminado (soft delete)
announcementSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Virtual para contar confirmaciones
announcementSchema.virtual('ackCount').get(function() {
  return this.acknowledgements ? this.acknowledgements.length : 0;
});

// Virtual para contar adjuntos
announcementSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Virtual para preview del contenido
announcementSchema.virtual('preview').get(function() {
  const maxLength = 150;
  return this.body.length > maxLength 
    ? this.body.substring(0, maxLength) + '...' 
    : this.body;
});

// Validación: si scope es 'classroom', debe tener classroomIds
announcementSchema.pre('validate', function(next) {
  if (this.scope === 'classroom' && (!this.classroomIds || this.classroomIds.length === 0)) {
    return next(new Error('Los comunicados por sala deben especificar al menos una sala'));
  }
  if (this.scope === 'garden') {
    this.classroomIds = [];
  }
  next();
});

// Método para publicar el comunicado
announcementSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Método para archivar
announcementSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Método para marcar como leído por un usuario
announcementSchema.methods.acknowledge = function(userId) {
  const alreadyAcked = this.acknowledgements.some(
    ack => ack.userId.toString() === userId.toString()
  );
  
  if (!alreadyAcked) {
    this.acknowledgements.push({ userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Método para verificar si un usuario ya confirmó lectura
announcementSchema.methods.hasUserAcknowledged = function(userId) {
  return this.acknowledgements.some(
    ack => ack.userId.toString() === userId.toString()
  );
};

// Método para soft delete
announcementSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Método estático para obtener comunicados relevantes para un usuario
announcementSchema.statics.getRelevantForUser = function(userId, gardenId, classroomIds = []) {
  const query = {
    gardenId,
    status: 'published',
    deletedAt: null,
    $or: [
      { scope: 'garden' },
      { scope: 'classroom', classroomIds: { $in: classroomIds } }
    ]
  };
  
  return this.find(query)
    .populate('authorId', 'profile.firstName profile.lastName')
    .populate('classroomIds', 'name emoji')
    .sort({ pinned: -1, publishedAt: -1 });
};

// Método estático para obtener comunicados que requieren confirmación y no fueron confirmados
announcementSchema.statics.getPendingAcknowledgements = function(userId, gardenId, classroomIds = []) {
  const query = {
    gardenId,
    status: 'published',
    deletedAt: null,
    requiresAck: true,
    'acknowledgements.userId': { $ne: userId },
    $or: [
      { scope: 'garden' },
      { scope: 'classroom', classroomIds: { $in: classroomIds } }
    ]
  };
  
  return this.find(query)
    .populate('authorId', 'profile.firstName profile.lastName')
    .sort({ publishedAt: -1 });
};

// Middleware para actualizar publishedAt al cambiar status a published
announcementSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);