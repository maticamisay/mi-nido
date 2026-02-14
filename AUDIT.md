# 🐣 Mi Nido — Auditoría Completa de Código

**Fecha:** 2026-02-14  
**Auditor:** Claude (subagent)  
**Proyecto:** Mi Nido (Jardín Maternal SaaS)  
**Stack:** Next.js 16 (frontend) + Express 5 / Mongoose 9 (backend)

---

## 📊 Resumen Ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítico | 14 |
| 🟡 Medio | 22 |
| 🟢 Bajo | 15 |
| **Total** | **51** |

---

## 1. 🔴 Bugs en el Backend

### 1.1 `getGardenStats` referencia variable inexistente `garden`
- **Archivo:** `backend/src/controllers/gardenController.js` ~línea 120
- **Severidad:** 🔴 Crítico
- **Descripción:** Usa `garden._id` en el aggregate de Payment, pero la variable se llama `req.gardenId` (no hay `garden` en scope). Esto crashea con `ReferenceError`.
- **Fix:** Cambiar `garden._id` por `new mongoose.Types.ObjectId(req.gardenId)` y agregar `const mongoose = require('mongoose')` o importar ObjectId.

### 1.2 `.env` tiene secreto JWT hardcodeado y weak
- **Archivo:** `backend/.env` línea 4
- **Severidad:** 🔴 Crítico
- **Descripción:** `JWT_SECRET=mi-nido-jwt-secret-production-2024-xK9mP2vL` está en el repo. Si se pushea a Git, cualquiera puede forjar tokens.
- **Fix:** Usar variable de entorno real, nunca commitear `.env`. Agregar `.env` a `.gitignore`.

### 1.3 Credenciales MongoDB Atlas en `.env`
- **Archivo:** `backend/.env` línea 3
- **Severidad:** 🔴 Crítico
- **Descripción:** `MONGO_URI=mongodb+srv://root:root@cluster0.rk8kkml.mongodb.net/mi-nido` con user/pass `root:root` expuesto.
- **Fix:** Rotar credenciales inmediatamente. No commitear secrets.

### 1.4 `.env` usa `CORS_ORIGIN` pero `index.js` lee `CORS_ORIGINS` (plural)
- **Archivo:** `backend/.env` línea 5, `backend/src/index.js` línea 10
- **Severidad:** 🔴 Crítico
- **Descripción:** El `.env` define `CORS_ORIGIN=*` pero el código lee `process.env.CORS_ORIGINS` (con S). Resultado: CORS siempre usa `'*'` como fallback sin importar lo configurado.
- **Fix:** Unificar el nombre de la variable. Usar `CORS_ORIGINS` en ambos lados.

### 1.5 `JWT_SECRET` es `undefined` al importar `jwt.js`
- **Archivo:** `backend/src/utils/jwt.js` línea 3
- **Severidad:** 🔴 Crítico
- **Descripción:** `JWT_SECRET` se lee de `process.env` al tiempo de importación del módulo. Si `dotenv.config()` no se ejecutó antes (ej: seeds, tests), será `undefined` y `jwt.sign()` fallará silenciosamente o tirará error.
- **Fix:** Leer `process.env.JWT_SECRET` dentro de cada función, o validar que exista al arrancar.

### 1.6 El backend de Express 5 no tiene error handler global
- **Archivo:** `backend/src/index.js`
- **Severidad:** 🟡 Medio
- **Descripción:** No hay middleware de error global `(err, req, res, next)`. Errores no capturados en controllers crashean el proceso o devuelven HTML 500 de Express.
- **Fix:** Agregar un error handler al final de las rutas.

### 1.7 `Attendance.createDailyAttendance` no maneja sala sin `gardenId`
- **Archivo:** `backend/src/models/Attendance.js` ~línea 110
- **Severidad:** 🟡 Medio
- **Descripción:** `(await mongoose.model('Classroom').findById(classroomId)).gardenId` — si la sala no existe, `.gardenId` tira `Cannot read property 'gardenId' of null`.
- **Fix:** Validar que la sala existe antes de acceder a `.gardenId`.

