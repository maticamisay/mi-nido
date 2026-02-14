const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireTeacher, requireAdmin } = require('../middleware/auth');
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  acknowledgeAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');

// Obtener comunicados relevantes para el usuario
// GET /api/announcements?gardenId=xxx&status=published&limit=20&page=1
router.get('/', authenticate, requireGardenAccess('gardenId'), getAnnouncements);

// Obtener comunicado específico
// GET /api/announcements/:announcementId?gardenId=xxx
router.get('/:announcementId', authenticate, requireGardenAccess('gardenId'), getAnnouncement);

// Crear nuevo comunicado (docentes pueden crear para sus salas, admin para todo)
// POST /api/announcements
router.post('/', authenticate, requireGardenAccess(), requireTeacher, createAnnouncement);

// Actualizar comunicado
// PUT /api/announcements/:announcementId
router.put('/:announcementId', authenticate, requireGardenAccess(), requireTeacher, updateAnnouncement);

// Confirmar lectura de comunicado
// POST /api/announcements/:announcementId/acknowledge
router.post('/:announcementId/acknowledge', authenticate, requireGardenAccess(), acknowledgeAnnouncement);

// Eliminar comunicado (solo admin o autor)
// DELETE /api/announcements/:announcementId
router.delete('/:announcementId', authenticate, requireGardenAccess(), requireTeacher, deleteAnnouncement);

module.exports = router;