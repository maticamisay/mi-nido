# 🐣 Mi Nido — Diseño de Base de Datos (MongoDB)

## Convenciones

- **Colección**: plural en camelCase (`gardens`, `children`, `dailyEntries`)
- **Timestamps**: todos los documentos llevan `createdAt` y `updatedAt` (automáticos con Mongoose)
- **Soft delete**: campo `deletedAt` (null = activo) en documentos principales
- **Referencias**: se usa `ObjectId` con populate para relaciones entre colecciones
- **Embebido vs Referencia**: se embebe lo que se lee junto y no crece indefinidamente; se referencia lo que crece o se consulta por separado

---

## Colecciones

### 1. `gardens` — El Jardín

Documento raíz. Un jardín = una institución.

```js
{
  _id: ObjectId,
  name: "Jardín Rayito de Sol",          // Nombre del jardín
  slug: "rayito-de-sol",                  // URL-friendly
  address: {
    street: "Av. San Martín 1234",
    city: "San Juan",
    province: "San Juan",
    zip: "5400"
  },
  phone: "2644123456",
  email: "info@rayitodesol.com",
  logo: "uploads/gardens/logo-xyz.png",   // Path al logo
  
  // Configuración
  settings: {
    shifts: ["mañana", "tarde", "jornada completa"],  // Turnos disponibles
    schoolYear: {                                       
      start: "2026-03-01",
      end: "2026-12-15"
    },
    currency: "ARS",
    timezone: "America/Argentina/Buenos_Aires"
  },

  // Plan y suscripción
  subscription: {
    plan: "brote",                  // "semillita" | "brote" | "jardin"
    status: "active",               // "active" | "trial" | "suspended" | "cancelled"
    trialEndsAt: Date,
    currentPeriodEnd: Date
  },

  // Dueño/Admin principal
  ownerId: ObjectId,                // ref → users

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

**Índices**: `slug` (unique), `ownerId`

---

### 2. `users` — Usuarios del sistema

Todos: directoras, docentes, y padres/madres.

```js
{
  _id: ObjectId,
  email: "maria@gmail.com",              // Login
  passwordHash: "...",                     // bcrypt
  
  profile: {
    firstName: "María",
    lastName: "González",
    phone: "2644567890",
    avatar: "uploads/avatars/maria.jpg",
    dni: "30123456"
  },

  // Roles por jardín (un usuario puede estar en varios jardines)
  memberships: [
    {
      gardenId: ObjectId,               // ref → gardens
      role: "owner",                    // "owner" | "admin" | "teacher" | "family"
      classroomIds: [ObjectId],         // ref → classrooms (para teachers)
      childrenIds: [ObjectId],          // ref → children (para family)
      joinedAt: Date,
      status: "active"                  // "active" | "invited" | "inactive"
    }
  ],

  // Auth
  lastLoginAt: Date,
  emailVerified: Boolean,
  resetToken: String | null,
  resetTokenExpiresAt: Date | null,

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

**Índices**: `email` (unique), `memberships.gardenId`, `memberships.role`

---

### 3. `classrooms` — Salas

```js
{
  _id: ObjectId,
  gardenId: ObjectId,                    // ref → gardens
  
  name: "Patitos",                        // Nombre de la sala
  emoji: "🐥",                            // Ícono/emoji identificador
  color: "#FDE8A0",                       // Color de la paleta para UI
  
  ageRange: {
    from: 1,                              // Edad mínima (años)
    to: 2                                 // Edad máxima
  },
  shift: "mañana",                        // Turno
  capacity: 20,                           // Capacidad máxima
  
  teacherIds: [ObjectId],                 // ref → users (docentes asignadas)
  
  // Configuración de cuota
  fee: {
    amount: 45000,                        // Monto mensual en pesos
    dueDay: 10,                           // Día de vencimiento
    lateFeePercent: 10                    // Recargo por mora (%)
  },

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

**Índices**: `gardenId`, `gardenId + shift`

---

### 4. `children` — Niños

```js
{
  _id: ObjectId,
  gardenId: ObjectId,                    // ref → gardens
  classroomId: ObjectId,                 // ref → classrooms
  
  // Datos personales
  firstName: "Valentina",
  lastName: "López",
  nickname: "Vale",                       // Apodo (opcional)
  birthDate: Date,
  gender: "F",                            // "F" | "M" | "X"
  dni: "60123456",
  photo: "uploads/children/vale.jpg",
  
  // Turno y estado
  shift: "mañana",
  enrollmentDate: Date,                   // Fecha de inscripción
  status: "active",                       // "active" | "withdrawn" | "graduated"
  
  // Ficha médica (embebida — se lee siempre junto al niño)
  medical: {
    bloodType: "A+",
    allergies: ["maní", "látex"],
    conditions: ["asma leve"],
    medications: [
      {
        name: "Salbutamol",
        dosage: "2 puffs según necesidad",
        notes: "Solo si tiene crisis"
      }
    ],
    healthInsurance: {
      provider: "OSDE",
      planNumber: "310",
      memberId: "12345678"
    },
    pediatrician: {
      name: "Dr. Pérez",
      phone: "2644111222"
    },
    notes: "Tiene los oídos sensibles al frío"
  },

  // Personas autorizadas a retirar (embebida)
  authorizedPickups: [
    {
      name: "Abuela Rosa",
      relationship: "abuela",
      dni: "10987654",
      phone: "2644333444",
      photo: "uploads/pickups/abuela-rosa.jpg"  // Opcional
    }
  ],

  // Contactos de emergencia (embebida)
  emergencyContacts: [
    {
      name: "Mamá - Laura López",
      relationship: "madre",
      phone: "2644567890",
      isPrimary: true
    },
    {
      name: "Papá - Carlos López",
      relationship: "padre",
      phone: "2644567891",
      isPrimary: false
    }
  ],

  // Documentos subidos
  documents: [
    {
      type: "dni",                         // "dni" | "birth_certificate" | "medical_cert" | "other"
      label: "DNI frente",
      file: "uploads/documents/vale-dni.pdf",
      uploadedAt: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

**Índices**: `gardenId`, `classroomId`, `gardenId + status`

---

### 5. `attendance` — Asistencia diaria

Un documento por sala por día.

```js
{
  _id: ObjectId,
  gardenId: ObjectId,
  classroomId: ObjectId,                 // ref → classrooms
  date: "2026-03-15",                     // String ISO date (YYYY-MM-DD)
  
  records: [
    {
      childId: ObjectId,                  // ref → children
      status: "present",                  // "present" | "absent" | "justified" | "late"
      justification: null,                // Motivo si es justified
      arrivedAt: "08:15",                 // Hora llegada (opcional)
      leftAt: "12:30",                    // Hora retiro (opcional)
      retiredBy: "Mamá",                  // Quién lo retiró (opcional)
      notes: null
    }
  ],

  // Quién cargó la asistencia
  recordedBy: ObjectId,                   // ref → users
  
  createdAt: Date,
  updatedAt: Date
}
```

**Índices**: `gardenId + date`, `classroomId + date` (unique compound)

---

### 6. `dailyEntries` — Cuaderno Digital del Día ⭐

El killer feature. Un documento por niño por día.

```js
{
  _id: ObjectId,
  gardenId: ObjectId,
  classroomId: ObjectId,
  childId: ObjectId,                      // ref → children
  date: "2026-03-15",
  
  // Alimentación
  meals: [
    {
      type: "desayuno",                   // "desayuno" | "almuerzo" | "merienda" | "colación"
      description: "Leche con cereales",
      ate: "bien",                        // "bien" | "poco" | "nada" | "no aplica"
      notes: null
    }
  ],

  // Descanso
  nap: {
    slept: true,
    from: "13:00",
    to: "14:30",
    quality: "bien",                      // "bien" | "inquieto" | "no durmió"
    notes: null
  },

  // Higiene
  hygiene: {
    diaperChanges: 3,                     // Cantidad de cambios
    bathroomVisits: null,                 // Para los más grandes
    notes: null
  },

  // Actividades del día
  activities: [
    {
      type: "pedagógica",                 // "pedagógica" | "artística" | "motriz" | "musical" | "libre" | "paseo"
      description: "Pintamos con témperas los colores del otoño",
      notes: null
    }
  ],

  // Estado de ánimo / observaciones
  mood: "contento",                       // "contento" | "tranquilo" | "inquieto" | "llorón" | "cansado"
  observations: "Hoy jugó mucho con Mía. Está empezando a compartir los juguetes 💛",

  // Fotos del día
  photos: [
    {
      url: "uploads/daily/2026-03-15/vale-pintando.jpg",
      caption: "Pintando con témperas 🎨",
      uploadedAt: Date
    }
  ],

  // Estado del entry
  status: "published",                    // "draft" | "published"
  publishedAt: Date,
  
  // Quién lo cargó
  authorId: ObjectId,                     // ref → users (la seño)
  
  // Visto por la familia
  seenBy: [
    {
      userId: ObjectId,
      seenAt: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

**Índices**: `childId + date` (unique), `classroomId + date`, `gardenId + date`

---

### 7. `announcements` — Comunicados

```js
{
  _id: ObjectId,
  gardenId: ObjectId,
  
  title: "Reunión de padres - Sala Patitos",
  body: "Queridas familias, los invitamos a la reunión...",
  
  // Alcance
  scope: "classroom",                     // "garden" | "classroom"
  classroomIds: [ObjectId],               // Si scope = classroom
  
  // Adjuntos
  attachments: [
    {
      name: "autorización-paseo.pdf",
      url: "uploads/announcements/auth-paseo.pdf",
      type: "application/pdf"
    }
  ],

  // Requiere confirmación de lectura
  requiresAck: true,
  
  // Confirmaciones
  acknowledgements: [
    {
      userId: ObjectId,
      ackedAt: Date
    }
  ],

  // Publicación
  status: "published",                    // "draft" | "published" | "archived"
  publishedAt: Date,
  authorId: ObjectId,                     // ref → users
  
  // Flags
  pinned: false,                          // Fijado arriba
  urgent: false,                          // Destacado visual
  
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

**Índices**: `gardenId + status`, `gardenId + publishedAt`

---

### 8. `messages` — Mensajes directos jardín ↔ familia

```js
{
  _id: ObjectId,
  gardenId: ObjectId,
  
  // Conversación (thread)
  threadId: String,                       // Generado: `${gardenId}-${familyUserId}`
  
  senderId: ObjectId,                     // ref → users
  senderRole: "teacher",                  // "teacher" | "admin" | "family"
  
  content: "Hola, quería avisar que mañana Valentina no va a ir",
  
  attachments: [
    {
      name: "certificado.jpg",
      url: "uploads/messages/cert.jpg",
      type: "image/jpeg"
    }
  ],

  // Relacionado a un niño (opcional)
  childId: ObjectId | null,

  readAt: Date | null,                    // Leído por el destinatario
  
  createdAt: Date
}
```

**Índices**: `threadId + createdAt`, `gardenId + senderId`

---

### 9. `payments` — Pagos y Cuotas

```js
{
  _id: ObjectId,
  gardenId: ObjectId,
  childId: ObjectId,                      // ref → children
  classroomId: ObjectId,                  // ref → classrooms
  
  // Período
  period: "2026-03",                      // Año-Mes
  concept: "cuota",                       // "cuota" | "inscripción" | "material" | "evento" | "otro"
  description: "Cuota Marzo 2026 - Sala Patitos",
  
  // Montos
  amount: 45000,                          // Monto original
  lateFee: 0,                             // Recargo aplicado
  discount: 0,                            // Descuento (hermanos, etc.)
  total: 45000,                           // amount + lateFee - discount
  
  // Estado
  status: "paid",                         // "pending" | "paid" | "partial" | "overdue" | "waived"
  dueDate: Date,                          // Fecha de vencimiento
  
  // Pago
  paidAmount: 45000,
  paidAt: Date,
  paymentMethod: "transferencia",         // "efectivo" | "transferencia" | "mercadopago" | "otro"
  paymentReference: "Transf. CBU ...456", // Referencia/comprobante
  paymentNotes: null,
  
  // Quién registró el pago
  recordedBy: ObjectId,                   // ref → users
  
  createdAt: Date,
  updatedAt: Date
}
```

**Índices**: `gardenId + period`, `childId + period`, `gardenId + status`, `gardenId + dueDate`

---

### 10. `calendarEvents` — Calendario del Jardín

```js
{
  _id: ObjectId,
  gardenId: ObjectId,
  
  title: "Acto del 25 de Mayo",
  description: "Los esperamos a las 10hs en el SUM...",
  
  date: Date,                             // Fecha del evento
  endDate: Date | null,                   // Si dura más de un día
  time: "10:00",                          // Hora (opcional)
  
  type: "event",                          // "event" | "holiday" | "meeting" | "deadline"
  
  // Alcance
  scope: "garden",                        // "garden" | "classroom"
  classroomIds: [ObjectId],
  
  color: "#F2A7B3",                       // Color en el calendario
  
  authorId: ObjectId,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Índices**: `gardenId + date`

---

## 📊 Diagrama de Relaciones

```
gardens (1)
  ├── classrooms (N)
  │     ├── children (N)
  │     │     ├── dailyEntries (N) ⭐
  │     │     ├── attendance records (embebido en attendance)
  │     │     └── payments (N)
  │     └── attendance (1 por día)
  ├── announcements (N)
  ├── messages (N)
  ├── calendarEvents (N)
  └── users (N via memberships)
        ├── owner/admin
        ├── teachers → classrooms
        └── family → children
```

---

## 🔐 Control de Acceso por Rol

| Recurso | Owner/Admin | Teacher | Family |
|---------|------------|---------|--------|
| Garden settings | ✅ CRUD | ❌ | ❌ |
| Classrooms | ✅ CRUD | 👁️ Read (sus salas) | ❌ |
| Children | ✅ CRUD | 👁️ Read (su sala) | 👁️ Read (sus hijos) |
| Medical info | ✅ CRUD | 👁️ Read (su sala) | ✅ Edit (sus hijos) |
| Attendance | ✅ CRUD | ✅ CRUD (su sala) | 👁️ Read (sus hijos) |
| Daily Entries | ✅ CRUD | ✅ CRUD (su sala) | 👁️ Read (sus hijos) |
| Announcements | ✅ CRUD | ✅ Create (su sala) | 👁️ Read |
| Messages | ✅ Read all | ✅ Own threads | ✅ Own threads |
| Payments | ✅ CRUD | ❌ | 👁️ Read (sus hijos) |
| Calendar | ✅ CRUD | 👁️ Read | 👁️ Read |
| Users/Invite | ✅ CRUD | ❌ | ❌ |

---

## 📦 Mongoose Models (estructura de archivos)

```
src/
  models/
    Garden.js
    User.js
    Classroom.js
    Child.js
    Attendance.js
    DailyEntry.js
    Announcement.js
    Message.js
    Payment.js
    CalendarEvent.js
    index.js          // Export all models
```

---

## 🌱 Seed Data Sugerido

Para desarrollo y demos:
- 1 jardín: "Jardín Rayito de Sol"
- 3 salas: Pollitos (1-2 años), Ositos (2-3 años), Estrellitas (3-4 años)
- 2 docentes por sala
- 10 niños por sala (30 total)
- 30 familias con 1-2 padres cada una
- 1 mes de asistencia y cuaderno digital
- 5 comunicados
- Cuotas de 2 meses

---

*Database Design v1.0 — Mi Nido — Febrero 2026*