### 1.8 `inviteUser` crea usuario con password random sin hash válido
- **Archivo:** `backend/src/controllers/gardenController.js` ~línea 200
- **Severidad:** 🟡 Medio
- **Descripción:** `passwordHash: Math.random().toString(36)` — al guardarse, el pre-save hook hashea este valor. Pero el usuario invitado nunca podrá hacer login porque no conoce este password. No hay flujo de "set password" para invitados.
- **Fix:** Implementar flujo de invitación con token de setup de cuenta, o enviar email con link para crear contraseña.

### 1.9 `deleteEvent` hace hard delete; `deleteAnnouncement` hace soft delete — inconsistencia
- **Archivo:** `backend/src/controllers/calendarEventController.js` ~línea 190, `announcementController.js` ~línea 195
- **Severidad:** 🟢 Bajo
- **Fix:** Decidir una estrategia consistente (soft delete everywhere).

### 1.10 `updateChildAttendance` — `setChildAttendance` spread no funciona con subdocs Mongoose
- **Archivo:** `backend/src/models/Attendance.js` ~línea 85
- **Severidad:** 🟡 Medio
- **Descripción:** `this.records[existingIndex] = { ...this.records[existingIndex], ...attendanceData, childId }` — spreading un subdocumento Mongoose no preserva el subdoc correctamente; debería usar `Object.assign()` o set fields individually.
- **Fix:** Usar `Object.assign(this.records[existingIndex], attendanceData)` o set each field.

---

## 2. 🔴 Bugs en el Frontend

### 2.1 Múltiples fetch calls usan URLs relativas sin `API_BASE_URL`
- **Archivos:** Muchos — `asistencia/page.tsx`, `cuaderno/page.tsx`, `comunicados/page.tsx`, `pagos/page.tsx`, `niños/page.tsx`, `familia/page.tsx`
- **Severidad:** 🔴 Crítico
- **Descripción:** Patrón inconsistente: algunos fetch usan `API_BASE_URL + '/path'` y otros usan solo `'/path'` (URL relativa). Las URLs relativas van al frontend Next.js server (puerto 3000), NO al backend API. Ejemplos:
  - `asistencia/page.tsx`: `fetch('/children?classroomId=...')` ❌
  - `asistencia/page.tsx`: `fetch('/attendance?classroomId=...')` ❌
  - `cuaderno/page.tsx`: `fetch('/children?...')`, `fetch('/daily-entries?...')` ❌
  - `comunicados/page.tsx`: `fetch('/announcements/...')` para delete/ack ❌
  - `pagos/page.tsx`: `fetch('/payments?...')`, `fetch('/payments/stats?...')` ❌
  - `niños/page.tsx`: `fetch('/children/${editingChild._id}')` para PUT ❌, `fetch('/children/${child._id}')` para DELETE ❌
  - `familia/page.tsx`: `fetch('/families/daily-entries?...')` ❌, `fetch('/families/payments?...')` ❌, `fetch('/announcements/...')` ❌
- **Fix:** Prefixar TODAS las fetch URLs con `API_BASE_URL`.

### 2.2 `/familia` page calls endpoints que no existen en el backend
- **Archivo:** `frontend/src/app/familia/page.tsx`
- **Severidad:** 🔴 Crítico
- **Descripción:** Llama a:
  - `GET /families/my-children` — NO EXISTE en backend
  - `GET /families/daily-entries` — NO EXISTE
  - `GET /families/announcements` — NO EXISTE
  - `GET /families/payments` — NO EXISTE
  
  El backend no tiene rutas `/api/families/*`. Las familias deberían usar `/api/children` con `gardenId`, `/api/daily-entries/feed`, `/api/announcements`, `/api/payments`.
- **Fix:** Reescribir las llamadas API de familia para usar los endpoints existentes del backend, pasando `gardenId` como query param.

