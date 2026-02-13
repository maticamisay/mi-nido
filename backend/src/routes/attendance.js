const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireTeacher, requireChildAccess } = require('../middleware/auth');
const {
  getAttendanceByDate,
  updateChildAttendance,
  getAttendanceByRange,
  getChildAttendanceReport,
  getGardenAttendanceSummary
} = require('../controllers/attendanceController');

// Obtener resumen de asistencia del jardín por fecha
// GET /api/attendance/summary?gardenId=xxx&date=YYYY-MM-DD
router.get('/summary', authenticate, requireGardenAccess('gardenId'), getGardenAttendanceSummary);

// Obtener asistencia de una sala por fecha específica
// GET /api/attendance?gardenId=xxx&classroomId=yyy&date=YYYY-MM-DD
router.get('/', authenticate, requireGardenAccess('gardenId'), requireTeacher, getAttendanceByDate);

// Obtener asistencia por rango de fechas
// GET /api/attendance/range?gardenId=xxx&classroomId=yyy&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/range', authenticate, requireGardenAccess('gardenId'), requireTeacher, getAttendanceByRange);

// Obtener reporte de asistencia de un niño específico
// GET /api/attendance/child/:childId?gardenId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/child/:childId', authenticate, requireGardenAccess('gardenId'), requireChildAccess, getChildAttendanceReport);

// Actualizar asistencia de un niño (solo docentes o superior)
// PUT /api/attendance
router.put('/', authenticate, requireGardenAccess(), requireTeacher, updateChildAttendance);

module.exports = router;