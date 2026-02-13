const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess } = require('../middleware/auth');
const {
  getThreads,
  getThreadMessages,
  sendMessage,
  getUnreadCount
} = require('../controllers/messageController');

// Obtener conteo de mensajes no leídos
// GET /api/messages/unread?gardenId=xxx
router.get('/unread', authenticate, requireGardenAccess('gardenId'), getUnreadCount);

// Obtener conversaciones del jardín
// GET /api/messages/threads?gardenId=xxx&limit=20
router.get('/threads', authenticate, requireGardenAccess('gardenId'), getThreads);

// Obtener mensajes de una conversación específica
// GET /api/messages/thread/:threadId?gardenId=xxx&page=1&limit=50
router.get('/thread/:threadId', authenticate, requireGardenAccess('gardenId'), getThreadMessages);

// Enviar mensaje
// POST /api/messages
router.post('/', authenticate, requireGardenAccess(), sendMessage);

module.exports = router;