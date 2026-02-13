const { Announcement, Classroom } = require('../models');

// Obtener comunicados relevantes para el usuario
const getAnnouncements = async (req, res) => {
  try {
    const { status = 'published', limit = 20, page = 1 } = req.query;
    
    // Obtener salas del usuario (para filtrar comunicados)
    let classroomIds = [];
    if (req.userRole === 'teacher') {
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      classroomIds = membership.classroomIds;
    } else if (req.userRole === 'family') {
      // Obtener salas de los hijos de la familia
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      // TODO: obtener classroomIds de los hijos
    }

    const announcements = await Announcement.getRelevantForUser(req.userId, req.gardenId, classroomIds);

    res.json({
      announcements: announcements.slice((page - 1) * limit, page * limit),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: announcements.length > page * limit
      }
    });

  } catch (error) {
    console.error('Error obteniendo comunicados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener comunicado específico
const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.announcementId)
      .populate('authorId', 'profile.firstName profile.lastName')
      .populate('classroomIds', 'name emoji color');

    if (!announcement || announcement.deletedAt) {
      return res.status(404).json({
        error: 'Comunicado no encontrado',
        code: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }

    // Verificar acceso al jardín
    if (announcement.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este comunicado',
        code: 'ANNOUNCEMENT_ACCESS_DENIED'
      });
    }

    res.json({ announcement });

  } catch (error) {
    console.error('Error obteniendo comunicado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Crear nuevo comunicado
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      body,
      scope,
      classroomIds,
      requiresAck,
      pinned,
      urgent,
      attachments,
      status = 'draft'
    } = req.body;

    if (!title || !body || !scope) {
      return res.status(400).json({
        error: 'title, body y scope son requeridos',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validar salas si es scope classroom
    if (scope === 'classroom') {
      if (!classroomIds || classroomIds.length === 0) {
        return res.status(400).json({
          error: 'Debe especificar al menos una sala para comunicados por sala',
          code: 'MISSING_CLASSROOMS'
        });
      }

      // Verificar que las salas existen y pertenecen al jardín
      const classrooms = await Classroom.find({
        _id: { $in: classroomIds },
        gardenId: req.gardenId,
        deletedAt: null
      });

      if (classrooms.length !== classroomIds.length) {
        return res.status(400).json({
          error: 'Alguna de las salas especificadas no es válida',
          code: 'INVALID_CLASSROOMS'
        });
      }
    }

    const announcement = new Announcement({
      gardenId: req.gardenId,
      title,
      body,
      scope,
      classroomIds: scope === 'classroom' ? classroomIds : [],
      requiresAck: requiresAck || false,
      pinned: pinned || false,
      urgent: urgent || false,
      attachments: attachments || [],
      status,
      authorId: req.userId
    });

    await announcement.save();
    await announcement.populate('classroomIds', 'name emoji color');

    res.status(201).json({
      message: `Comunicado "${title}" creado exitosamente 📢`,
      announcement
    });

  } catch (error) {
    console.error('Error creando comunicado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Actualizar comunicado
const updateAnnouncement = async (req, res) => {
  try {
    const {
      title,
      body,
      scope,
      classroomIds,
      requiresAck,
      pinned,
      urgent,
      attachments,
      status
    } = req.body;

    const announcement = await Announcement.findById(req.params.announcementId);

    if (!announcement || announcement.deletedAt) {
      return res.status(404).json({
        error: 'Comunicado no encontrado',
        code: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }

    // Verificar acceso
    if (announcement.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este comunicado',
        code: 'ANNOUNCEMENT_ACCESS_DENIED'
      });
    }

    // Solo el autor o admin pueden editar
    if (announcement.authorId.toString() !== req.userId.toString() && !['owner', 'admin'].includes(req.userRole)) {
      return res.status(403).json({
        error: 'Solo el autor o administradores pueden editar este comunicado',
        code: 'EDIT_PERMISSION_DENIED'
      });
    }

    // Actualizar campos
    if (title) announcement.title = title;
    if (body) announcement.body = body;
    if (scope) announcement.scope = scope;
    if (requiresAck !== undefined) announcement.requiresAck = requiresAck;
    if (pinned !== undefined) announcement.pinned = pinned;
    if (urgent !== undefined) announcement.urgent = urgent;
    if (attachments !== undefined) announcement.attachments = attachments;
    if (status) announcement.status = status;

    // Manejar classroomIds según scope
    if (scope === 'classroom' && classroomIds) {
      const classrooms = await Classroom.find({
        _id: { $in: classroomIds },
        gardenId: req.gardenId,
        deletedAt: null
      });

      if (classrooms.length !== classroomIds.length) {
        return res.status(400).json({
          error: 'Alguna de las salas especificadas no es válida',
          code: 'INVALID_CLASSROOMS'
        });
      }

      announcement.classroomIds = classroomIds;
    } else if (scope === 'garden') {
      announcement.classroomIds = [];
    }

    await announcement.save();
    await announcement.populate('classroomIds', 'name emoji color');

    res.json({
      message: `Comunicado "${announcement.title}" actualizado ✅`,
      announcement
    });

  } catch (error) {
    console.error('Error actualizando comunicado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Confirmar lectura de comunicado
const acknowledgeAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.announcementId);

    if (!announcement || announcement.deletedAt) {
      return res.status(404).json({
        error: 'Comunicado no encontrado',
        code: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }

    if (announcement.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este comunicado',
        code: 'ANNOUNCEMENT_ACCESS_DENIED'
      });
    }

    if (!announcement.requiresAck) {
      return res.status(400).json({
        error: 'Este comunicado no requiere confirmación de lectura',
        code: 'ACK_NOT_REQUIRED'
      });
    }

    await announcement.acknowledge(req.userId);

    res.json({
      message: 'Lectura confirmada ✅'
    });

  } catch (error) {
    console.error('Error confirmando lectura:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Eliminar comunicado
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.announcementId);

    if (!announcement || announcement.deletedAt) {
      return res.status(404).json({
        error: 'Comunicado no encontrado',
        code: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }

    if (announcement.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(403).json({
        error: 'No tienes acceso a este comunicado',
        code: 'ANNOUNCEMENT_ACCESS_DENIED'
      });
    }

    await announcement.softDelete();

    res.json({
      message: `Comunicado "${announcement.title}" eliminado ✅`
    });

  } catch (error) {
    console.error('Error eliminando comunicado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  acknowledgeAnnouncement,
  deleteAnnouncement
};