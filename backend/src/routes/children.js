const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireAdmin, requireTeacher, requireChildAccess } = require('../middleware/auth');
const {
  getChildren,
  getChild,
  createChild,
  updateChild,
  deleteChild,
  getChildRecord,
  getClassroomChildren
} = require('../controllers/childController');

// Obtener todos los niños del jardín (con filtros)
// GET /api/children?gardenId=xxx&classroomId=yyy&status=active&search=nombre
router.get('/', authenticate, requireGardenAccess('gardenId'), getChildren);

// Obtener niños de una sala específica (para docentes)
// GET /api/children/classroom/:classroomId?gardenId=xxx
router.get('/classroom/:classroomId', authenticate, requireGardenAccess('gardenId'), requireTeacher, getClassroomChildren);

// Obtener niño específico
// GET /api/children/:childId?gardenId=xxx
router.get('/:childId', authenticate, requireGardenAccess('gardenId'), requireChildAccess, getChild);

// Obtener expediente completo del niño
// GET /api/children/:childId/record?gardenId=xxx
router.get('/:childId/record', authenticate, requireGardenAccess('gardenId'), requireChildAccess, getChildRecord);

// Crear nuevo niño (solo admin/owner)
// POST /api/children
router.post('/', authenticate, requireGardenAccess(), requireAdmin, createChild);

// Actualizar niño
// PUT /api/children/:childId
// Admin puede editar todo, familias solo datos básicos y médicos
router.put('/:childId', authenticate, requireGardenAccess(), requireChildAccess, updateChild);

// Eliminar niño (solo admin/owner)
// DELETE /api/children/:childId
router.delete('/:childId', authenticate, requireGardenAccess(), requireAdmin, deleteChild);

module.exports = router;