### 2.3 Frontend no pasa `gardenId` en la mayoría de las llamadas API
- **Archivos:** Todos los page components
- **Severidad:** 🔴 Crítico
- **Descripción:** El backend requiere `gardenId` como query param o body param en casi todas las rutas (el middleware `requireGardenAccess` lo busca). El frontend NUNCA envía `gardenId` en los requests. Esto significa que TODAS las llamadas API fallarán con `400 - GARDEN_ID_REQUIRED`.
- **Fix:** Almacenar el `gardenId` del jardín activo en el AuthContext y enviarlo en cada request.

### 2.4 El response del backend no matchea lo que el frontend espera
- **Archivos:** Múltiples
- **Severidad:** 🔴 Crítico
- **Descripción:** 
  - Backend `getChildren` devuelve `{ children: [...] }`, pero frontend hace `setChildren(data)` esperando un array directo.
  - Backend `getClassrooms` devuelve `{ classrooms: [...] }`, pero frontend hace `setClassrooms(data)` esperando un array.
  - Backend `getPayments` devuelve `{ payments: [...], pagination: {...} }`, pero frontend hace `setPayments(data)` esperando un array.
  - Backend `getAnnouncements` devuelve `{ announcements: [...], pagination: {...} }`, frontend espera array.
  - Mismo patrón en attendance, daily-entries, etc.
- **Fix:** Frontend debe destructurar: `const { children } = await response.json()`, o backend debe devolver arrays directos.

### 2.5 Dashboard muestra datos hardcodeados, no datos reales
- **Archivo:** `frontend/src/app/dashboard/page.tsx`
- **Severidad:** 🟡 Medio
- **Descripción:** Todas las estadísticas y actividad reciente son datos estáticos hardcodeados ("28 / 35", "12 / 28", etc.). No hay llamadas al backend.
- **Fix:** Integrar con `GET /api/gardens/:gardenId/stats` y datos reales.

### 2.6 `ProtectedRoute` no previene flash de contenido autenticado
- **Archivo:** `frontend/src/components/ui/ProtectedRoute.tsx`
- **Severidad:** 🟢 Bajo
- **Descripción:** Lee de `localStorage` en useEffect (async). Hay un frame donde `isLoading` es true, luego puede flashear contenido antes del redirect.
- **Fix:** OK para MVP, pero mejorar con middleware de Next.js o cookies httpOnly.

### 2.7 `MasPage` no usa `ProtectedRoute`
- **Archivo:** `frontend/src/app/mas/page.tsx`
- **Severidad:** 🟡 Medio
- **Descripción:** Es un Server Component sin protección de autenticación. Cualquiera puede ver la página.
- **Fix:** Convertir a Client Component con ProtectedRoute, o usar middleware.

---

## 3. 🔴 Integraciones Frontend ↔ Backend

### 3.1 Frontend no envía `gardenId` — TODAS las rutas protegidas fallan
- **Severidad:** 🔴 Crítico
- **Descripción:** Ver issue 2.3. El `AuthContext` guarda `user.gardens[0].id` pero nunca lo pasa a las API calls.
- **Fix:** Crear un wrapper de fetch que automáticamente agregue `gardenId` a queries/body.

### 3.2 Endpoint de attendance: frontend envía POST, backend espera PUT
- **Archivo:** `frontend/src/app/asistencia/page.tsx` ~línea 135, `backend/src/routes/attendance.js`
- **Severidad:** 🟡 Medio
- **Descripción:** Frontend `saveAttendance` hace POST a `/attendance` cuando es nuevo, pero el backend tiene `PUT /api/attendance` para actualizar. Para crear, el frontend debería usar la ruta GET que auto-crea, luego PUT para actualizar.
- **Fix:** Alinear la estrategia de creación/actualización.

### 3.3 Frontend cuaderno: POST a `/daily-entries/:id` para update; backend usa PUT
- **Archivo:** `frontend/src/app/cuaderno/page.tsx`
- **Severidad:** 🟡 Medio
- **Descripción:** `handleSubmit` usa la URL `API_BASE_URL + '/daily-entries'` para crear, pero para editar construye `/daily-entries/${editingEntry._id}` — sin `API_BASE_URL` prefix, y el backend `POST /api/daily-entries` y `PUT /api/daily-entries` ambos llaman a `createOrUpdateDailyEntry` (no tiene `/:id` route). No hay ruta `PUT /api/daily-entries/:id`.
- **Fix:** Backend `createOrUpdateDailyEntry` busca por `childId + date`, así que el frontend debería enviar siempre a POST/PUT sin ID. Pero el frontend intenta usar `/:id` que no existe.

