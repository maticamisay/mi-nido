const bcrypt = require('bcryptjs');
const { User, Garden } = require('../models');
const { generateToken } = require('../utils/jwt');

// Registrar nuevo usuario (dueño de jardín)
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone,
      dni,
      gardenName,
      gardenAddress
    } = req.body;

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName || !gardenName) {
      return res.status(400).json({
        error: 'Campos requeridos: email, password, firstName, lastName, gardenName',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'El formato del email no es válido',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'El email ya está registrado',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Validar password (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Crear slug del jardín
    const gardenSlug = gardenName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    
    // Verificar que el slug no exista
    const existingGarden = await Garden.findOne({ slug: gardenSlug });
    if (existingGarden) {
      return res.status(400).json({
        error: 'Ya existe un jardín con ese nombre. Prueba con otro nombre.',
        code: 'GARDEN_NAME_EXISTS'
      });
    }

    // Crear usuario
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password, // Se hasheará automáticamente en el pre-save
      profile: {
        firstName,
        lastName,
        phone,
        dni
      },
      memberships: [] // Se agregará después de crear el jardín
    });

    // Crear jardín
    const garden = new Garden({
      name: gardenName,
      slug: gardenSlug,
      address: {
        street: gardenAddress?.street || '',
        city: gardenAddress?.city || '',
        province: gardenAddress?.province || '',
        zip: gardenAddress?.zip || ''
      },
      phone: phone || '',
      email: email.toLowerCase(),
      ownerId: user._id,
      settings: {
        schoolYear: {
          start: new Date(new Date().getFullYear(), 2, 1), // 1 de marzo
          end: new Date(new Date().getFullYear(), 11, 15)  // 15 de diciembre
        }
      },
      subscription: {
        plan: 'semillita',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    });

    // Agregar membership del owner al usuario
    user.memberships.push({
      gardenId: garden._id,
      role: 'owner',
      status: 'active'
    });

    // Guardar ambos
    await garden.save();
    await user.save();

    // Generar token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      gardenId: garden._id
    });

    // Actualizar último login
    user.lastLoginAt = new Date();
    await user.save();

    res.status(201).json({
      message: '¡Cuenta creada exitosamente! 🐣',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        gardens: [{
          id: garden._id,
          name: garden.name,
          slug: garden.slug,
          role: 'owner'
        }]
      },
      garden: {
        id: garden._id,
        name: garden.name,
        slug: garden.slug,
        subscription: garden.subscription
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      deletedAt: null 
    });

    if (!user) {
      return res.status(401).json({
        error: 'Email o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar contraseña
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Obtener jardines del usuario
    const gardens = await Garden.find({
      _id: { $in: user.memberships.map(m => m.gardenId) },
      deletedAt: null
    }).select('name slug subscription');

    const userGardens = user.memberships
      .filter(m => m.status === 'active')
      .map(m => {
        const garden = gardens.find(g => g._id.toString() === m.gardenId.toString());
        return {
          id: garden._id,
          name: garden.name,
          slug: garden.slug,
          role: m.role,
          subscription: garden.subscription
        };
      });

    // Generar token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      gardenId: userGardens[0]?.id // Primer jardín por defecto
    });

    // Actualizar último login
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      message: '¡Bienvenido de vuelta! 👋',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        gardens: userGardens,
        lastLoginAt: user.lastLoginAt
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener datos del usuario actual
const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    
    // Obtener jardines del usuario
    const gardens = await Garden.find({
      _id: { $in: user.memberships.map(m => m.gardenId) },
      deletedAt: null
    }).select('name slug subscription');

    const userGardens = user.memberships
      .filter(m => m.status === 'active')
      .map(m => {
        const garden = gardens.find(g => g._id.toString() === m.gardenId.toString());
        return {
          id: garden._id,
          name: garden.name,
          slug: garden.slug,
          role: m.role,
          subscription: garden.subscription
        };
      });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        gardens: userGardens,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Actualizar perfil de usuario
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dni } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone) user.profile.phone = phone;
    if (dni) user.profile.dni = dni;
    
    await user.save();
    
    res.json({
      message: 'Perfil actualizado correctamente ✅',
      profile: user.profile
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva son requeridas',
        code: 'MISSING_PASSWORDS'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }
    
    const user = await User.findById(req.userId);
    
    // Verificar contraseña actual
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // Actualizar contraseña
    user.passwordHash = newPassword; // Se hasheará automáticamente
    await user.save();
    
    res.json({
      message: 'Contraseña actualizada correctamente ✅'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword
};