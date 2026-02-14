const mongoose = require('mongoose');
const { DailyEntry, Child, Classroom } = require('../models');

// Obtener entradas del cuaderno por fecha y sala
const getDailyEntriesByDate = async (req, res) => {
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

    const entries = await DailyEntry.find({
      classroomId,
      date,
      status: 'published'
    })
    .populate('childId', 'firstName lastName nickname photo')
    .populate('authorId', 'profile.firstName profile.lastName')
    .sort({ updatedAt: -1 });

    res.json({
      date,
      classroom: {
        id: classroom._id,
        name: classroom.name,
        emoji: classroom.emoji
      },
      entries
    });

  } catch (error) {
    console.error('Error obteniendo entradas del día:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener entrada específica de un niño por fecha
const getChildDailyEntry = async (req, res) => {
  try {
    const { childId, date } = req.params;

    // Verificar acceso al niño
    const child = await Child.findById(childId);
    if (!child || child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    const entry = await DailyEntry.findOne({
      childId,
      date
    })
    .populate('childId', 'firstName lastName nickname photo')
    .populate('authorId', 'profile.firstName profile.lastName')
    .populate('classroomId', 'name emoji color');

    if (!entry) {
      return res.status(404).json({
        error: 'Entrada no encontrada para esta fecha',
        code: 'ENTRY_NOT_FOUND'
      });
    }

    res.json({ entry });

  } catch (error) {
    console.error('Error obteniendo entrada del niño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Crear o actualizar entrada del cuaderno digital
const createOrUpdateDailyEntry = async (req, res) => {
  try {
    const {
      childId,
      date,
      meals,
      nap,
      hygiene,
      activities,
      mood,
      observations,
      status = 'draft'
    } = req.body;

    if (!childId || !date) {
      return res.status(400).json({
        error: 'childId y date son requeridos',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar acceso al niño
    const child = await Child.findById(childId);
    if (!child || child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(400).json({
        error: 'Niño no válido',
        code: 'INVALID_CHILD'
      });
    }

    // Buscar entrada existente
    let entry = await DailyEntry.findOne({ childId, date });

    if (entry) {
      // Actualizar entrada existente
      if (meals !== undefined) entry.meals = meals;
      if (nap !== undefined) entry.nap = { ...entry.nap, ...nap };
      if (hygiene !== undefined) entry.hygiene = { ...entry.hygiene, ...hygiene };
      if (activities !== undefined) entry.activities = activities;
      if (mood !== undefined) entry.mood = mood;
      if (observations !== undefined) entry.observations = observations;
      if (status !== undefined) entry.status = status;
      
      // Si se publica, actualizar timestamp
      if (status === 'published') {
        entry.publishedAt = new Date();
      }

      await entry.save();
      
      res.json({
        message: `Cuaderno de ${child.firstName} actualizado ✅`,
        entry
      });
    } else {
      // Crear nueva entrada
      entry = new DailyEntry({
        gardenId: req.gardenId,
        classroomId: child.classroomId,
        childId,
        date,
        meals: meals || [],
        nap: nap || { slept: false },
        hygiene: hygiene || { diaperChanges: 0 },
        activities: activities || [],
        mood: mood || 'contento',
        observations: observations || '',
        status,
        authorId: req.userId
      });

      await entry.save();

      res.status(201).json({
        message: `Cuaderno de ${child.firstName} creado ✅`,
        entry
      });
    }

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Ya existe una entrada para este niño en esta fecha',
        code: 'DUPLICATE_ENTRY'
      });
    }

    console.error('Error creando/actualizando entrada:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Agregar foto a una entrada
const addPhoto = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { photoUrl, caption } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        error: 'photoUrl es requerido',
        code: 'MISSING_PHOTO_URL'
      });
    }

    const entry = await DailyEntry.findById(entryId);
    if (!entry || entry.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Entrada no encontrada',
        code: 'ENTRY_NOT_FOUND'
      });
    }

    await entry.addPhoto(photoUrl, caption);

    res.json({
      message: 'Foto agregada exitosamente 📷',
      photos: entry.photos
    });

  } catch (error) {
    console.error('Error agregando foto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener entradas de un niño por rango de fechas
const getChildEntriesByRange = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate, limit = 20 } = req.query;

    // Verificar acceso al niño
    const child = await Child.findById(childId);
    if (!child || child.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Niño no encontrado',
        code: 'CHILD_NOT_FOUND'
      });
    }

    let query = { childId, status: 'published' };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    const entries = await DailyEntry.find(query)
      .populate('authorId', 'profile.firstName profile.lastName')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      child: {
        id: child._id,
        name: child.fullName,
        photo: child.photo
      },
      entries
    });

  } catch (error) {
    console.error('Error obteniendo entradas del niño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Marcar entrada como vista por familia
const markEntryAsSeen = async (req, res) => {
  try {
    const { entryId } = req.params;

    const entry = await DailyEntry.findById(entryId);
    if (!entry || entry.gardenId.toString() !== req.gardenId.toString()) {
      return res.status(404).json({
        error: 'Entrada no encontrada',
        code: 'ENTRY_NOT_FOUND'
      });
    }

    await entry.markAsSeenBy(req.userId);

    res.json({
      message: 'Entrada marcada como vista ✅'
    });

  } catch (error) {
    console.error('Error marcando entrada como vista:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener feed del cuaderno digital para familias
const getFamilyFeed = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    
    // Obtener hijos de la familia
    const membership = req.user.memberships.find(m => 
      m.gardenId.toString() === req.gardenId.toString()
    );

    if (!membership || membership.role !== 'family') {
      return res.status(403).json({
        error: 'Solo las familias pueden acceder al feed',
        code: 'FAMILY_ONLY'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await DailyEntry.find({
      childId: { $in: membership.childrenIds },
      status: 'published'
    })
    .populate('childId', 'firstName lastName nickname photo')
    .populate('authorId', 'profile.firstName profile.lastName')
    .populate('classroomId', 'name emoji color')
    .sort({ date: -1, updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Marcar como vistas automáticamente
    const unseenEntries = entries.filter(entry => 
      !entry.seenBy.some(seen => seen.userId.toString() === req.userId.toString())
    );

    if (unseenEntries.length > 0) {
      await Promise.all(
        unseenEntries.map(entry => entry.markAsSeenBy(req.userId))
      );
    }

    res.json({
      entries: entries.map(entry => ({
        ...entry.toObject(),
        hasBeenSeen: true // Ya que las marcamos como vistas
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: entries.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo feed familiar:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener estadísticas de entradas del cuaderno
const getDailyEntryStats = async (req, res) => {
  try {
    const { classroomId, startDate, endDate } = req.query;

    let matchQuery = {
      gardenId: new mongoose.Types.ObjectId(req.gardenId),
      status: 'published'
    };

    if (classroomId) matchQuery.classroomId = new mongoose.Types.ObjectId(classroomId);
    if (startDate && endDate) {
      matchQuery.date = { $gte: startDate, $lte: endDate };
    }

    const stats = await DailyEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalPhotos: { $sum: { $size: '$photos' } },
          avgPhotosPerEntry: { $avg: { $size: '$photos' } },
          activitiesByType: {
            $push: {
              $map: {
                input: '$activities',
                as: 'activity',
                in: '$$activity.type'
              }
            }
          },
          moodDistribution: { $push: '$mood' }
        }
      }
    ]);

    // Procesar datos
    const result = stats[0] || {
      totalEntries: 0,
      totalPhotos: 0,
      avgPhotosPerEntry: 0,
      activitiesByType: [],
      moodDistribution: []
    };

    // Contar actividades por tipo
    const activityCounts = {};
    result.activitiesByType.flat().forEach(type => {
      activityCounts[type] = (activityCounts[type] || 0) + 1;
    });

    // Contar estados de ánimo
    const moodCounts = {};
    result.moodDistribution.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    res.json({
      stats: {
        totalEntries: result.totalEntries,
        totalPhotos: result.totalPhotos,
        avgPhotosPerEntry: Math.round(result.avgPhotosPerEntry * 10) / 10,
        activitiesByType: activityCounts,
        moodDistribution: moodCounts
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getDailyEntriesByDate,
  getChildDailyEntry,
  createOrUpdateDailyEntry,
  addPhoto,
  getChildEntriesByRange,
  markEntryAsSeen,
  getFamilyFeed,
  getDailyEntryStats
};