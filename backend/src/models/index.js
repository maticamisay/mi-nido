// 🐣 Mi Nido - Modelos de MongoDB
// Exporta todos los modelos de Mongoose

const Garden = require('./Garden');
const User = require('./User');
const Classroom = require('./Classroom');
const Child = require('./Child');
const Attendance = require('./Attendance');
const DailyEntry = require('./DailyEntry');
const Announcement = require('./Announcement');
const Message = require('./Message');
const Payment = require('./Payment');
const CalendarEvent = require('./CalendarEvent');

module.exports = {
  Garden,
  User,
  Classroom,
  Child,
  Attendance,
  DailyEntry,
  Announcement,
  Message,
  Payment,
  CalendarEvent
};