### 3.4 Payment frontend calls non-existent endpoints
- **Archivo:** `frontend/src/app/pagos/page.tsx`
- **Severidad:** 🔴 Crítico
- **Descripción:**
  - `GET /payments/stats` — NO EXISTE en backend
  - `POST /payments/:paymentId/record-payment` — Backend ruta es `POST /api/payments/:paymentId/record`
  - `PUT /payments/:id` — NO EXISTE (no hay ruta de update de payment en backend)
  - `DELETE /payments/:id` — NO EXISTE (no hay ruta de delete de payment en backend)
- **Fix:** Crear las rutas faltantes en backend, o ajustar frontend a las rutas existentes.

### 3.5 Comunicados frontend: acknowledge endpoint URL incompleta
- **Archivo:** `frontend/src/app/comunicados/page.tsx` ~línea 100
- **Severidad:** 🟡 Medio
- **Descripción:** `fetch('/announcements/${announcementId}/acknowledge')` — falta `API_BASE_URL`, y además no envía `gardenId` en body.
- **Fix:** Usar `API_BASE_URL` y enviar `gardenId`.

### 3.6 Salas frontend: edit/delete usan URLs relativas
- **Archivo:** `frontend/src/app/salas/page.tsx`
- **Severidad:** 🟡 Medio
- **Descripción:** `fetch('/classrooms/${classroom._id}')` para PUT/DELETE — sin `API_BASE_URL`.
- **Fix:** Agregar `API_BASE_URL`.

---

## 4. 🟡 Formularios

### 4.1 Registro: no valida formato de email
- **Archivo:** `backend/src/controllers/authController.js` ~línea 25
- **Severidad:** 🟡 Medio
- **Descripción:** Solo verifica `!email`. No valida que sea un email válido.
- **Fix:** Agregar validación con regex o librería como `validator`.

### 4.2 Crear niño: frontend no envía `gardenId` en body
- **Archivo:** `frontend/src/app/niños/page.tsx`
- **Severidad:** 🔴 Crítico (parte del issue 3.1)
- **Descripción:** El `createChild` del backend toma `gardenId` de `req.gardenId` (del middleware), pero el middleware no lo recibe porque el frontend no lo envía.

### 4.3 Formulario de niño no valida emergencyContacts vacíos en frontend
- **Archivo:** `frontend/src/app/niños/page.tsx`
- **Severidad:** 🟡 Medio
- **Descripción:** El formulario permite enviar contactos de emergencia con `name: ''` y `phone: ''`. Solo el backend valida.
- **Fix:** Agregar validación client-side.

### 4.4 Formulario de sala: no valida `fee.amount > 0` en frontend
- **Archivo:** `frontend/src/app/salas/page.tsx`
- **Severidad:** 🟢 Bajo
- **Fix:** Agregar `min="1"` o validación.

### 4.5 Registro frontend no valida email format client-side
- **Archivo:** `frontend/src/app/register/page.tsx`
- **Severidad:** 🟢 Bajo
- **Descripción:** Solo chequea `!email.trim()`.
- **Fix:** Agregar regex de email.

---

## 5. 🔴 Autenticación y Autorización

### 5.1 Token JWT contiene `gardenId` fijo — no soporta multi-jardín
- **Archivo:** `backend/src/controllers/authController.js` ~línea 90
- **Severidad:** 🟡 Medio
- **Descripción:** El token se genera con `gardenId: userGardens[0]?.id` (primer jardín). Si un usuario pertenece a múltiples jardines, no puede cambiar entre ellos sin re-loguearse. El middleware NO usa el gardenId del token; lo toma del request.
- **Fix:** Remover `gardenId` del token payload (no se usa), o agregar endpoint para switch de jardín.

