const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  me,
  updateProfile,
  changePassword
} = require('../controllers/authController');

// Registro de nuevo usuario (dueño de jardín)
// POST /api/auth/register
router.post('/register', register);

// Login de usuario existente
// POST /api/auth/login
router.post('/login', login);

// Obtener datos del usuario actual (requiere autenticación)
// GET /api/auth/me
router.get('/me', authenticate, me);

// Actualizar perfil de usuario
// PUT /api/auth/profile
router.put('/profile', authenticate, updateProfile);

// Cambiar contraseña
// PUT /api/auth/password
router.put('/password', authenticate, changePassword);

// Logout (del lado del cliente se elimina el token)
// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ 
    message: '¡Hasta luego! 👋',
    note: 'Elimina el token del almacenamiento local'
  });
});

module.exports = router;