const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireAdmin } = require('../middleware/auth');
const {
  getMyGardens,
  getGarden,
  updateGarden,
  getGardenStats,
  getGardenMembers,
  inviteUser
} = require('../controllers/gardenController');

// Obtener jardines del usuario autenticado
// GET /api/gardens
router.get('/', authenticate, getMyGardens);

// Obtener jardín específico
// GET /api/gardens/:gardenId
router.get('/:gardenId', authenticate, requireGardenAccess(), getGarden);

// Actualizar jardín (solo admin/owner)
// PUT /api/gardens/:gardenId
router.put('/:gardenId', authenticate, requireGardenAccess(), requireAdmin, updateGarden);

// Obtener estadísticas del jardín
// GET /api/gardens/:gardenId/stats
router.get('/:gardenId/stats', authenticate, requireGardenAccess(), getGardenStats);

// Obtener miembros del jardín
// GET /api/gardens/:gardenId/members
router.get('/:gardenId/members', authenticate, requireGardenAccess(), requireAdmin, getGardenMembers);

// Invitar usuario al jardín
// POST /api/gardens/:gardenId/invite
router.post('/:gardenId/invite', authenticate, requireGardenAccess(), requireAdmin, inviteUser);

module.exports = router;