const { Payment, Child, Classroom } = require('../models');

// Obtener pagos del jardín con filtros
const getPayments = async (req, res) => {
  try {
    const { status, childId, period, classroomId, limit = 50, page = 1 } = req.query;
    
    let query = { gardenId: req.gardenId };
    
    if (status) query.status = status;
    if (childId) query.childId = childId;
    if (period) query.period = period;
    if (classroomId) query.classroomId = classroomId;

    // Si es familia, solo ver pagos de sus hijos
    if (req.userRole === 'family') {
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      query.childId = { $in: membership.childrenIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await Payment.find(query)
      .populate('childId', 'firstName lastName')
      .populate('classroomId', 'name emoji')
      .populate('recordedBy', 'profile.firstName profile.lastName')
      .sort({ dueDate: -1, period: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ 
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: payments.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Crear cuotas mensuales automáticamente
const createMonthlyFees = async (req, res) => {
  try {
    const { period, classroomId } = req.body;

    if (!period) {
      return res.status(400).json({
        error: 'Período es requerido (formato YYYY-MM)',
        code: 'MISSING_PERIOD'
      });
    }

    // Obtener salas (todas o una específica)
    let classrooms;
    if (classroomId) {
      classrooms = await Classroom.find({ 
        _id: classroomId, 
        gardenId: req.gardenId, 
        deletedAt: null 
      });
    } else {
      classrooms = await Classroom.find({ 
        gardenId: req.gardenId, 
        deletedAt: null 
      });
    }

    let totalCreated = 0;
    let errors = [];

    for (const classroom of classrooms) {
      // Obtener niños activos de la sala
      const children = await Child.find({
        classroomId: classroom._id,
        status: 'active',
        deletedAt: null
      });

      for (const child of children) {
        try {
          // Verificar si ya existe pago para este período
          const existingPayment = await Payment.findOne({
            childId: child._id,
            period
          });

          if (!existingPayment) {
            await Payment.createMonthlyFee(
              child._id,
              period,
              classroom.fee.amount,
              classroom.fee.dueDay
            );
            totalCreated++;
          }
        } catch (error) {
          errors.push(`Error creando cuota para ${child.firstName} ${child.lastName}: ${error.message}`);
        }
      }
    }

    res.json({
      message: `✅ ${totalCreated} cuotas creadas para el período ${period}`,
      created: totalCreated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error creando cuotas mensuales:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Registrar pago
const recordPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, method, reference, notes } = req.body;

    if (!amount || !method) {
      return res.status(400).json({
        error: 'amount y method son requeridos',
        code: 'MISSING_PAYMENT_DATA'
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate('childId', 'firstName lastName');

    if (!payment || payment.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    await payment.recordPayment(amount, method, reference, notes, req.userId);

    res.json({
      message: `Pago de ${payment.childId.firstName} registrado ✅`,
      payment
    });

  } catch (error) {
    console.error('Error registrando pago:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener estado de cuenta de una familia
const getFamilyAccountStatus = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verificar acceso al niño
    const child = await Child.findById(childId);
    if (!child || child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    const payments = await Payment.getAccountStatus(req.gardenId, [childId]);
    
    // Calcular totales
    const totals = payments.reduce((acc, payment) => {
      acc.totalAmount += payment.amount;
      acc.totalPaid += payment.paidAmount;
      acc.totalBalance += payment.balance;
      if (payment.isOverdue) acc.overdueCount++;
      return acc;
    }, {
      totalAmount: 0,
      totalPaid: 0,
      totalBalance: 0,
      overdueCount: 0
    });

    res.json({
      child: {
        id: child._id,
        name: child.fullName
      },
      payments,
      totals
    });

  } catch (error) {
    console.error('Error obteniendo estado de cuenta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener reporte de morosos
const getOverdueReport = async (req, res) => {
  try {
    const overduePayments = await Payment.getOverduePayments(req.gardenId);
    
    // Agrupar por niño
    const reportByChild = {};
    overduePayments.forEach(payment => {
      const childId = payment.childId._id.toString();
      if (!reportByChild[childId]) {
        reportByChild[childId] = {
          child: payment.childId,
          classroom: payment.classroomId,
          payments: [],
          totalOverdue: 0,
          oldestOverdue: payment.dueDate
        };
      }
      
      reportByChild[childId].payments.push(payment);
      reportByChild[childId].totalOverdue += payment.balance;
      
      if (payment.dueDate < reportByChild[childId].oldestOverdue) {
        reportByChild[childId].oldestOverdue = payment.dueDate;
      }
    });

    const report = Object.values(reportByChild).sort((a, b) => a.oldestOverdue - b.oldestOverdue);

    res.json({
      overdueCount: report.length,
      totalOverdueAmount: report.reduce((sum, item) => sum + item.totalOverdue, 0),
      report
    });

  } catch (error) {
    console.error('Error obteniendo reporte de morosos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getPayments,
  createMonthlyFees,
  recordPayment,
  getFamilyAccountStatus,
  getOverdueReport
};