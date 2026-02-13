const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireTeacher, requireChildAccess, requireRole } = require('../middleware/auth');
const {
  getDailyEntriesByDate,
  getChildDailyEntry,
  createOrUpdateDailyEntry,
  addPhoto,
  getChildEntriesByRange,
  markEntryAsSeen,
  getFamilyFeed,
  getDailyEntryStats
} = require('../controllers/dailyEntryController');

// Obtener feed del cuaderno digital para familias
// GET /api/daily-entries/feed?gardenId=xxx&limit=10&page=1
router.get('/feed', authenticate, requireGardenAccess('gardenId'), requireRole('family'), getFamilyFeed);

// Obtener estadísticas de entradas del cuaderno
// GET /api/daily-entries/stats?gardenId=xxx&classroomId=yyy&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/stats', authenticate, requireGardenAccess('gardenId'), requireTeacher, getDailyEntryStats);

// Obtener entradas del cuaderno por fecha y sala
// GET /api/daily-entries?gardenId=xxx&classroomId=yyy&date=YYYY-MM-DD
router.get('/', authenticate, requireGardenAccess('gardenId'), requireTeacher, getDailyEntriesByDate);

// Obtener entradas de un niño por rango de fechas
// GET /api/daily-entries/child/:childId?gardenId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=20
router.get('/child/:childId', authenticate, requireGardenAccess('gardenId'), requireChildAccess, getChildEntriesByRange);

// Obtener entrada específica de un niño por fecha
// GET /api/daily-entries/child/:childId/:date?gardenId=xxx
router.get('/child/:childId/:date', authenticate, requireGardenAccess('gardenId'), requireChildAccess, getChildDailyEntry);

// Crear o actualizar entrada del cuaderno digital (solo docentes o superior)
// POST /api/daily-entries
router.post('/', authenticate, requireGardenAccess(), requireTeacher, createOrUpdateDailyEntry);

// Actualizar entrada del cuaderno digital (solo docentes o superior)
// PUT /api/daily-entries
router.put('/', authenticate, requireGardenAccess(), requireTeacher, createOrUpdateDailyEntry);

// Agregar foto a una entrada (solo docentes o superior)
// POST /api/daily-entries/:entryId/photos
router.post('/:entryId/photos', authenticate, requireGardenAccess(), requireTeacher, addPhoto);

// Marcar entrada como vista por familia
// POST /api/daily-entries/:entryId/seen
router.post('/:entryId/seen', authenticate, requireGardenAccess(), markEntryAsSeen);

module.exports = router;