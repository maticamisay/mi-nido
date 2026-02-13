const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireAdmin } = require('../middleware/auth');
const {
  getClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom
} = require('../controllers/classroomController');

// Obtener todas las salas del jardín
// GET /api/classrooms?gardenId=xxx
router.get('/', authenticate, requireGardenAccess('gardenId'), getClassrooms);

// Obtener sala específica
// GET /api/classrooms/:classroomId?gardenId=xxx
router.get('/:classroomId', authenticate, requireGardenAccess('gardenId'), getClassroom);

// Crear nueva sala (solo admin/owner)
// POST /api/classrooms
router.post('/', authenticate, requireGardenAccess(), requireAdmin, createClassroom);

// Actualizar sala (solo admin/owner)
// PUT /api/classrooms/:classroomId
router.put('/:classroomId', authenticate, requireGardenAccess(), requireAdmin, updateClassroom);

// Eliminar sala (solo admin/owner)
// DELETE /api/classrooms/:classroomId
router.delete('/:classroomId', authenticate, requireGardenAccess(), requireAdmin, deleteClassroom);

module.exports = router;