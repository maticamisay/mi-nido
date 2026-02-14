const jwt = require('jsonwebtoken');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

// Generar token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Verificar token JWT
const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

// Decodificar token sin verificar (para obtener info sin validar)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generar token de reseteo de password (más corto)
const generateResetToken = (payload) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: '1h'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateResetToken
};
