const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess, requireAdmin, requireChildAccess } = require('../middleware/auth');
const {
  getPayments,
  createMonthlyFees,
  recordPayment,
  getFamilyAccountStatus,
  getOverdueReport
} = require('../controllers/paymentController');

// Obtener reporte de morosos (solo admin)
// GET /api/payments/overdue?gardenId=xxx
router.get('/overdue', authenticate, requireGardenAccess('gardenId'), requireAdmin, getOverdueReport);

// Obtener estado de cuenta de una familia
// GET /api/payments/child/:childId?gardenId=xxx
router.get('/child/:childId', authenticate, requireGardenAccess('gardenId'), requireChildAccess, getFamilyAccountStatus);

// Obtener pagos del jardín con filtros
// GET /api/payments?gardenId=xxx&status=pending&period=2026-03&childId=xxx
router.get('/', authenticate, requireGardenAccess('gardenId'), getPayments);

// Crear cuotas mensuales automáticamente (solo admin)
// POST /api/payments/create-monthly
router.post('/create-monthly', authenticate, requireGardenAccess(), requireAdmin, createMonthlyFees);

// Registrar pago (solo admin)
// POST /api/payments/:paymentId/record
router.post('/:paymentId/record', authenticate, requireGardenAccess(), requireAdmin, recordPayment);

module.exports = router;