### 5.2 Ruta DELETE de announcement no verifica rol del usuario
- **Archivo:** `backend/src/routes/announcements.js` línea ~28
- **Severidad:** 🟡 Medio
- **Descripción:** `router.delete('/:announcementId', authenticate, requireGardenAccess(), deleteAnnouncement)` — no tiene `requireAdmin` o `requireTeacher`. Cualquier usuario del jardín (incluso familias) puede eliminar comunicados.
- **Fix:** Agregar `requireTeacher` o verificar autoría en el controller.

### 5.3 Ruta DELETE de calendar event no verifica rol
- **Archivo:** `backend/src/routes/calendarEvents.js` línea ~25
- **Severidad:** 🟡 Medio
- **Descripción:** Igual que 5.2 — falta middleware de rol. El controller verifica autoría pero un `family` user podría intentar y recibir un 403, lo cual está OK pero no es limpio.
- **Fix:** Agregar `requireTeacher` en la ruta.

### 5.4 Logout endpoint no invalida token
- **Archivo:** `backend/src/routes/auth.js` ~línea 25
- **Severidad:** 🟡 Medio
- **Descripción:** El endpoint `/api/auth/logout` solo devuelve un JSON. No hay blacklist de tokens. Un token robado sigue válido hasta que expire.
- **Fix:** Para MVP es aceptable, pero documentar la limitación. Considerar token rotation o blacklist para producción.

### 5.5 `requireGardenAccess` acepta gardenId de query, body O params — confuso y potencialmente bypasseable
- **Archivo:** `backend/src/middleware/auth.js` ~línea 60
- **Severidad:** 🟡 Medio
- **Descripción:** `const gardenId = req.params[gardenIdParam] || req.body.gardenId || req.query.gardenId` — para rutas GET que leen de query, un atacante podría enviar un gardenId diferente en body y en query. El orden de precedencia no es claro.
- **Fix:** Ser explícito sobre de dónde viene el gardenId para cada ruta.

---

## 6. 🟡 Modelo de Datos

### 6.1 `Payment` unique index `{childId, period}` impide múltiples conceptos por período
- **Archivo:** `backend/src/models/Payment.js` ~línea 75
- **Severidad:** 🟡 Medio
- **Descripción:** El unique index `{ childId: 1, period: 1 }` impide tener cuota + inscripción + material en el mismo mes para el mismo niño.
- **Fix:** Cambiar a `{ childId: 1, period: 1, concept: 1 }` o remover unique constraint.

### 6.2 `Child` pre-validate hooks llaman `next()` sin return después de error
- **Archivo:** `backend/src/models/Child.js` ~línea 145-155
- **Severidad:** 🟡 Medio
- **Descripción:** Hay dos pre-validate hooks. El primero verifica emergencyContacts y llama `next(new Error(...))`, pero NO hace return. Continúa al `next()` final. Esto puede causar `next called twice`.
- **Fix:** Agregar `return` antes de cada `next(error)`.

### 6.3 `Announcement` pre-validate tiene el mismo bug de doble `next()`
- **Archivo:** `backend/src/models/Announcement.js` ~línea 90
- **Severidad:** 🟡 Medio
- **Fix:** Agregar `return next(new Error(...))`.

### 6.4 Virtuals no se incluyen en `toJSON()` / `toObject()` por defecto
- **Archivos:** Todos los modelos
- **Severidad:** 🟢 Bajo
- **Descripción:** Mongoose no incluye virtuals en `toJSON`/`toObject` por defecto. Virtuals como `fullName`, `age`, `isDeleted`, `balance`, etc. no se envían al frontend.
- **Fix:** Agregar `{ toJSON: { virtuals: true }, toObject: { virtuals: true } }` a los schema options.

### 6.5 `Garden.settings.schoolYear.start/end` son required pero no validados en update
- **Archivo:** `backend/src/models/Garden.js`
- **Severidad:** 🟢 Bajo
- **Fix:** Agregar validación en `updateGarden`.

---

## 7. 🔴 Seguridad

