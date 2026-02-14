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

const messageSchema = new mongoose.Schema({
  gardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  
  // Conversación (thread)
  threadId: {
    type: String,
    required: true,
    index: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ["teacher", "admin", "family", "owner"],
    required: true
  },
  
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  
  attachments: [attachmentSchema],

  // Relacionado a un niño (opcional)
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  },

  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ gardenId: 1, senderId: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

// Virtual para saber si fue leído
messageSchema.virtual('isRead').get(function() {
  return this.readAt !== null;
});

// Virtual para tiempo relativo
messageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
});

// Método para marcar como leído
messageSchema.methods.markAsRead = function() {
  if (!this.readAt) {
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Método estático para generar threadId
messageSchema.statics.generateThreadId = function(gardenId, familyUserId, childId = null) {
  const baseId = `${gardenId}-${familyUserId}`;
  return childId ? `${baseId}-${childId}` : baseId;
};

// Método estático para obtener conversaciones de un jardín
messageSchema.statics.getThreadsForGarden = function(gardenId, limit = 20) {
  return this.aggregate([
    { $match: { gardenId: new mongoose.Types.ObjectId(gardenId) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$threadId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [{ $eq: ['$readAt', null] }, 1, 0]
          }
        },
        messageCount: { $sum: 1 }
      }
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.senderId',
        foreignField: '_id',
        as: 'lastMessage.sender'
      }
    },
    {
      $lookup: {
        from: 'children',
        localField: 'lastMessage.childId',
        foreignField: '_id',
        as: 'lastMessage.child'
      }
    }
  ]);
};

// Método estático para obtener mensajes de un thread
messageSchema.statics.getThreadMessages = function(threadId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ threadId })
    .populate('senderId', 'profile.firstName profile.lastName profile.avatar')
    .populate('childId', 'firstName lastName nickname')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Método estático para contar mensajes no leídos
messageSchema.statics.getUnreadCount = function(gardenId, userId) {
  return this.aggregate([
    {
      $match: {
        gardenId: new mongoose.Types.ObjectId(gardenId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        readAt: null
      }
    },
    {
      $group: {
        _id: '$threadId',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        totalThreads: { $sum: 1 },
        totalMessages: { $sum: '$count' }
      }
    }
  ]);
};

// Método estático para marcar todos los mensajes de un thread como leídos
messageSchema.statics.markThreadAsRead = function(threadId, excludeUserId) {
  return this.updateMany(
    { 
      threadId, 
      senderId: { $ne: excludeUserId },
      readAt: null 
    },
    { readAt: new Date() }
  );
};

// Método estático para obtener últimas conversaciones de una familia
messageSchema.statics.getFamilyThreads = function(familyUserId, gardenId) {
  return this.aggregate([
    {
      $match: {
        gardenId: new mongoose.Types.ObjectId(gardenId),
        $or: [
          { senderId: new mongoose.Types.ObjectId(familyUserId) },
          { threadId: { $regex: `^${gardenId}-${familyUserId}` } }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$threadId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$readAt', null] },
                  { $ne: ['$senderId', new mongoose.Types.ObjectId(familyUserId)] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { 'lastMessage.createdAt': -1 } }
  ]);
};

module.exports = mongoose.model('Message', messageSchema);