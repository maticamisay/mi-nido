const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireTeacher, requireAdmin } = require('../middleware/auth');
const {
  getMonthEvents,
  getTodayEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/calendarEventController');

// Obtener eventos de hoy
// GET /api/calendar/today?gardenId=xxx
router.get('/today', authenticate, requireGardenAccess('gardenId'), getTodayEvents);

// Obtener próximos eventos
// GET /api/calendar/upcoming?gardenId=xxx&days=7
router.get('/upcoming', authenticate, requireGardenAccess('gardenId'), getUpcomingEvents);

// Obtener eventos del mes
// GET /api/calendar/month?gardenId=xxx&year=2026&month=3
router.get('/month', authenticate, requireGardenAccess('gardenId'), getMonthEvents);

// Crear nuevo evento (solo docentes o superior)
// POST /api/calendar
router.post('/', authenticate, requireGardenAccess(), requireTeacher, createEvent);

// Actualizar evento
// PUT /api/calendar/:eventId
router.put('/:eventId', authenticate, requireGardenAccess(), requireTeacher, updateEvent);

// Eliminar evento
// DELETE /api/calendar/:eventId
router.delete('/:eventId', authenticate, requireGardenAccess(), deleteEvent);

module.exports = router;