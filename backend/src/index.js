const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Mi Nido API' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gardens', require('./routes/gardens'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/children', require('./routes/children'));
// app.use('/api/attendance', require('./routes/attendance'));
// app.use('/api/daily-entries', require('./routes/dailyEntries'));
// app.use('/api/announcements', require('./routes/announcements'));
// app.use('/api/payments', require('./routes/payments'));

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
