const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generar token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Verificar token JWT
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Decodificar token sin verificar (para obtener info sin validar)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generar token de reseteo de password (más corto)
const generateResetToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateResetToken
};