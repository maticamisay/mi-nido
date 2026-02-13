const mongoose = require('mongoose');
require('dotenv').config();

const { 
  Garden, 
  User, 
  Classroom, 
  Child, 
  Attendance, 
  DailyEntry, 
  Announcement,
  Payment,
  CalendarEvent
} = require('../models');

const MONGO_URI = process.env.MONGO_URI;

const seedData = {
  // Jardín de ejemplo
  garden: {
    name: "Jardín Rayito de Sol",
    slug: "rayito-de-sol",
    address: {
      street: "Av. San Martín 1234",
      city: "San Juan",
      province: "San Juan",
      zip: "5400"
    },
    phone: "2644123456",
    email: "info@rayitodesol.com",
    settings: {
      schoolYear: {
        start: new Date('2026-03-01'),
        end: new Date('2026-12-15')
      }
    },
    subscription: {
      plan: 'brote',
      status: 'active',
      currentPeriodEnd: new Date('2026-12-31')
    }
  },

  // Usuarios de ejemplo
  users: [
    {
      email: "directora@rayitodesol.com",
      password: "123456",
      profile: {
        firstName: "María",
        lastName: "González",
        phone: "2644567890",
        dni: "30123456"
      },
      role: "owner"
    },
    {
      email: "seño.ana@rayitodesol.com",
      password: "123456",
      profile: {
        firstName: "Ana",
        lastName: "Rodríguez",
        phone: "2644567891",
        dni: "31234567"
      },
      role: "teacher"
    },
    {
      email: "seño.laura@rayitodesol.com",
      password: "123456",
      profile: {
        firstName: "Laura",
        lastName: "Martínez",
        phone: "2644567892",
        dni: "32345678"
      },
      role: "teacher"
    },
    {
      email: "mama.sofia@gmail.com",
      password: "123456",
      profile: {
        firstName: "Sofía",
        lastName: "López",
        phone: "2644567893",
        dni: "33456789"
      },
      role: "family"
    },
    {
      email: "papa.carlos@gmail.com",
      password: "123456",
      profile: {
        firstName: "Carlos",
        lastName: "Fernández",
        phone: "2644567894",
        dni: "34567890"
      },
      role: "family"
    }
  ],

  // Salas de ejemplo
  classrooms: [
    {
      name: "Pollitos",
      emoji: "🐥",
      color: "#FDE8A0",
      ageRange: { from: 1, to: 2 },
      shift: "mañana",
      capacity: 15,
      fee: { amount: 45000, dueDay: 10, lateFeePercent: 10 }
    },
    {
      name: "Ositos",
      emoji: "🐻",
      color: "#B8E0D2",
      ageRange: { from: 2, to: 3 },
      shift: "mañana",
      capacity: 18,
      fee: { amount: 48000, dueDay: 10, lateFeePercent: 10 }
    },
    {
      name: "Estrellitas",
      emoji: "⭐",
      color: "#B5D5E8",
      ageRange: { from: 3, to: 4 },
      shift: "tarde",
      capacity: 20,
      fee: { amount: 50000, dueDay: 10, lateFeePercent: 10 }
    }
  ],

  // Niños de ejemplo
  children: [
    {
      firstName: "Valentina",
      lastName: "López",
      nickname: "Vale",
      birthDate: new Date('2024-05-15'),
      gender: "F",
      dni: "60123456",
      shift: "mañana",
      classroomIndex: 0, // Pollitos
      emergencyContacts: [
        { name: "Mamá - Sofía López", relationship: "madre", phone: "2644567893", isPrimary: true },
        { name: "Papá - Carlos López", relationship: "padre", phone: "2644567895", isPrimary: false }
      ],
      medical: {
        bloodType: "A+",
        allergies: ["maní"],
        conditions: [],
        medications: []
      },
      parentIndex: 3 // Sofía López
    },
    {
      firstName: "Santiago",
      lastName: "Fernández",
      nickname: "Santi",
      birthDate: new Date('2023-08-22'),
      gender: "M",
      dni: "59876543",
      shift: "mañana",
      classroomIndex: 1, // Ositos
      emergencyContacts: [
        { name: "Papá - Carlos Fernández", relationship: "padre", phone: "2644567894", isPrimary: true },
        { name: "Abuela - Rosa Fernández", relationship: "abuela", phone: "2644111222", isPrimary: false }
      ],
      medical: {
        bloodType: "O+",
        allergies: [],
        conditions: ["asma leve"],
        medications: [
          { name: "Salbutamol", dosage: "2 puffs según necesidad", notes: "Solo si tiene crisis" }
        ]
      },
      parentIndex: 4 // Carlos Fernández
    },
    {
      firstName: "Emma",
      lastName: "García",
      nickname: "Emi",
      birthDate: new Date('2022-12-10'),
      gender: "F",
      dni: "58765432",
      shift: "tarde",
      classroomIndex: 2, // Estrellitas
      emergencyContacts: [
        { name: "Mamá - Lucía García", relationship: "madre", phone: "2644333444", isPrimary: true }
      ],
      medical: {
        bloodType: "B+",
        allergies: ["lactosa"],
        conditions: [],
        medications: []
      }
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('🧹 Limpiando base de datos...');
    await Promise.all([
      Garden.deleteMany({}),
      User.deleteMany({}),
      Classroom.deleteMany({}),
      Child.deleteMany({}),
      Attendance.deleteMany({}),
      DailyEntry.deleteMany({}),
      Announcement.deleteMany({}),
      Payment.deleteMany({}),
      CalendarEvent.deleteMany({})
    ]);

    // 1. Crear jardín
    console.log('🏠 Creando jardín...');
    const garden = await Garden.create(seedData.garden);

    // 2. Crear usuarios
    console.log('👥 Creando usuarios...');
    const users = [];
    for (const userData of seedData.users) {
      const user = await User.create({
        email: userData.email,
        passwordHash: userData.password,
        profile: userData.profile,
        memberships: [{
          gardenId: garden._id,
          role: userData.role,
          status: 'active'
        }]
      });
      users.push({ ...user.toObject(), originalRole: userData.role });
    }

    // Actualizar ownerId del jardín
    garden.ownerId = users[0]._id;
    await garden.save();

    // 3. Crear salas
    console.log('🏫 Creando salas...');
    const classrooms = [];
    for (let i = 0; i < seedData.classrooms.length; i++) {
      const classroomData = seedData.classrooms[i];
      
      // Asignar docente a la sala (Ana y Laura)
      const teacherId = i < 2 ? users[i + 1]._id : users[1]._id; // Ana para las 2 primeras, Laura para la tercera
      
      const classroom = await Classroom.create({
        ...classroomData,
        gardenId: garden._id,
        teacherIds: [teacherId]
      });
      classrooms.push(classroom);

      // Actualizar membership de la docente para incluir esta sala
      await User.updateOne(
        { _id: teacherId },
        { $push: { 'memberships.0.classroomIds': classroom._id } }
      );
    }

    // 4. Crear niños
    console.log('👶 Creando niños...');
    const children = [];
    for (const childData of seedData.children) {
      const classroom = classrooms[childData.classroomIndex];
      
      const child = await Child.create({
        gardenId: garden._id,
        classroomId: classroom._id,
        firstName: childData.firstName,
        lastName: childData.lastName,
        nickname: childData.nickname,
        birthDate: childData.birthDate,
        gender: childData.gender,
        dni: childData.dni,
        shift: childData.shift,
        emergencyContacts: childData.emergencyContacts,
        medical: childData.medical,
        authorizedPickups: []
      });
      children.push(child);

      // Agregar niño al membership de los padres
      if (childData.parentIndex !== undefined) {
        const parent = users[childData.parentIndex];
        await User.updateOne(
          { _id: parent._id },
          { $push: { 'memberships.0.childrenIds': child._id } }
        );
      }
    }

    // 5. Crear algunos comunicados
    console.log('📢 Creando comunicados...');
    await Announcement.create([
      {
        gardenId: garden._id,
        title: "Reunión de padres - Sala Pollitos",
        body: "Queridas familias, los invitamos a la reunión de padres el viernes 15 de marzo a las 18:00hs. Hablaremos sobre las actividades del mes y el desarrollo de los niños.",
        scope: "classroom",
        classroomIds: [classrooms[0]._id],
        status: "published",
        publishedAt: new Date(),
        authorId: users[0]._id,
        requiresAck: true
      },
      {
        gardenId: garden._id,
        title: "Feriado - Día del Maestro",
        body: "Recordamos que el viernes 11 de septiembre es feriado por el Día del Maestro. El jardín permanecerá cerrado. ¡Que tengan un hermoso fin de semana largo!",
        scope: "garden",
        status: "published",
        publishedAt: new Date(),
        authorId: users[0]._id,
        pinned: true
      }
    ]);

    // 6. Crear algunos eventos del calendario
    console.log('📅 Creando eventos del calendario...');
    await CalendarEvent.create([
      {
        gardenId: garden._id,
        title: "Acto del 25 de Mayo",
        description: "Festejo del Día de la Patria con representación de los niños",
        date: new Date('2026-05-25'),
        time: "10:00",
        type: "event",
        scope: "garden",
        authorId: users[0]._id
      },
      {
        gardenId: garden._id,
        title: "Día del Niño - Sala Pollitos",
        description: "Celebración especial para los más pequeños",
        date: new Date('2026-08-20'),
        time: "15:00",
        type: "event",
        scope: "classroom",
        classroomIds: [classrooms[0]._id],
        authorId: users[1]._id
      }
    ]);

    // 7. Crear cuotas para marzo 2026
    console.log('💰 Creando cuotas del mes...');
    for (const child of children) {
      const classroom = classrooms.find(c => c._id.toString() === child.classroomId.toString());
      await Payment.create({
        gardenId: garden._id,
        childId: child._id,
        classroomId: child.classroomId,
        period: "2026-03",
        concept: "cuota",
        description: `Cuota Marzo 2026 - ${classroom.name}`,
        amount: classroom.fee.amount,
        total: classroom.fee.amount,
        dueDate: new Date('2026-03-10'),
        status: "pending"
      });
    }

    // 8. Crear algunas entradas del cuaderno digital
    console.log('📒 Creando entradas del cuaderno digital...');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const child of children.slice(0, 2)) { // Solo para los primeros 2 niños
      // Entrada de ayer
      await DailyEntry.create({
        gardenId: garden._id,
        classroomId: child.classroomId,
        childId: child._id,
        date: yesterday,
        meals: [
          { type: "desayuno", description: "Leche con cereales", ate: "bien" },
          { type: "almuerzo", description: "Pollo con verduras", ate: "poco" }
        ],
        nap: { slept: true, from: "13:00", to: "14:30", quality: "bien" },
        hygiene: { diaperChanges: 2 },
        activities: [
          { type: "pedagógica", description: "Jugamos con bloques de colores" },
          { type: "artística", description: "Pintamos con témperas" }
        ],
        mood: "contento",
        observations: "Muy participativo en las actividades. Compartió sus juguetes con los compañeros.",
        status: "published",
        publishedAt: new Date(),
        authorId: users[1]._id // Seño Ana
      });

      // Entrada de hoy
      await DailyEntry.create({
        gardenId: garden._id,
        classroomId: child.classroomId,
        childId: child._id,
        date: today,
        meals: [
          { type: "desayuno", description: "Yogur con frutas", ate: "bien" }
        ],
        nap: { slept: false },
        hygiene: { diaperChanges: 1 },
        activities: [
          { type: "musical", description: "Cantamos canciones de cuna" }
        ],
        mood: "contento",
        observations: "Excelente día! Se adaptó muy bien a la rutina.",
        status: "draft",
        authorId: users[1]._id // Seño Ana
      });
    }

    console.log('✅ Seed completado exitosamente!');
    console.log(`
🎉 Base de datos poblada con:
- 1 jardín: ${garden.name}
- ${users.length} usuarios (1 directora, 2 docentes, 2 familias)
- ${classrooms.length} salas: ${classrooms.map(c => c.name).join(', ')}
- ${children.length} niños
- 2 comunicados
- 2 eventos del calendario
- ${children.length} cuotas de marzo 2026
- 4 entradas del cuaderno digital

📧 Usuarios de prueba:
- Directora: directora@rayitodesol.com / 123456
- Docente: seño.ana@rayitodesol.com / 123456
- Docente: seño.laura@rayitodesol.com / 123456
- Familia: mama.sofia@gmail.com / 123456
- Familia: papa.carlos@gmail.com / 123456
    `);

  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Ejecutar solo si el archivo se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };