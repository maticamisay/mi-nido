const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize'); // Disabled: incompatible with Express v5
const { serveUploads } = require('./middleware/upload');
require('dotenv').config();

const app = express();

// Ensure query parser is set (Express 5 compatibility)
app.set('query parser', 'simple');

// Trust proxy (behind Traefik reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true
};

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.', code: 'RATE_LIMITED' }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
// Custom mongo sanitize (express-mongo-sanitize is incompatible with Express 5)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  next();
});

// Servir archivos estáticos (uploads)
serveUploads(app);

// Health check
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: mongoStatus === 'connected' ? 'ok' : 'degraded', name: 'Mi Nido API', mongo: mongoStatus });
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/gardens', require('./routes/gardens'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/children', require('./routes/children'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/daily-entries', require('./routes/dailyEntries'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/calendar', require('./routes/calendarEvents'));
app.use('/api/upload', require('./routes/upload'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR'
  });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mi-nido';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('🐣 MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`🐣 Mi Nido API corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });
