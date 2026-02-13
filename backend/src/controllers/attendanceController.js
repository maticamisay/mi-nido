const { Attendance, Child, Classroom } = require('../models');

// Obtener asistencia de una sala por fecha
const getAttendanceByDate = async (req, res) => {
  try {
    const { classroomId, date } = req.query;

    if (!classroomId || !date) {
      return res.status(400).json({
        error: 'classroomId y date son requeridos',
        code: 'MISSING_REQUIRED_PARAMS'
      });
    }

    // Verificar acceso a la sala
    const classroom = await Classroom.findById(classroomId);
    if (!classroom || classroom.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }

    // Obtener asistencia existente
    let attendance = await Attendance.findOne({
      classroomId,
      date
    }).populate('records.childId', 'firstName lastName nickname photo');

    // Si no existe, crear asistencia del día con todos los niños
    if (!attendance) {
      attendance = await Attendance.createDailyAttendance(classroomId, date, req.userId);
      await attendance.populate('records.childId', 'firstName lastName nickname photo');
    }

    res.json({ 
      attendance: {
        ...attendance.toObject(),
        summary: attendance.summary,
        classroom: {
          id: classroom._id,
          name: classroom.name,
          emoji: classroom.emoji
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo asistencia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Actualizar asistencia de un niño específico
const updateChildAttendance = async (req, res) => {
  try {
    const { classroomId, date, childId, status, justification, arrivedAt, leftAt, retiredBy, notes } = req.body;

    if (!classroomId || !date || !childId || !status) {
      return res.status(400).json({
        error: 'classroomId, date, childId y status son requeridos',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar que el niño pertenece a la sala
    const child = await Child.findById(childId);
    if (!child || child.classroomId.toString() !== classroomId || child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(400).json({
        error: 'Niño no válido para esta sala',
        code: 'INVALID_CHILD'
      });
    }

    // Obtener o crear asistencia del día
    let attendance = await Attendance.findOne({ classroomId, date });
    
    if (!attendance) {
      attendance = await Attendance.createDailyAttendance(classroomId, date, req.userId);
    }

    // Actualizar registro del niño
    await attendance.setChildAttendance(childId, {
      status,
      justification: status === 'justified' ? justification : null,
      arrivedAt,
      leftAt,
      retiredBy,
      notes
    });

    await attendance.populate('records.childId', 'firstName lastName nickname photo');

    res.json({
      message: `Asistencia de ${child.firstName} actualizada ✅`,
      attendance: {
        ...attendance.toObject(),
        summary: attendance.summary
      }
    });

  } catch (error) {
    console.error('Error actualizando asistencia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener asistencia por rango de fechas
const getAttendanceByRange = async (req, res) => {
  try {
    const { classroomId, startDate, endDate } = req.query;

    if (!classroomId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'classroomId, startDate y endDate son requeridos',
        code: 'MISSING_REQUIRED_PARAMS'
      });
    }

    // Verificar acceso a la sala
    const classroom = await Classroom.findById(classroomId);
    if (!classroom || classroom.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }

    const attendanceRecords = await Attendance.getAttendanceByDateRange(classroomId, startDate, endDate);

    res.json({
      attendance: attendanceRecords,
      classroom: {
        id: classroom._id,
        name: classroom.name,
        emoji: classroom.emoji
      }
    });

  } catch (error) {
    console.error('Error obteniendo asistencia por rango:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener reporte de asistencia de un niño
const getChildAttendanceReport = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    // Verificar acceso al niño
    const child = await Child.findById(childId).populate('classroomId', 'name');
    if (!child || child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    // Obtener asistencia del niño
    const attendanceRecords = await Attendance.find({
      classroomId: child.classroomId._id,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      'records.childId': childId
    }).select('date records');

    // Procesar datos para el reporte
    const report = {
      child: {
        id: child._id,
        name: child.fullName,
        classroom: child.classroomId.name
      },
      period: {
        startDate,
        endDate
      },
      attendance: [],
      summary: {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        justifiedDays: 0,
        lateDays: 0,
        attendanceRate: 0
      }
    };

    attendanceRecords.forEach(attendance => {
      const childRecord = attendance.records.find(r => r.childId.toString() === childId);
      if (childRecord) {
        report.attendance.push({
          date: attendance.date,
          status: childRecord.status,
          arrivedAt: childRecord.arrivedAt,
          leftAt: childRecord.leftAt,
          justification: childRecord.justification,
          notes: childRecord.notes
        });

        report.summary.totalDays++;
        if (childRecord.status === 'present') report.summary.presentDays++;
        if (childRecord.status === 'absent') report.summary.absentDays++;
        if (childRecord.status === 'justified') report.summary.justifiedDays++;
        if (childRecord.status === 'late') report.summary.lateDays++;
      }
    });

    // Calcular tasa de asistencia
    if (report.summary.totalDays > 0) {
      report.summary.attendanceRate = Math.round(
        ((report.summary.presentDays + report.summary.lateDays) / report.summary.totalDays) * 100
      );
    }

    res.json({ report });

  } catch (error) {
    console.error('Error obteniendo reporte de asistencia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener resumen de asistencia del jardín
const getGardenAttendanceSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Obtener todas las salas del jardín
    const classrooms = await Classroom.find({
      gardenId: req.gardenId,
      deletedAt: null
    }).select('name emoji color');

    // Obtener asistencia del día para todas las salas
    const attendancePromises = classrooms.map(async (classroom) => {
      const attendance = await Attendance.findOne({
        classroomId: classroom._id,
        date: targetDate
      });

      const totalChildren = await Child.countDocuments({
        classroomId: classroom._id,
        status: 'active',
        deletedAt: null
      });

      return {
        classroom: {
          id: classroom._id,
          name: classroom.name,
          emoji: classroom.emoji,
          color: classroom.color
        },
        totalChildren,
        attendance: attendance ? attendance.summary : {
          total: 0,
          present: 0,
          absent: totalChildren,
          justified: 0,
          late: 0,
          attendanceRate: 0
        },
        hasData: !!attendance
      };
    });

    const summary = await Promise.all(attendancePromises);

    // Calcular totales del jardín
    const gardenTotals = summary.reduce((totals, classroom) => {
      totals.totalChildren += classroom.totalChildren;
      totals.present += classroom.attendance.present;
      totals.absent += classroom.attendance.absent;
      totals.justified += classroom.attendance.justified;
      totals.late += classroom.attendance.late;
      return totals;
    }, { totalChildren: 0, present: 0, absent: 0, justified: 0, late: 0 });

    gardenTotals.attendanceRate = gardenTotals.totalChildren > 0 
      ? Math.round(((gardenTotals.present + gardenTotals.late) / gardenTotals.totalChildren) * 100)
      : 0;

    res.json({
      date: targetDate,
      gardenSummary: gardenTotals,
      classrooms: summary
    });

  } catch (error) {
    console.error('Error obteniendo resumen de asistencia del jardín:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getAttendanceByDate,
  updateChildAttendance,
  getAttendanceByRange,
  getChildAttendanceReport,
  getGardenAttendanceSummary
};