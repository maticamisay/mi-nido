const { CalendarEvent, Classroom } = require('../models');

// Obtener eventos del mes
const getMonthEvents = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        error: 'year y month son requeridos',
        code: 'MISSING_DATE_PARAMS'
      });
    }

    // Obtener salas del usuario si es docente
    let classroomIds = [];
    if (req.userRole === 'teacher') {
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      classroomIds = membership.classroomIds;
    }

    const events = await CalendarEvent.getMonthEvents(
      req.gardenId, 
      parseInt(year), 
      parseInt(month), 
      classroomIds
    );

    res.json({ 
      year: parseInt(year),
      month: parseInt(month),
      events 
    });

  } catch (error) {
    console.error('Error obteniendo eventos del mes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener eventos de hoy
const getTodayEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.getTodayEvents(req.gardenId);

    res.json({ 
      today: new Date().toISOString().split('T')[0],
      events 
    });

  } catch (error) {
    console.error('Error obteniendo eventos de hoy:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener próximos eventos
const getUpcomingEvents = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Obtener salas del usuario si es docente o familia
    let classroomIds = [];
    if (req.userRole === 'teacher' || req.userRole === 'family') {
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      classroomIds = membership.classroomIds;
    }

    const events = await CalendarEvent.getUpcomingEvents(
      req.gardenId, 
      parseInt(days), 
      classroomIds
    );

    res.json({ 
      days: parseInt(days),
      events 
    });

  } catch (error) {
    console.error('Error obteniendo próximos eventos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Crear nuevo evento
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      endDate,
      time,
      endTime,
      type,
      scope,
      classroomIds,
      color,
      location
    } = req.body;

    if (!title || !date || !type || !scope) {
      return res.status(400).json({
        error: 'title, date, type y scope son requeridos',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validar salas si es scope classroom
    if (scope === 'classroom') {
      if (!classroomIds || classroomIds.length === 0) {
        return res.status(400).json({
          error: 'Debe especificar al menos una sala para eventos por sala',
          code: 'MISSING_CLASSROOMS'
        });
      }

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

    const event = new CalendarEvent({
      gardenId: req.gardenId,
      title,
      description,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      time,
      endTime,
      type,
      scope,
      classroomIds: scope === 'classroom' ? classroomIds : [],
      color: color || '#F2A7B3',
      location,
      authorId: req.userId
    });

    await event.save();
    await event.populate('classroomIds', 'name emoji color');

    res.status(201).json({
      message: `Evento "${title}" creado exitosamente 📅`,
      event
    });

  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Actualizar evento
const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      date,
      endDate,
      time,
      endTime,
      type,
      scope,
      classroomIds,
      color,
      location,
      status
    } = req.body;

    const event = await CalendarEvent.findById(eventId);

    if (!event || event.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Evento no encontrado',
        code: 'EVENT_NOT_FOUND'
      });
    }

    // Solo el autor o admin pueden editar
    if (event.authorId.toString() !== req.userId.toString() && !['owner', 'admin'].includes(req.userRole)) {
      return res.status(403).json({
        error: 'Solo el autor o administradores pueden editar este evento',
        code: 'EDIT_PERMISSION_DENIED'
      });
    }

    // Actualizar campos
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (date) event.date = new Date(date);
    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : null;
    if (time !== undefined) event.time = time;
    if (endTime !== undefined) event.endTime = endTime;
    if (type) event.type = type;
    if (scope) event.scope = scope;
    if (color) event.color = color;
    if (location !== undefined) event.location = location;
    if (status) event.status = status;

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

      event.classroomIds = classroomIds;
    } else if (scope === 'garden') {
      event.classroomIds = [];
    }

    await event.save();
    await event.populate('classroomIds', 'name emoji color');

    res.json({
      message: `Evento "${event.title}" actualizado ✅`,
      event
    });

  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Eliminar evento
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await CalendarEvent.findById(eventId);

    if (!event || event.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Evento no encontrado',
        code: 'EVENT_NOT_FOUND'
      });
    }

    // Solo el autor o admin pueden eliminar
    if (event.authorId.toString() !== req.userId.toString() && !['owner', 'admin'].includes(req.userRole)) {
      return res.status(403).json({
        error: 'Solo el autor o administradores pueden eliminar este evento',
        code: 'DELETE_PERMISSION_DENIED'
      });
    }

    await event.deleteOne();

    res.json({
      message: `Evento "${event.title}" eliminado ✅`
    });

  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getMonthEvents,
  getTodayEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent
};