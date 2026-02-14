const mongoose = require('mongoose');
const { Garden, User } = require('../models');

// Obtener jardines del usuario
const getMyGardens = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'memberships.gardenId',
      select: 'name slug address phone email logo settings subscription',
      match: { deletedAt: null }
    });

    const gardens = user.memberships
      .filter(m => m.status === 'active' && m.gardenId)
      .map(m => ({
        id: m.gardenId._id,
        name: m.gardenId.name,
        slug: m.gardenId.slug,
        address: m.gardenId.address,
        phone: m.gardenId.phone,
        email: m.gardenId.email,
        logo: m.gardenId.logo,
        settings: m.gardenId.settings,
        subscription: m.gardenId.subscription,
        role: m.role,
        joinedAt: m.joinedAt
      }));

    res.json({ gardens });

  } catch (error) {
    console.error('Error obteniendo jardines:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener jardín por ID
const getGarden = async (req, res) => {
  try {
    const garden = await Garden.findById(req.gardenId).select('-deletedAt');
    
    if (!garden) {
      return res.status(404).json({
        error: 'Jardín no encontrado',
        code: 'GARDEN_NOT_FOUND'
      });
    }

    res.json({ garden });

  } catch (error) {
    console.error('Error obteniendo jardín:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Actualizar jardín (solo owner/admin)
const updateGarden = async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      email,
      settings
    } = req.body;

    const garden = await Garden.findById(req.gardenId);
    
    if (!garden) {
      return res.status(404).json({
        error: 'Jardín no encontrado',
        code: 'GARDEN_NOT_FOUND'
      });
    }

    // Actualizar campos
    if (name) garden.name = name;
    if (address) garden.address = { ...garden.address, ...address };
    if (phone) garden.phone = phone;
    if (email) garden.email = email;
    if (settings) garden.settings = { ...garden.settings, ...settings };

    await garden.save();

    res.json({
      message: 'Jardín actualizado correctamente ✅',
      garden
    });

  } catch (error) {
    console.error('Error actualizando jardín:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener estadísticas del jardín
const getGardenStats = async (req, res) => {
  try {
    const { Classroom, Child, DailyEntry, Payment } = require('../models');
    
    // Contadores básicos
    const [classroomCount, childCount, activeChildCount] = await Promise.all([
      Classroom.countDocuments({ gardenId: req.gardenId, deletedAt: null }),
      Child.countDocuments({ gardenId: req.gardenId, deletedAt: null }),
      Child.countDocuments({ gardenId: req.gardenId, status: 'active', deletedAt: null })
    ]);

    // Entradas del cuaderno digital (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntriesCount = await DailyEntry.countDocuments({
      gardenId: req.gardenId,
      createdAt: { $gte: thirtyDaysAgo },
      status: 'published'
    });

    // Pagos pendientes
    const pendingPayments = await Payment.countDocuments({
      gardenId: req.gardenId,
      status: { $in: ['pending', 'overdue'] }
    });

    // Ingresos del mes actual
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthlyIncomeData = await Payment.aggregate([
      {
        $match: {
          gardenId: new mongoose.Types.ObjectId(req.gardenId),
          period: currentPeriod,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$paidAmount' },
          paidCount: { $sum: 1 }
        }
      }
    ]);

    const monthlyIncome = monthlyIncomeData[0] || { totalIncome: 0, paidCount: 0 };

    res.json({
      stats: {
        classrooms: classroomCount,
        children: {
          total: childCount,
          active: activeChildCount
        },
        dailyEntries: {
          lastMonth: recentEntriesCount
        },
        payments: {
          pending: pendingPayments,
          monthlyIncome: monthlyIncome.totalIncome,
          monthlyPaidCount: monthlyIncome.paidCount
        }
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

// Obtener miembros del jardín
const getGardenMembers = async (req, res) => {
  try {
    const members = await User.find({
      'memberships.gardenId': req.gardenId,
      'memberships.status': 'active',
      deletedAt: null
    }).select('profile email memberships lastLoginAt').lean();

    const gardenMembers = members.map(member => {
      const membership = member.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      
      return {
        id: member._id,
        email: member.email,
        profile: member.profile,
        role: membership.role,
        joinedAt: membership.joinedAt,
        lastLoginAt: member.lastLoginAt
      };
    });

    res.json({ members: gardenMembers });

  } catch (error) {
    console.error('Error obteniendo miembros:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Invitar usuario al jardín
const inviteUser = async (req, res) => {
  try {
    const { email, role, classroomIds = [] } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        error: 'Email y rol son requeridos',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (!['admin', 'teacher', 'family'].includes(role)) {
      return res.status(400).json({
        error: 'Rol inválido',
        code: 'INVALID_ROLE'
      });
    }

    // Buscar usuario existente
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Verificar si ya está en el jardín
      const existingMembership = user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      
      if (existingMembership) {
        return res.status(400).json({
          error: 'El usuario ya pertenece a este jardín',
          code: 'USER_ALREADY_MEMBER'
        });
      }
      
      // Agregar membership
      user.memberships.push({
        gardenId: req.gardenId,
        role,
        classroomIds: role === 'teacher' ? classroomIds : [],
        status: 'active'
      });
      
      await user.save();
    } else {
      // Crear usuario con status invited
      user = new User({
        email: email.toLowerCase(),
        passwordHash: Math.random().toString(36), // Temporal
        profile: {
          firstName: email.split('@')[0],
          lastName: ''
        },
        memberships: [{
          gardenId: req.gardenId,
          role,
          classroomIds: role === 'teacher' ? classroomIds : [],
          status: 'invited'
        }]
      });
      
      await user.save();
    }

    res.json({
      message: `Usuario ${user.email} invitado como ${role} ✅`,
      user: {
        id: user._id,
        email: user.email,
        role,
        status: user.memberships[user.memberships.length - 1].status
      }
    });

  } catch (error) {
    console.error('Error invitando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getMyGardens,
  getGarden,
  updateGarden,
  getGardenStats,
  getGardenMembers,
  inviteUser
};