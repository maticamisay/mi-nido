const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

// Middleware para verificar autenticación
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        code: 'TOKEN_REQUIRED'
      });
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token
    const decoded = verifyToken(token);
    
    // Buscar usuario
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verificar que el usuario no esté eliminado
    if (user.deletedAt) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Agregar usuario al request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Error en autenticación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar acceso a un jardín específico
const requireGardenAccess = (gardenIdParam = 'gardenId') => {
  return async (req, res, next) => {
    try {
      const gardenId = req.params[gardenIdParam] || (req.body && req.body.gardenId) || req.query.gardenId;
      
      if (!gardenId) {
        return res.status(400).json({
          error: 'ID de jardín requerido',
          code: 'GARDEN_ID_REQUIRED'
        });
      }
      
      // Verificar que el usuario tiene acceso al jardín
      const hasAccess = req.user.hasAccessToGarden(gardenId);
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'No tienes acceso a este jardín',
          code: 'GARDEN_ACCESS_DENIED'
        });
      }
      
      // Agregar gardenId y rol al request
      req.gardenId = gardenId;
      req.userRole = req.user.getRoleInGarden(gardenId);
      
      next();
    } catch (error) {
      console.error('Error verificando acceso al jardín:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        error: 'Rol de usuario no determinado',
        code: 'ROLE_UNDEFINED'
      });
    }
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Acceso denegado. Roles requeridos: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

// Middleware para verificar que es owner/admin
const requireAdmin = requireRole(['owner', 'admin']);

// Middleware para verificar que es docente o superior
const requireTeacher = requireRole(['owner', 'admin', 'teacher']);

// Middleware para verificar acceso a un niño específico (familias solo sus hijos)
const requireChildAccess = async (req, res, next) => {
  try {
    const childId = req.params.childId || req.body.childId || req.query.childId;
    
    if (!childId) {
      return res.status(400).json({
        error: 'ID de niño requerido',
        code: 'CHILD_ID_REQUIRED'
      });
    }
    
    // Si es admin/owner/teacher en el jardín, puede ver todos los niños
    if (['owner', 'admin', 'teacher'].includes(req.userRole)) {
      req.childId = childId;
      return next();
    }
    
    // Si es familia, solo puede ver sus propios hijos
    if (req.userRole === 'family') {
      const membership = req.user.memberships.find(m => 
        m.gardenId.toString() === req.gardenId.toString()
      );
      
      const hasAccessToChild = membership.childrenIds.some(id => 
        id.toString() === childId.toString()
      );
      
      if (!hasAccessToChild) {
        return res.status(403).json({
          error: 'No tienes acceso a este niño',
          code: 'CHILD_ACCESS_DENIED'
        });
      }
    }
    
    req.childId = childId;
    next();
  } catch (error) {
    console.error('Error verificando acceso al niño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  authenticate,
  requireGardenAccess,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireChildAccess
};