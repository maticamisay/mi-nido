const { Classroom, Child, User } = require('../models');

// Obtener todas las salas del jardín
const getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      gardenId: req.gardenId,
      deletedAt: null
    })
    .populate('teacherIds', 'profile.firstName profile.lastName')
    .sort({ name: 1 });

    // Agregar conteo de niños por sala
    const classroomsWithCounts = await Promise.all(
      classrooms.map(async (classroom) => {
        const childCount = await Child.countDocuments({
          classroomId: classroom._id,
          status: 'active',
          deletedAt: null
        });

        return {
          ...classroom.toObject(),
          childCount,
          hasCapacity: childCount < classroom.capacity
        };
      })
    );

    res.json({ classrooms: classroomsWithCounts });

  } catch (error) {
    console.error('Error obteniendo salas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener sala por ID
const getClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId)
      .populate('teacherIds', 'profile.firstName profile.lastName profile.avatar email');

    if (!classroom || classroom.deletedAt) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }

    // Verificar acceso al jardín
    if (classroom.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a esta sala',
        code: 'CLASSROOM_ACCESS_DENIED'
      });
    }

    // Obtener niños de la sala
    const children = await Child.find({
      classroomId: classroom._id,
      status: 'active',
      deletedAt: null
    }).select('firstName lastName nickname birthDate photo');

    res.json({
      classroom: {
        ...classroom.toObject(),
        children
      }
    });

  } catch (error) {
    console.error('Error obteniendo sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Crear nueva sala
const createClassroom = async (req, res) => {
  try {
    const {
      name,
      emoji,
      color,
      ageRange,
      shift,
      capacity,
      teacherIds,
      fee
    } = req.body;

    // Validaciones básicas
    if (!name || !ageRange || !shift || !capacity || !fee) {
      return res.status(400).json({
        error: 'Campos requeridos: name, ageRange, shift, capacity, fee',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validar que las docentes existan y tengan acceso al jardín
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await User.find({
        _id: { $in: teacherIds },
        'memberships.gardenId': req.gardenId,
        'memberships.role': { $in: ['teacher', 'admin', 'owner'] }
      });

      if (teachers.length !== teacherIds.length) {
        return res.status(400).json({
          error: 'Alguna de las docentes no tiene acceso a este jardín',
          code: 'INVALID_TEACHER'
        });
      }
    }

    const classroom = new Classroom({
      gardenId: req.gardenId,
      name,
      emoji: emoji || "🐥",
      color: color || "#FDE8A0",
      ageRange,
      shift,
      capacity,
      teacherIds: teacherIds || [],
      fee
    });

    await classroom.save();

    // Actualizar memberships de las docentes para incluir esta sala
    if (teacherIds && teacherIds.length > 0) {
      await User.updateMany(
        {
          _id: { $in: teacherIds },
          'memberships.gardenId': req.gardenId
        },
        {
          $addToSet: { 'memberships.$.classroomIds': classroom._id }
        }
      );
    }

    await classroom.populate('teacherIds', 'profile.firstName profile.lastName');

    res.status(201).json({
      message: `Sala "${name}" creada exitosamente 🎉`,
      classroom
    });

  } catch (error) {
    console.error('Error creando sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Actualizar sala
const updateClassroom = async (req, res) => {
  try {
    const {
      name,
      emoji,
      color,
      ageRange,
      shift,
      capacity,
      teacherIds,
      fee
    } = req.body;

    const classroom = await Classroom.findById(req.params.classroomId);

    if (!classroom || classroom.deletedAt) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }

    // Verificar acceso al jardín
    if (classroom.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a esta sala',
        code: 'CLASSROOM_ACCESS_DENIED'
      });
    }

    // Validar capacidad vs niños actuales si se está reduciendo
    if (capacity && capacity < classroom.capacity) {
      const currentChildren = await Child.countDocuments({
        classroomId: classroom._id,
        status: 'active',
        deletedAt: null
      });

      if (capacity < currentChildren) {
        return res.status(400).json({
          error: `No puedes reducir la capacidad a ${capacity}. Hay ${currentChildren} niños activos en la sala.`,
          code: 'CAPACITY_TOO_LOW'
        });
      }
    }

    // Actualizar campos
    if (name) classroom.name = name;
    if (emoji) classroom.emoji = emoji;
    if (color) classroom.color = color;
    if (ageRange) classroom.ageRange = ageRange;
    if (shift) classroom.shift = shift;
    if (capacity) classroom.capacity = capacity;
    if (fee) classroom.fee = { ...classroom.fee, ...fee };

    // Actualizar docentes si se especificaron
    if (teacherIds !== undefined) {
      // Remover esta sala de las docentes anteriores
      await User.updateMany(
        {
          _id: { $in: classroom.teacherIds },
          'memberships.gardenId': req.gardenId
        },
        {
          $pull: { 'memberships.$.classroomIds': classroom._id }
        }
      );

      // Validar nuevas docentes
      if (teacherIds.length > 0) {
        const teachers = await User.find({
          _id: { $in: teacherIds },
          'memberships.gardenId': req.gardenId,
          'memberships.role': { $in: ['teacher', 'admin', 'owner'] }
        });

        if (teachers.length !== teacherIds.length) {
          return res.status(400).json({
            error: 'Alguna de las docentes no tiene acceso a este jardín',
            code: 'INVALID_TEACHER'
          });
        }

        // Agregar sala a nuevas docentes
        await User.updateMany(
          {
            _id: { $in: teacherIds },
            'memberships.gardenId': req.gardenId
          },
          {
            $addToSet: { 'memberships.$.classroomIds': classroom._id }
          }
        );
      }

      classroom.teacherIds = teacherIds;
    }

    await classroom.save();
    await classroom.populate('teacherIds', 'profile.firstName profile.lastName');

    res.json({
      message: `Sala "${classroom.name}" actualizada exitosamente ✅`,
      classroom
    });

  } catch (error) {
    console.error('Error actualizando sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Eliminar sala (soft delete)
const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);

    if (!classroom || classroom.deletedAt) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }

    // Verificar acceso al jardín
    if (classroom.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a esta sala',
        code: 'CLASSROOM_ACCESS_DENIED'
      });
    }

    // Verificar que no tenga niños activos
    const activeChildren = await Child.countDocuments({
      classroomId: classroom._id,
      status: 'active',
      deletedAt: null
    });

    if (activeChildren > 0) {
      return res.status(400).json({
        error: `No puedes eliminar la sala. Hay ${activeChildren} niños activos.`,
        code: 'CLASSROOM_HAS_CHILDREN'
      });
    }

    // Soft delete
    await classroom.softDelete();

    // Remover sala de docentes
    await User.updateMany(
      {
        _id: { $in: classroom.teacherIds },
        'memberships.gardenId': req.gardenId
      },
      {
        $pull: { 'memberships.$.classroomIds': classroom._id }
      }
    );

    res.json({
      message: `Sala "${classroom.name}" eliminada exitosamente ✅`
    });

  } catch (error) {
    console.error('Error eliminando sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom
};