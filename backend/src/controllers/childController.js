const { Child, Classroom, User } = require('../models');

// Obtener niños del jardín (con filtros)
const getChildren = async (req, res) => {
  try {
    const { classroomId, status = 'active', search } = req.query;
    
    // Construir query
    const query = {
      gardenId: req.gardenId,
      deletedAt: null
    };
    
    if (classroomId) query.classroomId = classroomId;
    if (status) query.status = status;
    
    // Filtro de búsqueda por nombre
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Si es familia, solo puede ver sus hijos
    if (req.userRole === 'family') {
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      query._id = { $in: membership.childrenIds };
    }
    
    const children = await Child.find(query)
      .populate('classroomId', 'name emoji color shift')
      .sort({ firstName: 1, lastName: 1 });

    res.json({ children });

  } catch (error) {
    console.error('Error obteniendo niños:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener niño por ID
const getChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId)
      .populate('classroomId', 'name emoji color shift fee')
      .populate('gardenId', 'name');

    if (!child || child.deletedAt) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    // Verificar acceso al jardín
    if (child.gardenId._id.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este niño',
        code: 'CHILD_ACCESS_DENIED'
      });
    }

    res.json({ child });

  } catch (error) {
    console.error('Error obteniendo niño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Crear nuevo niño
const createChild = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      nickname,
      birthDate,
      gender,
      dni,
      classroomId,
      shift,
      medical,
      authorizedPickups,
      emergencyContacts
    } = req.body;

    // Validaciones básicas
    if (!firstName || !lastName || !birthDate || !gender || !classroomId || !shift) {
      return res.status(400).json({
        error: 'Campos requeridos: firstName, lastName, birthDate, gender, classroomId, shift',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validar que la sala exista y pertenezca al jardín
    const classroom = await Classroom.findById(classroomId);
    if (!classroom || classroom.deletedAt || classroom.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(400).json({
        error: 'Sala no válida',
        code: 'INVALID_CLASSROOM'
      });
    }

    // Verificar capacidad de la sala
    const currentChildren = await Child.countDocuments({
      classroomId,
      status: 'active',
      deletedAt: null
    });

    if (currentChildren >= classroom.capacity) {
      return res.status(400).json({
        error: `La sala ${classroom.name} está completa (${classroom.capacity} niños)`,
        code: 'CLASSROOM_FULL'
      });
    }

    // Validar que tenga al menos un contacto de emergencia
    if (!emergencyContacts || emergencyContacts.length === 0) {
      return res.status(400).json({
        error: 'Debe incluir al menos un contacto de emergencia',
        code: 'MISSING_EMERGENCY_CONTACT'
      });
    }

    const child = new Child({
      gardenId: req.gardenId,
      classroomId,
      firstName,
      lastName,
      nickname,
      birthDate: new Date(birthDate),
      gender,
      dni,
      shift,
      medical: medical || {},
      authorizedPickups: authorizedPickups || [],
      emergencyContacts
    });

    await child.save();
    await child.populate('classroomId', 'name emoji color');

    res.status(201).json({
      message: `Niño ${firstName} ${lastName} registrado exitosamente 🎉`,
      child
    });

  } catch (error) {
    console.error('Error creando niño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Actualizar niño
const updateChild = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      nickname,
      birthDate,
      gender,
      dni,
      classroomId,
      shift,
      status,
      medical,
      authorizedPickups,
      emergencyContacts
    } = req.body;

    const child = await Child.findById(req.params.childId);

    if (!child || child.deletedAt) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    // Verificar acceso al jardín
    if (child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este niño',
        code: 'CHILD_ACCESS_DENIED'
      });
    }

    // Si se cambia de sala, validar la nueva sala
    if (classroomId && classroomId !== child.classroomId.toString()) {
      const newClassroom = await Classroom.findById(classroomId);
      if (!newClassroom || newClassroom.deletedAt || newClassroom.gardenId.toString() !== req.gardenId.toString()) {
        return res.status(400).json({
          error: 'Sala de destino no válida',
          code: 'INVALID_CLASSROOM'
        });
      }

      // Verificar capacidad de la nueva sala
      const currentChildren = await Child.countDocuments({
        classroomId,
        status: 'active',
        deletedAt: null,
        _id: { $ne: child._id } // Excluir el niño actual
      });

      if (currentChildren >= newClassroom.capacity) {
        return res.status(400).json({
          error: `La sala ${newClassroom.name} está completa`,
          code: 'CLASSROOM_FULL'
        });
      }

      child.classroomId = classroomId;
    }

    // Actualizar campos básicos
    if (firstName) child.firstName = firstName;
    if (lastName) child.lastName = lastName;
    if (nickname !== undefined) child.nickname = nickname;
    if (birthDate) child.birthDate = new Date(birthDate);
    if (gender) child.gender = gender;
    if (dni !== undefined) child.dni = dni;
    if (shift) child.shift = shift;
    if (status) child.status = status;

    // Actualizar información médica (merge con existente)
    if (medical) {
      child.medical = { ...child.medical, ...medical };
    }

    // Actualizar personas autorizadas
    if (authorizedPickups !== undefined) {
      child.authorizedPickups = authorizedPickups;
    }

    // Actualizar contactos de emergencia
    if (emergencyContacts !== undefined) {
      if (emergencyContacts.length === 0) {
        return res.status(400).json({
          error: 'Debe mantener al menos un contacto de emergencia',
          code: 'MISSING_EMERGENCY_CONTACT'
        });
      }
      child.emergencyContacts = emergencyContacts;
    }

    await child.save();
    await child.populate('classroomId', 'name emoji color');

    res.json({
      message: `Datos de ${child.firstName} actualizados correctamente ✅`,
      child
    });

  } catch (error) {
    console.error('Error actualizando niño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Eliminar niño (soft delete)
const deleteChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);

    if (!child || child.deletedAt) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    // Verificar acceso al jardín
    if (child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este niño',
        code: 'CHILD_ACCESS_DENIED'
      });
    }

    await child.softDelete();

    res.json({
      message: `${child.firstName} ${child.lastName} eliminado del sistema ✅`
    });

  } catch (error) {
    console.error('Error eliminando niño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener expediente completo del niño
const getChildRecord = async (req, res) => {
  try {
    const { DailyEntry, Attendance, Payment } = require('../models');
    
    const child = await Child.findById(req.params.childId)
      .populate('classroomId', 'name emoji color');

    if (!child || child.deletedAt) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    // Verificar acceso
    if (child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este niño',
        code: 'CHILD_ACCESS_DENIED'
      });
    }

    // Obtener estadísticas del último mes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const [recentEntries, recentAttendance, pendingPayments] = await Promise.all([
      DailyEntry.countDocuments({
        childId: child._id,
        date: { $gte: thirtyDaysAgoStr, $lte: todayStr },
        status: 'published'
      }),
      
      Attendance.countDocuments({
        'records.childId': child._id,
        'records.status': 'present',
        date: { $gte: thirtyDaysAgoStr, $lte: todayStr }
      }),
      
      Payment.countDocuments({
        childId: child._id,
        status: { $in: ['pending', 'overdue'] }
      })
    ]);

    res.json({
      child,
      stats: {
        recentDailyEntries: recentEntries,
        recentAttendanceDays: recentAttendance,
        pendingPayments
      }
    });

  } catch (error) {
    console.error('Error obteniendo expediente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener niños por sala (para docentes)
const getClassroomChildren = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    // Verificar acceso a la sala
    const classroom = await Classroom.findById(req.params.classroomId);
    if (!classroom || classroom.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }
    
    // Si es docente, verificar que tenga acceso a esta sala
    if (req.userRole === 'teacher') {
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      
      const hasClassroomAccess = membership.classroomIds.some(id => 
        id.toString() === req.params.classroomId.toString()
      );
      
      if (!hasClassroomAccess) {
        return res.status(403).json({
          error: 'No tienes acceso a esta sala',
          code: 'CLASSROOM_ACCESS_DENIED'
        });
      }
    }

    const children = await Child.find({
      classroomId: req.params.classroomId,
      status,
      deletedAt: null
    }).sort({ firstName: 1 });

    res.json({
      classroom: {
        id: classroom._id,
        name: classroom.name,
        emoji: classroom.emoji
      },
      children
    });

  } catch (error) {
    console.error('Error obteniendo niños de la sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getChildren,
  getChild,
  createChild,
  updateChild,
  deleteChild,
  getChildRecord,
  getClassroomChildren
};