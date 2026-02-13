const { Message, User } = require('../models');

// Obtener conversaciones del jardín
const getThreads = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    if (req.userRole === 'family') {
      // Para familias, solo sus propias conversaciones
      const threads = await Message.getFamilyThreads(req.userId, req.gardenId);
      res.json({ threads });
    } else {
      // Para admin/docentes, todas las conversaciones del jardín
      const threads = await Message.getThreadsForGarden(req.gardenId, parseInt(limit));
      res.json({ threads });
    }

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener mensajes de una conversación específica
const getThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verificar acceso al thread
    const threadRegex = new RegExp(`^${req.gardenId}-`);
    if (!threadRegex.test(threadId)) {
      return res.status(403).json({
        error: 'No tienes acceso a esta conversación',
        code: 'THREAD_ACCESS_DENIED'
      });
    }

    // Si es familia, solo puede ver sus propias conversaciones
    if (req.userRole === 'family' && !threadId.includes(req.userId.toString())) {
      return res.status(403).json({
        error: 'No tienes acceso a esta conversación',
        code: 'THREAD_ACCESS_DENIED'
      });
    }

    const messages = await Message.getThreadMessages(threadId, parseInt(page), parseInt(limit));

    // Marcar mensajes como leídos (excepto los propios)
    await Message.markThreadAsRead(threadId, req.userId);

    res.json({ 
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Enviar mensaje
const sendMessage = async (req, res) => {
  try {
    const { content, childId, recipientUserId, attachments } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Contenido del mensaje es requerido',
        code: 'MISSING_CONTENT'
      });
    }

    // Generar threadId
    let threadId;
    if (req.userRole === 'family') {
      // Familia iniciando conversación
      threadId = Message.generateThreadId(req.gardenId, req.userId, childId);
    } else {
      // Admin/docente respondiendo a familia
      if (!recipientUserId) {
        return res.status(400).json({
          error: 'recipientUserId es requerido para mensajes del jardín',
          code: 'MISSING_RECIPIENT'
        });
      }
      threadId = Message.generateThreadId(req.gardenId, recipientUserId, childId);
    }

    const message = new Message({
      gardenId: req.gardenId,
      threadId,
      senderId: req.userId,
      senderRole: req.userRole,
      content: content.trim(),
      childId: childId || null,
      attachments: attachments || []
    });

    await message.save();
    await message.populate('senderId', 'profile.firstName profile.lastName profile.avatar');
    await message.populate('childId', 'firstName lastName nickname');

    res.status(201).json({
      message: 'Mensaje enviado ✅',
      data: message
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener conteo de mensajes no leídos
const getUnreadCount = async (req, res) => {
  try {
    const unreadData = await Message.getUnreadCount(req.gardenId, req.userId);
    const unreadCount = unreadData[0] || { totalThreads: 0, totalMessages: 0 };

    res.json({ 
      unreadThreads: unreadCount.totalThreads,
      unreadMessages: unreadCount.totalMessages
    });

  } catch (error) {
    console.error('Error obteniendo conteo de no leídos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getThreads,
  getThreadMessages,
  sendMessage,
  getUnreadCount
};