### 7.1 Secrets expuestos en `.env` (JWT_SECRET + MongoDB credentials)
- **Severidad:** 🔴 Crítico
- **Descripción:** Ver issues 1.2 y 1.3.

### 7.2 CORS configurado como `*` en producción
- **Archivo:** `backend/.env`, `backend/src/index.js`
- **Severidad:** 🔴 Crítico
- **Descripción:** Debido al bug de nombre de variable (issue 1.4), CORS siempre es `*`. Esto permite que cualquier sitio haga requests al API.
- **Fix:** Configurar correctamente con el dominio del frontend.

### 7.3 No hay rate limiting
- **Archivo:** `backend/src/index.js`
- **Severidad:** 🟡 Medio
- **Descripción:** Sin rate limiting, el endpoint de login es vulnerable a brute force.
- **Fix:** Agregar `express-rate-limit` al menos en `/api/auth/login` y `/api/auth/register`.

### 7.4 Uploads sin validación de contenido real (solo MIME type)
- **Archivo:** `backend/src/middleware/upload.js`
- **Severidad:** 🟡 Medio
- **Descripción:** Solo se valida `file.mimetype`, que viene del cliente y puede ser falsificado. Un atacante podría subir un archivo malicioso con MIME type falso.
- **Fix:** Validar magic bytes del archivo, o usar un servicio de scanning.

### 7.5 Uploads servidos como static sin autenticación
- **Archivo:** `backend/src/middleware/upload.js` (serveUploads), `backend/src/index.js`
- **Severidad:** 🟡 Medio
- **Descripción:** `/uploads/*` es público. Fotos de niños, documentos, DNIs, etc. son accesibles sin token.
- **Fix:** Servir uploads a través de un endpoint autenticado, o usar signed URLs.

### 7.6 No hay sanitización de input (NoSQL injection)
- **Archivos:** Todos los controllers
- **Severidad:** 🟡 Medio
- **Descripción:** Los query params y body params se pasan directamente a queries de Mongoose. Ej: `Child.find({ firstName: { $regex: search, $options: 'i' } })` — si `search` contiene caracteres de regex, puede causar ReDoS.
- **Fix:** Usar `mongo-sanitize` o `express-mongo-sanitize` middleware.

### 7.7 Token almacenado en `localStorage` — vulnerable a XSS
- **Archivo:** `frontend/src/contexts/AuthContext.tsx`
- **Severidad:** 🟢 Bajo (para MVP aceptable)
- **Fix:** Usar cookies httpOnly para producción.

---

## 8. 🟢 Performance

### 8.1 `getClassrooms` hace N+1 queries por childCount
- **Archivo:** `backend/src/controllers/classroomController.js` ~línea 15
- **Severidad:** 🟡 Medio
- **Descripción:** Para cada sala, hace un `Child.countDocuments()` separado. Con 10 salas = 11 queries.
- **Fix:** Usar `aggregate` con `$lookup` o hacer un solo `countDocuments` agrupado.

### 8.2 `getGardenAttendanceSummary` hace N queries por sala
- **Archivo:** `backend/src/controllers/attendanceController.js` ~línea 145
- **Severidad:** 🟡 Medio
- **Fix:** Usar una sola query agregada.

### 8.3 `getFamilyFeed` marca entries como seen en el GET — side effect en lectura
- **Archivo:** `backend/src/controllers/dailyEntryController.js` ~línea 230
- **Severidad:** 🟢 Bajo
- **Descripción:** Un GET que modifica datos es un anti-pattern. Puede causar writes innecesarios en cada page load.
- **Fix:** Separar en un POST explícito para marcar como vistas.

### 8.4 Frontend re-fetch en cada cambio de filtro sin debounce
- **Archivos:** `asistencia/page.tsx`, `cuaderno/page.tsx`, `pagos/page.tsx`
- **Severidad:** 🟢 Bajo
- **Fix:** Agregar debounce a los cambios de filtro, o usar SWR/React Query.

### 8.5 `getDailyEntryStats` aggregate no filtra por ObjectId correctamente
- **Archivo:** `backend/src/controllers/dailyEntryController.js` ~línea 280
- **Severidad:** 🟡 Medio
- **Descripción:** `matchQuery.gardenId = req.gardenId` — `req.gardenId` es un string, pero en aggregate se necesita `new mongoose.Types.ObjectId(req.gardenId)`. Mismo para `classroomId`.
- **Fix:** Convertir a ObjectId.

---

## 9. 🟡 Configuración y Deploy

### 9.1 Dockerfile backend: `USER node` antes de crear `uploads/`
- **Archivo:** `backend/Dockerfile`
- **Severidad:** 🟡 Medio
- **Descripción:** `RUN mkdir -p /app/uploads` se ejecuta como root, luego `USER node`. El directorio uploads es de root, node no puede escribir.
- **Fix:** Hacer `RUN mkdir -p /app/uploads && chown node:node /app/uploads` antes de `USER node`.

### 9.2 Backend uploads no persistidos en container
- **Severidad:** 🟡 Medio
- **Descripción:** Los uploads se guardan en `/app/uploads` dentro del container. Sin volume mount, se pierden al reiniciar.
- **Fix:** Configurar un volume para `/app/uploads` o usar S3/MinIO.

### 9.3 Frontend `.env.example` tiene URL de localhost hardcodeada
- **Archivo:** `frontend/.env.example`
- **Severidad:** 🟢 Bajo
- **Descripción:** `NEXT_PUBLIC_API_URL=http://localhost:5000/api` — OK para desarrollo, pero el build de Docker necesita la URL real como build arg.
- **Fix:** Documentar que debe pasar `NEXT_PUBLIC_API_URL` como build arg.

### 9.4 No hay `.gitignore` visible — `.env` posiblemente trackeado
- **Severidad:** 🔴 Crítico
- **Descripción:** No encontré `.gitignore` en el proyecto. Si `.env` está en Git, las credenciales están expuestas.
- **Fix:** Crear `.gitignore` excluyendo `.env`, `node_modules/`, `.next/`, `uploads/`.

### 9.5 Backend `package.json` no tiene `engines` field
- **Severidad:** 🟢 Bajo
- **Fix:** Agregar `"engines": { "node": ">=20" }`.

### 9.6 No hay health check que valide MongoDB connection
- **Archivo:** `backend/src/index.js` ~línea 22
- **Severidad:** 🟢 Bajo
- **Descripción:** El health check solo devuelve `{ status: 'ok' }` sin verificar la conexión a MongoDB.
- **Fix:** Verificar `mongoose.connection.readyState`.

### 9.7 Express 5 usage — multer 2.x compatibility concern
- **Archivo:** `backend/package.json`
- **Severidad:** 🟢 Bajo
- **Descripción:** Express 5 es relativamente nuevo. Multer 2.x también. Verificar compatibilidad de error handling (Express 5 maneja promises diferente).

---

## 10. Resumen de Prioridades

### Bloquean funcionalidad (arreglar PRIMERO):
1. 🔴 **Frontend no envía `gardenId`** (issue 3.1 / 2.3) — NADA funciona sin esto
2. 🔴 **Frontend no destructura responses** (issue 2.4) — datos nunca se muestran
3. 🔴 **URLs relativas sin `API_BASE_URL`** (issue 2.1) — requests van al sitio equivocado
4. 🔴 **Endpoints de `/familia` no existen** (issue 2.2) — portal familiar roto
5. 🔴 **Endpoints de pagos incompletos** (issue 3.4) — stats/update/delete no existen
6. 🔴 **`getGardenStats` crashea** (issue 1.1) — referencia `garden` inexistente

### Seguridad (arreglar URGENTE):
7. 🔴 **Secrets en .env** (issues 1.2, 1.3, 7.1) — rotar credenciales
8. 🔴 **CORS wildcard** (issues 1.4, 7.2) — configurar correctamente
9. 🟡 **Uploads públicos sin auth** (issue 7.5) — fotos de niños expuestas

### Pueden esperar:
10. Resto de issues 🟡 y 🟢
