# 🐣 Mi Nido — Plan de Testing Completo

**Proyecto:** Mi Nido — Sistema de gestión para jardines maternales  
**Backend API:** `http://api-minido.38.105.232.177.sslip.io/api`  
**Frontend:** `http://minido.38.105.232.177.sslip.io`  
**Fecha:** 2026-02-14  

---

## Índice

1. [Flujos de Autenticación](#1-flujos-de-autenticación)
2. [CRUD Jardines (Gardens)](#2-crud-jardines)
3. [CRUD Salas (Classrooms)](#3-crud-salas)
4. [CRUD Niños (Children)](#4-crud-niños)
5. [Asistencia (Attendance)](#5-asistencia)
6. [Cuaderno Digital (Daily Entries)](#6-cuaderno-digital)
7. [Comunicados (Announcements)](#7-comunicados)
8. [Pagos (Payments)](#8-pagos)
9. [Mensajes (Messages)](#9-mensajes)
10. [Calendario (Calendar Events)](#10-calendario)
11. [Uploads (Archivos)](#11-uploads)
12. [Flujos de Negocio E2E](#12-flujos-de-negocio-e2e)
13. [Validaciones y Edge Cases](#13-validaciones-y-edge-cases)
14. [Integración Frontend-Backend](#14-integración-frontend-backend)
15. [Responsive y UI](#15-responsive-y-ui)

---

## Datos Base para Tests

Usar estos datos a lo largo de todo el plan:

```
OWNER:
  email: "maria@jardincito.com"
  password: "Test123!"
  firstName: "María"
  lastName: "González"
  phone: "1155667788"
  gardenName: "Jardín Rayito de Sol"

TEACHER:
  email: "laura@jardincito.com"
  firstName: "Laura"
  lastName: "Pérez"

FAMILY:
  email: "carlos@familia.com"
  firstName: "Carlos"
  lastName: "Rodríguez"

GARDEN_ID: (se obtiene al registrar)
TOKEN: (se obtiene al hacer login)
```

---

## 1. Flujos de Autenticación

### [AUTH-001] Registro exitoso de nuevo usuario con jardín
- **Flujo:** Autenticación > Registro
- **Precondiciones:** Email no registrado previamente
- **Pasos:**
  1. POST `/api/auth/register`
  2. Verificar que se crea usuario Y jardín simultáneamente
  3. Verificar que se devuelve token JWT válido
- **Endpoint(s):** `POST /api/auth/register`
- **Datos de entrada:**
  ```json
  {
    "email": "maria@jardincito.com",
    "password": "Test123!",
    "firstName": "María",
    "lastName": "González",
    "phone": "1155667788",
    "gardenName": "Jardín Rayito de Sol",
    "gardenAddress": {
      "street": "Av. Corrientes 1234",
      "city": "Buenos Aires",
      "province": "CABA",
      "zip": "1043"
    }
  }
  ```
- **Resultado esperado:** Status 201. Respuesta contiene `user` (con id, email, profile, gardens[]), `garden` (con id, name, slug, subscription con plan "semillita" y status "trial"), y `token` JWT. El usuario tiene membership con role "owner".
- **Resultado de error esperado:** N/A

### [AUTH-002] Registro con email duplicado
- **Flujo:** Autenticación > Registro > Error
- **Precondiciones:** Email "maria@jardincito.com" ya registrado (AUTH-001 ejecutado)
- **Pasos:**
  1. POST `/api/auth/register` con el mismo email
- **Endpoint(s):** `POST /api/auth/register`
- **Datos de entrada:** Mismos datos que AUTH-001
- **Resultado esperado:** Status 400, `code: "EMAIL_ALREADY_EXISTS"`, `error: "El email ya está registrado"`
- **Resultado de error esperado:** N/A

### [AUTH-003] Registro con nombre de jardín duplicado (slug)
- **Flujo:** Autenticación > Registro > Error
- **Precondiciones:** Jardín "Jardín Rayito de Sol" ya existe
- **Pasos:**
  1. POST `/api/auth/register` con email nuevo pero mismo gardenName
- **Endpoint(s):** `POST /api/auth/register`
- **Datos de entrada:**
  ```json
  {
    "email": "otro@email.com",
    "password": "Test123!",
    "firstName": "Ana",
    "lastName": "López",
    "gardenName": "Jardín Rayito de Sol"
  }
  ```
- **Resultado esperado:** Status 400, `code: "GARDEN_NAME_EXISTS"`
- **Resultado de error esperado:** N/A

### [AUTH-004] Registro sin campos requeridos
- **Flujo:** Autenticación > Registro > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/auth/register` sin email
  2. POST `/api/auth/register` sin password
  3. POST `/api/auth/register` sin firstName
  4. POST `/api/auth/register` sin lastName
  5. POST `/api/auth/register` sin gardenName
- **Endpoint(s):** `POST /api/auth/register`
- **Datos de entrada:** Body incompleto en cada caso
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"` para cada caso
- **Resultado de error esperado:** N/A

### [AUTH-005] Registro con contraseña corta (< 6 caracteres)
- **Flujo:** Autenticación > Registro > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/auth/register` con password "123"
- **Endpoint(s):** `POST /api/auth/register`
- **Datos de entrada:** `{ "email": "test@test.com", "password": "123", "firstName": "A", "lastName": "B", "gardenName": "Test" }`
- **Resultado esperado:** Status 400, `code: "PASSWORD_TOO_SHORT"`
- **Resultado de error esperado:** N/A

### [AUTH-006] Login exitoso
- **Flujo:** Autenticación > Login
- **Precondiciones:** Usuario registrado (AUTH-001)
- **Pasos:**
  1. POST `/api/auth/login`
  2. Verificar que devuelve token, user con gardens, y mensaje de bienvenida
- **Endpoint(s):** `POST /api/auth/login`
- **Datos de entrada:** `{ "email": "maria@jardincito.com", "password": "Test123!" }`
- **Resultado esperado:** Status 200. Respuesta contiene `message: "¡Bienvenido de vuelta! 👋"`, `user` (con id, email, profile, gardens[], lastLoginAt), `token`.
- **Resultado de error esperado:** N/A

### [AUTH-007] Login con credenciales incorrectas
- **Flujo:** Autenticación > Login > Error
- **Precondiciones:** Usuario registrado
- **Pasos:**
  1. POST `/api/auth/login` con password incorrecto
  2. POST `/api/auth/login` con email inexistente
- **Endpoint(s):** `POST /api/auth/login`
- **Datos de entrada:** `{ "email": "maria@jardincito.com", "password": "MAL" }`
- **Resultado esperado:** Status 401, `code: "INVALID_CREDENTIALS"`, mensaje genérico "Email o contraseña incorrectos" (no revelar cuál está mal)
- **Resultado de error esperado:** N/A

### [AUTH-008] Login sin campos requeridos
- **Flujo:** Autenticación > Login > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/auth/login` con body vacío
  2. POST `/api/auth/login` sin password
- **Endpoint(s):** `POST /api/auth/login`
- **Datos de entrada:** `{}` o `{ "email": "a@b.com" }`
- **Resultado esperado:** Status 400, `code: "MISSING_CREDENTIALS"`
- **Resultado de error esperado:** N/A

### [AUTH-009] Obtener usuario actual (GET /me)
- **Flujo:** Autenticación > Sesión
- **Precondiciones:** Token válido
- **Pasos:**
  1. GET `/api/auth/me` con header `Authorization: Bearer {token}`
- **Endpoint(s):** `GET /api/auth/me`
- **Datos de entrada:** Header Authorization
- **Resultado esperado:** Status 200. Respuesta contiene `user` con id, email, profile, gardens[], lastLoginAt. No debe incluir passwordHash.
- **Resultado de error esperado:** N/A

### [AUTH-010] Acceso sin token (rutas protegidas)
- **Flujo:** Autenticación > Protección de rutas
- **Precondiciones:** Ninguna
- **Pasos:**
  1. GET `/api/auth/me` sin header Authorization
  2. GET `/api/gardens` sin header Authorization
  3. GET `/api/classrooms?gardenId=xxx` sin header Authorization
- **Endpoint(s):** Cualquier ruta protegida
- **Datos de entrada:** Sin header Authorization
- **Resultado esperado:** Status 401, `code: "TOKEN_REQUIRED"`
- **Resultado de error esperado:** N/A

### [AUTH-011] Acceso con token inválido
- **Flujo:** Autenticación > Protección de rutas
- **Precondiciones:** Ninguna
- **Pasos:**
  1. GET `/api/auth/me` con header `Authorization: Bearer token_falso_12345`
- **Endpoint(s):** `GET /api/auth/me`
- **Datos de entrada:** Token inválido
- **Resultado esperado:** Status 401, `code: "INVALID_TOKEN"`
- **Resultado de error esperado:** N/A

### [AUTH-012] Acceso con token expirado
- **Flujo:** Autenticación > Protección de rutas
- **Precondiciones:** Token JWT expirado (generar uno con expiración pasada)
- **Pasos:**
  1. GET `/api/auth/me` con token expirado
- **Endpoint(s):** `GET /api/auth/me`
- **Datos de entrada:** Token expirado
- **Resultado esperado:** Status 401, `code: "TOKEN_EXPIRED"`
- **Resultado de error esperado:** N/A

### [AUTH-013] Actualizar perfil
- **Flujo:** Autenticación > Perfil
- **Precondiciones:** Token válido
- **Pasos:**
  1. PUT `/api/auth/profile` con nuevos datos
- **Endpoint(s):** `PUT /api/auth/profile`
- **Datos de entrada:** `{ "firstName": "María José", "phone": "1199887766" }`
- **Resultado esperado:** Status 200, `message: "Perfil actualizado correctamente ✅"`, profile actualizado en respuesta
- **Resultado de error esperado:** N/A

### [AUTH-014] Cambiar contraseña exitosamente
- **Flujo:** Autenticación > Contraseña
- **Precondiciones:** Token válido, contraseña actual conocida
- **Pasos:**
  1. PUT `/api/auth/password`
  2. Verificar que el login funciona con la nueva contraseña
  3. Verificar que el login NO funciona con la contraseña anterior
- **Endpoint(s):** `PUT /api/auth/password`
- **Datos de entrada:** `{ "currentPassword": "Test123!", "newPassword": "NuevoPass456!" }`
- **Resultado esperado:** Status 200, `message: "Contraseña actualizada correctamente ✅"`
- **Resultado de error esperado:** N/A

### [AUTH-015] Cambiar contraseña con contraseña actual incorrecta
- **Flujo:** Autenticación > Contraseña > Error
- **Precondiciones:** Token válido
- **Pasos:**
  1. PUT `/api/auth/password` con currentPassword incorrecta
- **Endpoint(s):** `PUT /api/auth/password`
- **Datos de entrada:** `{ "currentPassword": "INCORRECTA", "newPassword": "NuevoPass456!" }`
- **Resultado esperado:** Status 401, `code: "INVALID_CURRENT_PASSWORD"`
- **Resultado de error esperado:** N/A

### [AUTH-016] Cambiar contraseña con nueva contraseña corta
- **Flujo:** Autenticación > Contraseña > Validación
- **Precondiciones:** Token válido
- **Pasos:**
  1. PUT `/api/auth/password` con newPassword corta
- **Endpoint(s):** `PUT /api/auth/password`
- **Datos de entrada:** `{ "currentPassword": "Test123!", "newPassword": "123" }`
- **Resultado esperado:** Status 400, `code: "PASSWORD_TOO_SHORT"`
- **Resultado de error esperado:** N/A

### [AUTH-017] Logout
- **Flujo:** Autenticación > Logout
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/auth/logout`
- **Endpoint(s):** `POST /api/auth/logout`
- **Datos de entrada:** Ninguno
- **Resultado esperado:** Status 200, `message: "¡Hasta luego! 👋"`. Nota: el logout real se hace en el cliente eliminando el token de localStorage.
- **Resultado de error esperado:** N/A

### [AUTH-018] Login con usuario soft-deleted
- **Flujo:** Autenticación > Login > Error
- **Precondiciones:** Usuario con `deletedAt` seteado
- **Pasos:**
  1. POST `/api/auth/login` con credenciales del usuario eliminado
- **Endpoint(s):** `POST /api/auth/login`
- **Datos de entrada:** Credenciales válidas de usuario eliminado
- **Resultado esperado:** Status 401, `code: "INVALID_CREDENTIALS"` (el query filtra por `deletedAt: null`)
- **Resultado de error esperado:** N/A

### [AUTH-019] Acceso con usuario desactivado (deletedAt)
- **Flujo:** Autenticación > Middleware
- **Precondiciones:** Token válido pero usuario fue eliminado después de emitir el token
- **Pasos:**
  1. GET `/api/auth/me` con token de usuario que tiene deletedAt != null
- **Endpoint(s):** `GET /api/auth/me`
- **Datos de entrada:** Token válido de usuario eliminado
- **Resultado esperado:** Status 401, `code: "ACCOUNT_DEACTIVATED"`
- **Resultado de error esperado:** N/A

---

## 2. CRUD Jardines

### [GARDEN-001] Obtener jardines del usuario autenticado
- **Flujo:** Jardines > Listar
- **Precondiciones:** Usuario autenticado con al menos un jardín
- **Pasos:**
  1. GET `/api/gardens`
- **Endpoint(s):** `GET /api/gardens`
- **Datos de entrada:** Header Authorization
- **Resultado esperado:** Status 200. Array `gardens` con objetos que contienen: id, name, slug, address, phone, email, logo, settings, subscription, role, joinedAt
- **Resultado de error esperado:** N/A

### [GARDEN-002] Obtener jardín específico
- **Flujo:** Jardines > Detalle
- **Precondiciones:** Usuario autenticado, gardenId conocido
- **Pasos:**
  1. GET `/api/gardens/{gardenId}`
- **Endpoint(s):** `GET /api/gardens/:gardenId`
- **Datos de entrada:** gardenId en URL
- **Resultado esperado:** Status 200. Objeto `garden` completo sin campo `deletedAt`
- **Resultado de error esperado:** N/A

### [GARDEN-003] Obtener jardín sin acceso
- **Flujo:** Jardines > Permisos
- **Precondiciones:** Usuario autenticado, gardenId de otro jardín
- **Pasos:**
  1. GET `/api/gardens/{otroGardenId}`
- **Endpoint(s):** `GET /api/gardens/:gardenId`
- **Datos de entrada:** gardenId al que el usuario no pertenece
- **Resultado esperado:** Status 403, `code: "GARDEN_ACCESS_DENIED"`
- **Resultado de error esperado:** N/A

### [GARDEN-004] Actualizar jardín (owner)
- **Flujo:** Jardines > Actualizar
- **Precondiciones:** Usuario autenticado como owner del jardín
- **Pasos:**
  1. PUT `/api/gardens/{gardenId}`
- **Endpoint(s):** `PUT /api/gardens/:gardenId`
- **Datos de entrada:**
  ```json
  {
    "name": "Jardín Rayito de Sol - Sede Central",
    "phone": "1144556677",
    "address": { "street": "Av. Rivadavia 5678" }
  }
  ```
- **Resultado esperado:** Status 200, `message: "Jardín actualizado correctamente ✅"`, garden actualizado
- **Resultado de error esperado:** N/A

### [GARDEN-005] Actualizar jardín sin permiso (teacher/family)
- **Flujo:** Jardines > Permisos
- **Precondiciones:** Usuario autenticado como teacher o family
- **Pasos:**
  1. PUT `/api/gardens/{gardenId}` como teacher
- **Endpoint(s):** `PUT /api/gardens/:gardenId`
- **Datos de entrada:** Cualquier dato válido
- **Resultado esperado:** Status 403, `code: "INSUFFICIENT_PERMISSIONS"`
- **Resultado de error esperado:** N/A

### [GARDEN-006] Obtener estadísticas del jardín
- **Flujo:** Jardines > Estadísticas
- **Precondiciones:** Jardín con datos (salas, niños, pagos)
- **Pasos:**
  1. GET `/api/gardens/{gardenId}/stats`
- **Endpoint(s):** `GET /api/gardens/:gardenId/stats`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. Objeto `stats` con: classrooms (número), children.total, children.active, dailyEntries.lastMonth, payments.pending, payments.monthlyIncome
- **Resultado de error esperado:** N/A

### [GARDEN-007] Obtener miembros del jardín
- **Flujo:** Jardines > Miembros
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. GET `/api/gardens/{gardenId}/members`
- **Endpoint(s):** `GET /api/gardens/:gardenId/members`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. Array `members` con: id, email, profile, role, joinedAt, lastLoginAt
- **Resultado de error esperado:** N/A

### [GARDEN-008] Invitar usuario al jardín (teacher)
- **Flujo:** Jardines > Invitaciones
- **Precondiciones:** Usuario admin/owner, email a invitar
- **Pasos:**
  1. POST `/api/gardens/{gardenId}/invite`
- **Endpoint(s):** `POST /api/gardens/:gardenId/invite`
- **Datos de entrada:**
  ```json
  {
    "email": "laura@jardincito.com",
    "role": "teacher",
    "classroomIds": ["{classroomId}"]
  }
  ```
- **Resultado esperado:** Status 200, `message: "Usuario laura@jardincito.com invitado como teacher ✅"`. Si el email ya existe como usuario, se agrega membership. Si no existe, se crea usuario nuevo con status "invited".
- **Resultado de error esperado:** N/A

### [GARDEN-009] Invitar usuario ya miembro
- **Flujo:** Jardines > Invitaciones > Error
- **Precondiciones:** Usuario ya es miembro del jardín
- **Pasos:**
  1. POST `/api/gardens/{gardenId}/invite` con email de usuario existente en el jardín
- **Endpoint(s):** `POST /api/gardens/:gardenId/invite`
- **Datos de entrada:** `{ "email": "maria@jardincito.com", "role": "admin" }`
- **Resultado esperado:** Status 400, `code: "USER_ALREADY_MEMBER"`
- **Resultado de error esperado:** N/A

### [GARDEN-010] Invitar con rol inválido
- **Flujo:** Jardines > Invitaciones > Validación
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. POST `/api/gardens/{gardenId}/invite` con role "superadmin"
- **Endpoint(s):** `POST /api/gardens/:gardenId/invite`
- **Datos de entrada:** `{ "email": "test@test.com", "role": "superadmin" }`
- **Resultado esperado:** Status 400, `code: "INVALID_ROLE"`
- **Resultado de error esperado:** N/A

### [GARDEN-011] Invitar sin campos requeridos
- **Flujo:** Jardines > Invitaciones > Validación
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. POST `/api/gardens/{gardenId}/invite` sin email
  2. POST `/api/gardens/{gardenId}/invite` sin role
- **Endpoint(s):** `POST /api/gardens/:gardenId/invite`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"`
- **Resultado de error esperado:** N/A

---

## 3. CRUD Salas

### [SALA-001] Crear sala exitosamente
- **Flujo:** Salas > Crear
- **Precondiciones:** Usuario admin/owner, gardenId válido
- **Pasos:**
  1. POST `/api/classrooms`
- **Endpoint(s):** `POST /api/classrooms`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "name": "Pollitos",
    "emoji": "🐥",
    "color": "#FDE8A0",
    "ageRange": { "from": 1, "to": 2 },
    "shift": "mañana",
    "capacity": 15,
    "fee": {
      "amount": 45000,
      "dueDay": 10,
      "lateFeePercent": 10
    }
  }
  ```
- **Resultado esperado:** Status 201, `message: 'Sala "Pollitos" creada exitosamente 🎉'`, classroom con todos los campos
- **Resultado de error esperado:** N/A

### [SALA-002] Crear sala sin campos requeridos
- **Flujo:** Salas > Crear > Validación
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. POST `/api/classrooms` sin name
  2. POST `/api/classrooms` sin ageRange
  3. POST `/api/classrooms` sin shift
  4. POST `/api/classrooms` sin capacity
  5. POST `/api/classrooms` sin fee
- **Endpoint(s):** `POST /api/classrooms`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"` para cada caso
- **Resultado de error esperado:** N/A

### [SALA-003] Crear sala con ageRange inválido (from > to)
- **Flujo:** Salas > Crear > Validación
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. POST `/api/classrooms` con `ageRange: { from: 4, to: 2 }`
- **Endpoint(s):** `POST /api/classrooms`
- **Datos de entrada:** ageRange invertido
- **Resultado esperado:** Error de validación de Mongoose: "La edad mínima no puede ser mayor a la edad máxima"
- **Resultado de error esperado:** N/A

### [SALA-004] Crear sala como teacher (sin permiso)
- **Flujo:** Salas > Permisos
- **Precondiciones:** Usuario teacher
- **Pasos:**
  1. POST `/api/classrooms` con token de teacher
- **Endpoint(s):** `POST /api/classrooms`
- **Datos de entrada:** Datos válidos de sala
- **Resultado esperado:** Status 403, `code: "INSUFFICIENT_PERMISSIONS"`
- **Resultado de error esperado:** N/A

### [SALA-005] Listar salas del jardín
- **Flujo:** Salas > Listar
- **Precondiciones:** Jardín con salas creadas
- **Pasos:**
  1. GET `/api/classrooms?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/classrooms?gardenId=xxx`
- **Datos de entrada:** gardenId como query param
- **Resultado esperado:** Status 200. Array `classrooms` con cada sala incluyendo: campos base + `childCount` (número) + `hasCapacity` (boolean). Ordenadas por nombre. Solo salas con deletedAt=null. Teachers populados con firstName/lastName.
- **Resultado de error esperado:** N/A

### [SALA-006] Obtener sala específica con niños
- **Flujo:** Salas > Detalle
- **Precondiciones:** Sala creada con niños
- **Pasos:**
  1. GET `/api/classrooms/{classroomId}?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/classrooms/:classroomId?gardenId=xxx`
- **Datos de entrada:** classroomId y gardenId
- **Resultado esperado:** Status 200. Objeto `classroom` con todos los campos + array `children` (firstName, lastName, nickname, birthDate, photo)
- **Resultado de error esperado:** N/A

### [SALA-007] Obtener sala inexistente
- **Flujo:** Salas > Detalle > Error
- **Precondiciones:** Ninguna
- **Pasos:**
  1. GET `/api/classrooms/000000000000000000000000?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/classrooms/:classroomId`
- **Datos de entrada:** classroomId inválido
- **Resultado esperado:** Status 404, `code: "CLASSROOM_NOT_FOUND"`
- **Resultado de error esperado:** N/A

### [SALA-008] Actualizar sala
- **Flujo:** Salas > Actualizar
- **Precondiciones:** Sala creada, usuario admin/owner
- **Pasos:**
  1. PUT `/api/classrooms/{classroomId}` con gardenId en body
- **Endpoint(s):** `PUT /api/classrooms/:classroomId`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "name": "Pollitos Grandes",
    "capacity": 20,
    "fee": { "amount": 50000 }
  }
  ```
- **Resultado esperado:** Status 200, `message: 'Sala "Pollitos Grandes" actualizada exitosamente ✅'`
- **Resultado de error esperado:** N/A

### [SALA-009] Reducir capacidad por debajo de niños activos
- **Flujo:** Salas > Actualizar > Validación
- **Precondiciones:** Sala con 10 niños activos
- **Pasos:**
  1. PUT `/api/classrooms/{classroomId}` con capacity: 5
- **Endpoint(s):** `PUT /api/classrooms/:classroomId`
- **Datos de entrada:** `{ "gardenId": "xxx", "capacity": 5 }`
- **Resultado esperado:** Status 400, `code: "CAPACITY_TOO_LOW"`, mensaje indicando cuántos niños hay
- **Resultado de error esperado:** N/A

### [SALA-010] Eliminar sala sin niños activos
- **Flujo:** Salas > Eliminar
- **Precondiciones:** Sala sin niños activos, usuario admin/owner
- **Pasos:**
  1. DELETE `/api/classrooms/{classroomId}` con gardenId en body/query
- **Endpoint(s):** `DELETE /api/classrooms/:classroomId`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200, `message: 'Sala "Pollitos" eliminada exitosamente ✅'`. Soft delete (deletedAt seteado). Se remueve la sala de las memberships de docentes.
- **Resultado de error esperado:** N/A

### [SALA-011] Eliminar sala con niños activos
- **Flujo:** Salas > Eliminar > Error
- **Precondiciones:** Sala con niños activos
- **Pasos:**
  1. DELETE `/api/classrooms/{classroomId}`
- **Endpoint(s):** `DELETE /api/classrooms/:classroomId`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 400, `code: "CLASSROOM_HAS_CHILDREN"`, mensaje con cantidad de niños
- **Resultado de error esperado:** N/A

### [SALA-012] Crear sala con docentes asignadas
- **Flujo:** Salas > Crear con docentes
- **Precondiciones:** Docente invitada al jardín (GARDEN-008)
- **Pasos:**
  1. POST `/api/classrooms` con teacherIds
  2. Verificar que la membership de la docente se actualizó con classroomIds
- **Endpoint(s):** `POST /api/classrooms`
- **Datos de entrada:** `{ ..., "teacherIds": ["{teacherId}"] }`
- **Resultado esperado:** Status 201. Sala creada con teacherIds. La docente tiene classroomId en su membership.
- **Resultado de error esperado:** N/A

### [SALA-013] Crear sala con docente inválida
- **Flujo:** Salas > Crear > Validación
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. POST `/api/classrooms` con teacherIds de usuario inexistente o sin acceso al jardín
- **Endpoint(s):** `POST /api/classrooms`
- **Datos de entrada:** `{ ..., "teacherIds": ["000000000000000000000000"] }`
- **Resultado esperado:** Status 400, `code: "INVALID_TEACHER"`
- **Resultado de error esperado:** N/A

---

## 4. CRUD Niños

### [CHILD-001] Crear niño exitosamente
- **Flujo:** Niños > Crear
- **Precondiciones:** Sala creada con capacidad disponible, usuario admin/owner
- **Pasos:**
  1. POST `/api/children`
- **Endpoint(s):** `POST /api/children`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "classroomId": "{classroomId}",
    "firstName": "Valentina",
    "lastName": "Rodríguez",
    "nickname": "Vale",
    "birthDate": "2023-05-15",
    "gender": "F",
    "dni": "60123456",
    "shift": "mañana",
    "medical": {
      "bloodType": "A+",
      "allergies": ["Maní"],
      "conditions": [],
      "medications": [],
      "healthInsurance": {
        "provider": "OSDE",
        "planNumber": "310",
        "memberId": "12345678"
      },
      "pediatrician": {
        "name": "Dr. García",
        "phone": "1144332211"
      }
    },
    "emergencyContacts": [
      {
        "name": "Carlos Rodríguez",
        "relationship": "Padre",
        "phone": "1155667788",
        "isPrimary": true
      },
      {
        "name": "Ana López",
        "relationship": "Madre",
        "phone": "1199887766",
        "isPrimary": false
      }
    ],
    "authorizedPickups": [
      {
        "name": "Marta Rodríguez",
        "relationship": "Abuela",
        "dni": "12345678",
        "phone": "1133445566"
      }
    ]
  }
  ```
- **Resultado esperado:** Status 201, `message: "Niño Valentina Rodríguez registrado exitosamente 🎉"`, child con todos los campos, classroomId populado
- **Resultado de error esperado:** N/A

### [CHILD-002] Crear niño sin campos requeridos
- **Flujo:** Niños > Crear > Validación
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. POST `/api/children` sin firstName, lastName, birthDate, gender, classroomId, shift (uno por caso)
- **Endpoint(s):** `POST /api/children`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"`
- **Resultado de error esperado:** N/A

### [CHILD-003] Crear niño sin contacto de emergencia
- **Flujo:** Niños > Crear > Validación
- **Precondiciones:** Usuario admin/owner
- **Pasos:**
  1. POST `/api/children` con emergencyContacts: []
  2. POST `/api/children` sin campo emergencyContacts
- **Endpoint(s):** `POST /api/children`
- **Datos de entrada:** Sin contactos de emergencia
- **Resultado esperado:** Status 400, `code: "MISSING_EMERGENCY_CONTACT"`
- **Resultado de error esperado:** N/A

### [CHILD-004] Crear niño en sala llena
- **Flujo:** Niños > Crear > Validación
- **Precondiciones:** Sala con capacidad completa
- **Pasos:**
  1. POST `/api/children` en sala llena
- **Endpoint(s):** `POST /api/children`
- **Datos de entrada:** Datos válidos con classroomId de sala llena
- **Resultado esperado:** Status 400, `code: "CLASSROOM_FULL"`, mensaje con nombre de sala y capacidad
- **Resultado de error esperado:** N/A

### [CHILD-005] Crear niño en sala de otro jardín
- **Flujo:** Niños > Crear > Validación
- **Precondiciones:** classroomId perteneciente a otro jardín
- **Pasos:**
  1. POST `/api/children` con classroomId de otro jardín
- **Endpoint(s):** `POST /api/children`
- **Datos de entrada:** classroomId inválido para el jardín
- **Resultado esperado:** Status 400, `code: "INVALID_CLASSROOM"`
- **Resultado de error esperado:** N/A

### [CHILD-006] Crear niño como teacher (sin permiso)
- **Flujo:** Niños > Permisos
- **Precondiciones:** Token de teacher
- **Pasos:**
  1. POST `/api/children` con token de teacher
- **Endpoint(s):** `POST /api/children`
- **Datos de entrada:** Datos válidos
- **Resultado esperado:** Status 403, `code: "INSUFFICIENT_PERMISSIONS"` (requireAdmin)
- **Resultado de error esperado:** N/A

### [CHILD-007] Listar niños del jardín
- **Flujo:** Niños > Listar
- **Precondiciones:** Jardín con niños
- **Pasos:**
  1. GET `/api/children?gardenId={gardenId}`
  2. GET `/api/children?gardenId={gardenId}&classroomId={classroomId}` (filtro por sala)
  3. GET `/api/children?gardenId={gardenId}&status=active` (filtro por estado)
  4. GET `/api/children?gardenId={gardenId}&search=Vale` (búsqueda por nombre/nickname)
- **Endpoint(s):** `GET /api/children?gardenId=xxx`
- **Datos de entrada:** gardenId + filtros opcionales
- **Resultado esperado:** Status 200. Array `children` con classroom populado (name, emoji, color, shift). Ordenados por firstName, lastName. Solo niños con deletedAt=null. El filtro search busca en firstName, lastName y nickname (case insensitive).
- **Resultado de error esperado:** N/A

### [CHILD-008] Listar niños como familia (solo sus hijos)
- **Flujo:** Niños > Permisos familia
- **Precondiciones:** Usuario family con childrenIds en su membership
- **Pasos:**
  1. GET `/api/children?gardenId={gardenId}` con token de familia
- **Endpoint(s):** `GET /api/children?gardenId=xxx`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. Solo devuelve los niños cuyo _id está en membership.childrenIds de la familia
- **Resultado de error esperado:** N/A

### [CHILD-009] Obtener niño específico
- **Flujo:** Niños > Detalle
- **Precondiciones:** Niño creado
- **Pasos:**
  1. GET `/api/children/{childId}?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/children/:childId?gardenId=xxx`
- **Datos de entrada:** childId y gardenId
- **Resultado esperado:** Status 200. Objeto `child` completo con classroom y garden populados
- **Resultado de error esperado:** N/A

### [CHILD-010] Obtener niño de otro jardín
- **Flujo:** Niños > Permisos
- **Precondiciones:** Niño de otro jardín
- **Pasos:**
  1. GET `/api/children/{childIdOtroJardin}?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/children/:childId`
- **Datos de entrada:** childId de otro jardín
- **Resultado esperado:** Status 403, `code: "CHILD_ACCESS_DENIED"`
- **Resultado de error esperado:** N/A

### [CHILD-011] Obtener expediente completo del niño
- **Flujo:** Niños > Expediente
- **Precondiciones:** Niño con datos, entradas del cuaderno, asistencia, pagos
- **Pasos:**
  1. GET `/api/children/{childId}/record?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/children/:childId/record?gardenId=xxx`
- **Datos de entrada:** childId y gardenId
- **Resultado esperado:** Status 200. Objeto con `child` (completo) y `stats` (recentDailyEntries, recentAttendanceDays, pendingPayments)
- **Resultado de error esperado:** N/A

### [CHILD-012] Actualizar niño
- **Flujo:** Niños > Actualizar
- **Precondiciones:** Niño creado
- **Pasos:**
  1. PUT `/api/children/{childId}` con gardenId en body
- **Endpoint(s):** `PUT /api/children/:childId`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "nickname": "Valentinita",
    "medical": {
      "allergies": ["Maní", "Leche"]
    }
  }
  ```
- **Resultado esperado:** Status 200, `message: "Datos de Valentina actualizados correctamente ✅"`, child actualizado
- **Resultado de error esperado:** N/A

### [CHILD-013] Cambiar niño de sala
- **Flujo:** Niños > Actualizar > Cambio de sala
- **Precondiciones:** Niño en sala A, sala B con capacidad
- **Pasos:**
  1. PUT `/api/children/{childId}` con nuevo classroomId
  2. Verificar que el niño aparece en la nueva sala
  3. Verificar que ya no aparece en la sala anterior
- **Endpoint(s):** `PUT /api/children/:childId`
- **Datos de entrada:** `{ "gardenId": "xxx", "classroomId": "{nuevaSalaId}" }`
- **Resultado esperado:** Status 200. Niño cambiado de sala exitosamente.
- **Resultado de error esperado:** N/A

### [CHILD-014] Cambiar niño a sala llena
- **Flujo:** Niños > Actualizar > Validación
- **Precondiciones:** Sala destino llena
- **Pasos:**
  1. PUT `/api/children/{childId}` con classroomId de sala llena
- **Endpoint(s):** `PUT /api/children/:childId`
- **Datos de entrada:** classroomId de sala llena
- **Resultado esperado:** Status 400, `code: "CLASSROOM_FULL"`
- **Resultado de error esperado:** N/A

### [CHILD-015] Eliminar niño (soft delete)
- **Flujo:** Niños > Eliminar
- **Precondiciones:** Niño creado, usuario admin/owner
- **Pasos:**
  1. DELETE `/api/children/{childId}` con gardenId
  2. Verificar que el niño ya no aparece en listados (deletedAt != null)
  3. Verificar que el conteo de la sala se actualiza
- **Endpoint(s):** `DELETE /api/children/:childId`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200, `message: "Valentina Rodríguez eliminado del sistema ✅"`
- **Resultado de error esperado:** N/A

### [CHILD-016] Obtener niños de una sala específica (endpoint docente)
- **Flujo:** Niños > Listar por sala
- **Precondiciones:** Docente con acceso a la sala
- **Pasos:**
  1. GET `/api/children/classroom/{classroomId}?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/children/classroom/:classroomId?gardenId=xxx`
- **Datos de entrada:** classroomId y gardenId
- **Resultado esperado:** Status 200. Objeto con `classroom` (id, name, emoji) y `children` array
- **Resultado de error esperado:** N/A

### [CHILD-017] Docente accediendo a sala no asignada
- **Flujo:** Niños > Permisos docente
- **Precondiciones:** Docente sin acceso a esa sala
- **Pasos:**
  1. GET `/api/children/classroom/{otraSalaId}?gardenId={gardenId}` con token de docente
- **Endpoint(s):** `GET /api/children/classroom/:classroomId`
- **Datos de entrada:** classroomId no asignada
- **Resultado esperado:** Status 403, `code: "CLASSROOM_ACCESS_DENIED"`
- **Resultado de error esperado:** N/A

---

## 5. Asistencia

### [ATTEND-001] Obtener asistencia de sala por fecha (crea automáticamente)
- **Flujo:** Asistencia > Consultar
- **Precondiciones:** Sala con niños activos, sin asistencia cargada para la fecha
- **Pasos:**
  1. GET `/api/attendance?gardenId={gardenId}&classroomId={classroomId}&date=2026-02-14`
- **Endpoint(s):** `GET /api/attendance?gardenId=xxx&classroomId=yyy&date=YYYY-MM-DD`
- **Datos de entrada:** gardenId, classroomId, date
- **Resultado esperado:** Status 200. Se crea automáticamente la asistencia del día con todos los niños activos en status "absent". Respuesta incluye `attendance` con records populados (childId con firstName, lastName, nickname, photo), summary (total, present, absent, justified, late, attendanceRate), classroom info.
- **Resultado de error esperado:** N/A

### [ATTEND-002] Actualizar asistencia de un niño
- **Flujo:** Asistencia > Actualizar
- **Precondiciones:** Asistencia del día creada, usuario teacher+
- **Pasos:**
  1. PUT `/api/attendance` marcar como presente
  2. PUT `/api/attendance` marcar como ausencia justificada
  3. PUT `/api/attendance` marcar como llegada tarde
- **Endpoint(s):** `PUT /api/attendance`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "classroomId": "{classroomId}",
    "date": "2026-02-14",
    "childId": "{childId}",
    "status": "present",
    "arrivedAt": "08:30",
    "notes": "Llegó contenta"
  }
  ```
- **Resultado esperado:** Status 200, `message: "Asistencia de Valentina actualizada ✅"`, attendance con summary actualizado
- **Resultado de error esperado:** N/A

### [ATTEND-003] Actualizar asistencia con justificación
- **Flujo:** Asistencia > Actualizar con justificación
- **Precondiciones:** Asistencia del día creada
- **Pasos:**
  1. PUT `/api/attendance` con status "justified"
- **Endpoint(s):** `PUT /api/attendance`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "classroomId": "{classroomId}",
    "date": "2026-02-14",
    "childId": "{childId}",
    "status": "justified",
    "justification": "Control médico programado"
  }
  ```
- **Resultado esperado:** Status 200. Record del niño con status "justified" y justification seteada.
- **Resultado de error esperado:** N/A

### [ATTEND-004] Actualizar asistencia sin campos requeridos
- **Flujo:** Asistencia > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. PUT `/api/attendance` sin classroomId
  2. PUT `/api/attendance` sin date
  3. PUT `/api/attendance` sin childId
  4. PUT `/api/attendance` sin status
- **Endpoint(s):** `PUT /api/attendance`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"`
- **Resultado de error esperado:** N/A

### [ATTEND-005] Actualizar asistencia de niño que no pertenece a la sala
- **Flujo:** Asistencia > Validación
- **Precondiciones:** Niño de otra sala
- **Pasos:**
  1. PUT `/api/attendance` con childId de otra sala
- **Endpoint(s):** `PUT /api/attendance`
- **Datos de entrada:** childId de otra sala
- **Resultado esperado:** Status 400, `code: "INVALID_CHILD"`
- **Resultado de error esperado:** N/A

### [ATTEND-006] Obtener asistencia por rango de fechas
- **Flujo:** Asistencia > Reporte por rango
- **Precondiciones:** Asistencia cargada para varios días
- **Pasos:**
  1. GET `/api/attendance/range?gardenId={gardenId}&classroomId={classroomId}&startDate=2026-02-10&endDate=2026-02-14`
- **Endpoint(s):** `GET /api/attendance/range?gardenId=xxx&classroomId=yyy&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Datos de entrada:** gardenId, classroomId, startDate, endDate
- **Resultado esperado:** Status 200. Array `attendance` con registros del rango, records populados, ordenados por fecha ascendente. Objeto `classroom`.
- **Resultado de error esperado:** N/A

### [ATTEND-007] Obtener reporte de asistencia de un niño
- **Flujo:** Asistencia > Reporte individual
- **Precondiciones:** Asistencia cargada para el niño
- **Pasos:**
  1. GET `/api/attendance/child/{childId}?gardenId={gardenId}&startDate=2026-02-01&endDate=2026-02-28`
- **Endpoint(s):** `GET /api/attendance/child/:childId?gardenId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Datos de entrada:** childId, gardenId, startDate, endDate
- **Resultado esperado:** Status 200. Objeto `report` con: child (id, name, classroom), period (startDate, endDate), attendance (array de {date, status, arrivedAt, leftAt, justification, notes}), summary (totalDays, presentDays, absentDays, justifiedDays, lateDays, attendanceRate).
- **Resultado de error esperado:** N/A

### [ATTEND-008] Obtener resumen de asistencia del jardín
- **Flujo:** Asistencia > Resumen jardín
- **Precondiciones:** Jardín con salas y asistencia cargada
- **Pasos:**
  1. GET `/api/attendance/summary?gardenId={gardenId}&date=2026-02-14`
  2. GET `/api/attendance/summary?gardenId={gardenId}` (sin fecha, usa hoy)
- **Endpoint(s):** `GET /api/attendance/summary?gardenId=xxx&date=YYYY-MM-DD`
- **Datos de entrada:** gardenId, date (opcional)
- **Resultado esperado:** Status 200. Objeto con `date`, `gardenSummary` (totalChildren, present, absent, justified, late, attendanceRate), `classrooms` array (cada una con classroom info, totalChildren, attendance summary, hasData boolean).
- **Resultado de error esperado:** N/A

### [ATTEND-009] Validación de formato de hora (arrivedAt/leftAt)
- **Flujo:** Asistencia > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. PUT `/api/attendance` con arrivedAt: "25:00" (hora inválida)
  2. PUT `/api/attendance` con arrivedAt: "abc"
- **Endpoint(s):** `PUT /api/attendance`
- **Datos de entrada:** Horas con formato inválido
- **Resultado esperado:** Error de validación Mongoose: "Hora de llegada debe tener formato HH:MM"
- **Resultado de error esperado:** N/A

---

## 6. Cuaderno Digital

### [DAILY-001] Crear entrada del cuaderno digital
- **Flujo:** Cuaderno > Crear
- **Precondiciones:** Niño creado, usuario teacher+
- **Pasos:**
  1. POST `/api/daily-entries`
- **Endpoint(s):** `POST /api/daily-entries`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "childId": "{childId}",
    "date": "2026-02-14",
    "meals": [
      {
        "type": "desayuno",
        "description": "Leche con galletitas",
        "ate": "bien"
      },
      {
        "type": "almuerzo",
        "description": "Fideos con salsa",
        "ate": "poco",
        "notes": "No le gustó mucho la salsa"
      },
      {
        "type": "merienda",
        "description": "Jugo y tostadas",
        "ate": "bien"
      }
    ],
    "nap": {
      "slept": true,
      "from": "13:00",
      "to": "14:30",
      "quality": "bien",
      "notes": "Durmió tranquila"
    },
    "hygiene": {
      "diaperChanges": 3,
      "notes": "Todo normal"
    },
    "activities": [
      {
        "type": "artística",
        "description": "Pintura con témperas",
        "notes": "Le encantó pintar con los dedos"
      },
      {
        "type": "motriz",
        "description": "Juego en el patio con pelotas"
      }
    ],
    "mood": "contento",
    "observations": "Valentina tuvo un día muy lindo, jugó mucho con sus compañeritos",
    "status": "published"
  }
  ```
- **Resultado esperado:** Status 201, `message: "Cuaderno de Valentina creado ✅"`, entry completa
- **Resultado de error esperado:** N/A

### [DAILY-002] Actualizar entrada existente (misma fecha y niño)
- **Flujo:** Cuaderno > Actualizar
- **Precondiciones:** Entrada creada para ese niño y fecha
- **Pasos:**
  1. PUT `/api/daily-entries` con mismos childId y date
- **Endpoint(s):** `PUT /api/daily-entries`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "childId": "{childId}",
    "date": "2026-02-14",
    "mood": "tranquilo",
    "observations": "Actualización de la observación"
  }
  ```
- **Resultado esperado:** Status 200, `message: "Cuaderno de Valentina actualizado ✅"`. Solo se actualizan los campos enviados, los demás se mantienen.
- **Resultado de error esperado:** N/A

### [DAILY-003] Crear entrada sin campos requeridos
- **Flujo:** Cuaderno > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/daily-entries` sin childId
  2. POST `/api/daily-entries` sin date
- **Endpoint(s):** `POST /api/daily-entries`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"`
- **Resultado de error esperado:** N/A

### [DAILY-004] Obtener entradas por fecha y sala
- **Flujo:** Cuaderno > Listar por sala
- **Precondiciones:** Entradas publicadas
- **Pasos:**
  1. GET `/api/daily-entries?gardenId={gardenId}&classroomId={classroomId}&date=2026-02-14`
- **Endpoint(s):** `GET /api/daily-entries?gardenId=xxx&classroomId=yyy&date=YYYY-MM-DD`
- **Datos de entrada:** gardenId, classroomId, date
- **Resultado esperado:** Status 200. Objeto con date, classroom info, entries array (solo status "published", populados con childId y authorId)
- **Resultado de error esperado:** N/A

### [DAILY-005] Obtener entrada específica de niño por fecha
- **Flujo:** Cuaderno > Detalle
- **Precondiciones:** Entrada creada
- **Pasos:**
  1. GET `/api/daily-entries/child/{childId}/2026-02-14?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/daily-entries/child/:childId/:date?gardenId=xxx`
- **Datos de entrada:** childId, date, gardenId
- **Resultado esperado:** Status 200. Objeto `entry` completo con child, author y classroom populados
- **Resultado de error esperado:** N/A

### [DAILY-006] Obtener entrada inexistente
- **Flujo:** Cuaderno > Detalle > Error
- **Precondiciones:** Sin entrada para esa fecha
- **Pasos:**
  1. GET `/api/daily-entries/child/{childId}/2030-01-01?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/daily-entries/child/:childId/:date`
- **Datos de entrada:** Fecha sin entrada
- **Resultado esperado:** Status 404, `code: "ENTRY_NOT_FOUND"`
- **Resultado de error esperado:** N/A

### [DAILY-007] Obtener entradas de un niño por rango de fechas
- **Flujo:** Cuaderno > Historial
- **Precondiciones:** Varias entradas publicadas
- **Pasos:**
  1. GET `/api/daily-entries/child/{childId}?gardenId={gardenId}&startDate=2026-02-01&endDate=2026-02-28&limit=20`
- **Endpoint(s):** `GET /api/daily-entries/child/:childId?gardenId=xxx&startDate=...&endDate=...`
- **Datos de entrada:** childId, gardenId, fechas, limit
- **Resultado esperado:** Status 200. Objeto con child info y entries array (solo published, ordenadas desc por fecha)
- **Resultado de error esperado:** N/A

### [DAILY-008] Agregar foto a entrada
- **Flujo:** Cuaderno > Fotos
- **Precondiciones:** Entrada creada
- **Pasos:**
  1. POST `/api/daily-entries/{entryId}/photos`
- **Endpoint(s):** `POST /api/daily-entries/:entryId/photos`
- **Datos de entrada:** `{ "gardenId": "xxx", "photoUrl": "/uploads/daily/foto1.jpg", "caption": "Valentina pintando" }`
- **Resultado esperado:** Status 200, `message: "Foto agregada exitosamente 📷"`, photos array actualizado
- **Resultado de error esperado:** N/A

### [DAILY-009] Agregar foto sin URL
- **Flujo:** Cuaderno > Fotos > Validación
- **Precondiciones:** Entrada creada
- **Pasos:**
  1. POST `/api/daily-entries/{entryId}/photos` sin photoUrl
- **Endpoint(s):** `POST /api/daily-entries/:entryId/photos`
- **Datos de entrada:** `{ "gardenId": "xxx" }`
- **Resultado esperado:** Status 400, `code: "MISSING_PHOTO_URL"`
- **Resultado de error esperado:** N/A

### [DAILY-010] Marcar entrada como vista por familia
- **Flujo:** Cuaderno > Vista familia
- **Precondiciones:** Entrada publicada
- **Pasos:**
  1. POST `/api/daily-entries/{entryId}/seen` con token de familia
  2. Repetir (debe ser idempotente)
- **Endpoint(s):** `POST /api/daily-entries/:entryId/seen`
- **Datos de entrada:** `{ "gardenId": "xxx" }`
- **Resultado esperado:** Status 200, `message: "Entrada marcada como vista ✅"`. No debe duplicar el seenBy si ya fue visto.
- **Resultado de error esperado:** N/A

### [DAILY-011] Feed del cuaderno para familias
- **Flujo:** Cuaderno > Feed familia
- **Precondiciones:** Familia con hijos, entradas publicadas
- **Pasos:**
  1. GET `/api/daily-entries/feed?gardenId={gardenId}&limit=10&page=1` con token de familia
- **Endpoint(s):** `GET /api/daily-entries/feed?gardenId=xxx&limit=10&page=1`
- **Datos de entrada:** gardenId, limit, page
- **Resultado esperado:** Status 200. Array `entries` con entradas de los hijos de la familia, populadas con child, author, classroom. Paginación. Las entradas se marcan automáticamente como vistas.
- **Resultado de error esperado:** N/A

### [DAILY-012] Feed accedido por no-familia
- **Flujo:** Cuaderno > Feed > Permisos
- **Precondiciones:** Token de teacher o admin
- **Pasos:**
  1. GET `/api/daily-entries/feed?gardenId={gardenId}` con token de teacher
- **Endpoint(s):** `GET /api/daily-entries/feed`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 403, `code: "FAMILY_ONLY"`
- **Resultado de error esperado:** N/A

### [DAILY-013] Estadísticas del cuaderno
- **Flujo:** Cuaderno > Estadísticas
- **Precondiciones:** Entradas publicadas
- **Pasos:**
  1. GET `/api/daily-entries/stats?gardenId={gardenId}&classroomId={classroomId}&startDate=2026-02-01&endDate=2026-02-28`
- **Endpoint(s):** `GET /api/daily-entries/stats?gardenId=xxx&classroomId=yyy&startDate=...&endDate=...`
- **Datos de entrada:** gardenId, classroomId, fechas
- **Resultado esperado:** Status 200. Objeto `stats` con totalEntries, totalPhotos, avgPhotosPerEntry, activitiesByType (conteo por tipo), moodDistribution (conteo por mood)
- **Resultado de error esperado:** N/A

---

## 7. Comunicados

### [ANN-001] Crear comunicado para todo el jardín
- **Flujo:** Comunicados > Crear
- **Precondiciones:** Usuario teacher+
- **Pasos:**
  1. POST `/api/announcements`
- **Endpoint(s):** `POST /api/announcements`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "title": "Reunión de padres - Marzo",
    "body": "Queridas familias, los invitamos a la reunión de padres del día 5 de marzo a las 18:00 hs en el SUM del jardín. Los esperamos! 🤗",
    "scope": "garden",
    "requiresAck": true,
    "status": "published",
    "pinned": false,
    "urgent": false
  }
  ```
- **Resultado esperado:** Status 201, `message: 'Comunicado "Reunión de padres - Marzo" creado exitosamente 📢'`, announcement completo
- **Resultado de error esperado:** N/A

### [ANN-002] Crear comunicado para salas específicas
- **Flujo:** Comunicados > Crear por sala
- **Precondiciones:** Salas creadas
- **Pasos:**
  1. POST `/api/announcements` con scope "classroom"
- **Endpoint(s):** `POST /api/announcements`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "title": "Paseo al parque",
    "body": "La sala Pollitos irá de paseo al parque el viernes. Traer gorra y protector solar.",
    "scope": "classroom",
    "classroomIds": ["{classroomId}"],
    "status": "published"
  }
  ```
- **Resultado esperado:** Status 201. Comunicado con scope "classroom" y classroomIds populados.
- **Resultado de error esperado:** N/A

### [ANN-003] Crear comunicado por sala sin classroomIds
- **Flujo:** Comunicados > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/announcements` con scope "classroom" y classroomIds vacío
- **Endpoint(s):** `POST /api/announcements`
- **Datos de entrada:** `{ "gardenId": "xxx", "title": "Test", "body": "Test", "scope": "classroom", "classroomIds": [] }`
- **Resultado esperado:** Status 400, `code: "MISSING_CLASSROOMS"`
- **Resultado de error esperado:** N/A

### [ANN-004] Crear comunicado sin campos requeridos
- **Flujo:** Comunicados > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/announcements` sin title
  2. POST `/api/announcements` sin body
  3. POST `/api/announcements` sin scope
- **Endpoint(s):** `POST /api/announcements`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"`
- **Resultado de error esperado:** N/A

### [ANN-005] Listar comunicados
- **Flujo:** Comunicados > Listar
- **Precondiciones:** Comunicados publicados
- **Pasos:**
  1. GET `/api/announcements?gardenId={gardenId}&status=published&limit=20&page=1`
- **Endpoint(s):** `GET /api/announcements?gardenId=xxx`
- **Datos de entrada:** gardenId, status, limit, page
- **Resultado esperado:** Status 200. Array `announcements` con comunicados relevantes para el usuario (garden scope + classroom scope de sus salas). Paginación incluida. Ordenados: pinned primero, luego por publishedAt desc.
- **Resultado de error esperado:** N/A

### [ANN-006] Obtener comunicado específico
- **Flujo:** Comunicados > Detalle
- **Precondiciones:** Comunicado creado
- **Pasos:**
  1. GET `/api/announcements/{announcementId}?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/announcements/:announcementId?gardenId=xxx`
- **Datos de entrada:** announcementId, gardenId
- **Resultado esperado:** Status 200. Objeto `announcement` con author y classrooms populados
- **Resultado de error esperado:** N/A

### [ANN-007] Obtener comunicado de otro jardín
- **Flujo:** Comunicados > Permisos
- **Precondiciones:** Comunicado de otro jardín
- **Pasos:**
  1. GET `/api/announcements/{announcementIdOtroJardin}?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/announcements/:announcementId`
- **Datos de entrada:** announcementId de otro jardín
- **Resultado esperado:** Status 403, `code: "ANNOUNCEMENT_ACCESS_DENIED"`
- **Resultado de error esperado:** N/A

### [ANN-008] Actualizar comunicado (autor)
- **Flujo:** Comunicados > Actualizar
- **Precondiciones:** Comunicado creado por el usuario
- **Pasos:**
  1. PUT `/api/announcements/{announcementId}` con datos nuevos
- **Endpoint(s):** `PUT /api/announcements/:announcementId`
- **Datos de entrada:** `{ "gardenId": "xxx", "title": "Reunión de padres - Marzo (ACTUALIZADO)", "urgent": true }`
- **Resultado esperado:** Status 200, `message` con título actualizado
- **Resultado de error esperado:** N/A

### [ANN-009] Actualizar comunicado sin permiso (otro teacher)
- **Flujo:** Comunicados > Permisos
- **Precondiciones:** Comunicado creado por otra persona, usuario teacher
- **Pasos:**
  1. PUT `/api/announcements/{announcementId}` con token de otro teacher
- **Endpoint(s):** `PUT /api/announcements/:announcementId`
- **Datos de entrada:** Datos válidos
- **Resultado esperado:** Status 403, `code: "EDIT_PERMISSION_DENIED"` (solo autor o admin pueden editar)
- **Resultado de error esperado:** N/A

### [ANN-010] Confirmar lectura de comunicado
- **Flujo:** Comunicados > Acknowledge
- **Precondiciones:** Comunicado con requiresAck: true
- **Pasos:**
  1. POST `/api/announcements/{announcementId}/acknowledge`
  2. Repetir (debe ser idempotente)
- **Endpoint(s):** `POST /api/announcements/:announcementId/acknowledge`
- **Datos de entrada:** `{ "gardenId": "xxx" }`
- **Resultado esperado:** Status 200, `message: "Lectura confirmada ✅"`. No duplica acknowledgement.
- **Resultado de error esperado:** N/A

### [ANN-011] Confirmar lectura de comunicado que no requiere ack
- **Flujo:** Comunicados > Acknowledge > Error
- **Precondiciones:** Comunicado con requiresAck: false
- **Pasos:**
  1. POST `/api/announcements/{announcementId}/acknowledge`
- **Endpoint(s):** `POST /api/announcements/:announcementId/acknowledge`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 400, `code: "ACK_NOT_REQUIRED"`
- **Resultado de error esperado:** N/A

### [ANN-012] Eliminar comunicado (soft delete)
- **Flujo:** Comunicados > Eliminar
- **Precondiciones:** Comunicado creado
- **Pasos:**
  1. DELETE `/api/announcements/{announcementId}` con gardenId
- **Endpoint(s):** `DELETE /api/announcements/:announcementId`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200, `message` con título del comunicado eliminado. Soft delete.
- **Resultado de error esperado:** N/A

---

## 8. Pagos

### [PAY-001] Crear cuotas mensuales automáticamente (todas las salas)
- **Flujo:** Pagos > Crear cuotas
- **Precondiciones:** Salas con niños activos, usuario admin
- **Pasos:**
  1. POST `/api/payments/create-monthly`
- **Endpoint(s):** `POST /api/payments/create-monthly`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "period": "2026-03"
  }
  ```
- **Resultado esperado:** Status 200, `message: "✅ X cuotas creadas para el período 2026-03"`. Se crea un Payment por cada niño activo, con amount del fee de su sala, dueDate según el dueDay configurado.
- **Resultado de error esperado:** N/A

### [PAY-002] Crear cuotas para una sala específica
- **Flujo:** Pagos > Crear cuotas parcial
- **Precondiciones:** Sala con niños
- **Pasos:**
  1. POST `/api/payments/create-monthly` con classroomId
- **Endpoint(s):** `POST /api/payments/create-monthly`
- **Datos de entrada:** `{ "gardenId": "xxx", "period": "2026-03", "classroomId": "{classroomId}" }`
- **Resultado esperado:** Status 200. Solo se crean cuotas para los niños de esa sala.
- **Resultado de error esperado:** N/A

### [PAY-003] Crear cuotas duplicadas (mismo período)
- **Flujo:** Pagos > Crear cuotas > Idempotencia
- **Precondiciones:** Cuotas ya creadas para el período
- **Pasos:**
  1. POST `/api/payments/create-monthly` con mismo período
- **Endpoint(s):** `POST /api/payments/create-monthly`
- **Datos de entrada:** `{ "gardenId": "xxx", "period": "2026-03" }`
- **Resultado esperado:** Status 200 con `created: 0` (no duplica, índice unique childId+period)
- **Resultado de error esperado:** N/A

### [PAY-004] Crear cuotas sin período
- **Flujo:** Pagos > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/payments/create-monthly` sin period
- **Endpoint(s):** `POST /api/payments/create-monthly`
- **Datos de entrada:** `{ "gardenId": "xxx" }`
- **Resultado esperado:** Status 400, `code: "MISSING_PERIOD"`
- **Resultado de error esperado:** N/A

### [PAY-005] Listar pagos con filtros
- **Flujo:** Pagos > Listar
- **Precondiciones:** Pagos creados
- **Pasos:**
  1. GET `/api/payments?gardenId={gardenId}` (todos)
  2. GET `/api/payments?gardenId={gardenId}&status=pending`
  3. GET `/api/payments?gardenId={gardenId}&period=2026-03`
  4. GET `/api/payments?gardenId={gardenId}&childId={childId}`
  5. GET `/api/payments?gardenId={gardenId}&classroomId={classroomId}`
- **Endpoint(s):** `GET /api/payments?gardenId=xxx`
- **Datos de entrada:** gardenId + filtros opcionales
- **Resultado esperado:** Status 200. Array `payments` con child, classroom, recordedBy populados. Paginación. Ordenados por dueDate desc.
- **Resultado de error esperado:** N/A

### [PAY-006] Listar pagos como familia (solo sus hijos)
- **Flujo:** Pagos > Permisos familia
- **Precondiciones:** Familia con hijos
- **Pasos:**
  1. GET `/api/payments?gardenId={gardenId}` con token de familia
- **Endpoint(s):** `GET /api/payments`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. Solo pagos de los childrenIds de la familia.
- **Resultado de error esperado:** N/A

### [PAY-007] Registrar pago completo
- **Flujo:** Pagos > Registrar pago
- **Precondiciones:** Pago pendiente, usuario admin
- **Pasos:**
  1. POST `/api/payments/{paymentId}/record`
- **Endpoint(s):** `POST /api/payments/:paymentId/record`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "amount": 45000,
    "method": "transferencia",
    "reference": "TRF-2026-03-001",
    "notes": "Transferencia bancaria recibida"
  }
  ```
- **Resultado esperado:** Status 200, `message: "Pago de Valentina registrado ✅"`. El payment cambia a status "paid", paidAmount = total, paidAt seteado.
- **Resultado de error esperado:** N/A

### [PAY-008] Registrar pago parcial
- **Flujo:** Pagos > Pago parcial
- **Precondiciones:** Pago pendiente con total=45000
- **Pasos:**
  1. POST `/api/payments/{paymentId}/record` con amount=20000
- **Endpoint(s):** `POST /api/payments/:paymentId/record`
- **Datos de entrada:** `{ "gardenId": "xxx", "amount": 20000, "method": "efectivo" }`
- **Resultado esperado:** Status 200. Payment con status "partial", paidAmount=20000, balance=25000.
- **Resultado de error esperado:** N/A

### [PAY-009] Registrar pago sin campos requeridos
- **Flujo:** Pagos > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/payments/{paymentId}/record` sin amount
  2. POST `/api/payments/{paymentId}/record` sin method
- **Endpoint(s):** `POST /api/payments/:paymentId/record`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_PAYMENT_DATA"`
- **Resultado de error esperado:** N/A

### [PAY-010] Obtener estado de cuenta de una familia
- **Flujo:** Pagos > Estado de cuenta
- **Precondiciones:** Pagos del niño
- **Pasos:**
  1. GET `/api/payments/child/{childId}?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/payments/child/:childId?gardenId=xxx`
- **Datos de entrada:** childId, gardenId
- **Resultado esperado:** Status 200. Objeto con `child` (id, name), `payments` array, `totals` (totalAmount, totalPaid, totalBalance, overdueCount)
- **Resultado de error esperado:** N/A

### [PAY-011] Obtener reporte de morosos
- **Flujo:** Pagos > Reporte morosos
- **Precondiciones:** Pagos vencidos, usuario admin
- **Pasos:**
  1. GET `/api/payments/overdue?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/payments/overdue?gardenId=xxx`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. Objeto con `overdueCount`, `totalOverdueAmount`, `report` array (agrupado por niño, con child, classroom, payments[], totalOverdue, oldestOverdue). Ordenado por antigüedad.
- **Resultado de error esperado:** N/A

### [PAY-012] Registrar pago de otro jardín
- **Flujo:** Pagos > Permisos
- **Precondiciones:** paymentId de otro jardín
- **Pasos:**
  1. POST `/api/payments/{paymentIdOtroJardin}/record`
- **Endpoint(s):** `POST /api/payments/:paymentId/record`
- **Datos de entrada:** Datos válidos
- **Resultado esperado:** Status 404, `code: "PAYMENT_NOT_FOUND"`
- **Resultado de error esperado:** N/A

---

## 9. Mensajes

### [MSG-001] Enviar mensaje como familia
- **Flujo:** Mensajes > Enviar
- **Precondiciones:** Familia con hijos en el jardín
- **Pasos:**
  1. POST `/api/messages`
- **Endpoint(s):** `POST /api/messages`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "content": "Hola seño, quería avisar que Valentina mañana no va a poder ir porque tiene turno médico. Gracias!",
    "childId": "{childId}"
  }
  ```
- **Resultado esperado:** Status 201, `message: "Mensaje enviado ✅"`. Se genera threadId con formato `{gardenId}-{familyUserId}-{childId}`. Mensaje populado con sender y child.
- **Resultado de error esperado:** N/A

### [MSG-002] Enviar mensaje como admin/teacher (responder a familia)
- **Flujo:** Mensajes > Responder
- **Precondiciones:** Thread existente
- **Pasos:**
  1. POST `/api/messages` con recipientUserId
- **Endpoint(s):** `POST /api/messages`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "content": "¡Hola Carlos! Perfecto, no hay problema. Que se mejore Valentina ❤️",
    "recipientUserId": "{familyUserId}",
    "childId": "{childId}"
  }
  ```
- **Resultado esperado:** Status 201. ThreadId generado a partir del recipientUserId.
- **Resultado de error esperado:** N/A

### [MSG-003] Enviar mensaje sin contenido
- **Flujo:** Mensajes > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/messages` con content vacío o solo espacios
- **Endpoint(s):** `POST /api/messages`
- **Datos de entrada:** `{ "gardenId": "xxx", "content": "" }`
- **Resultado esperado:** Status 400, `code: "MISSING_CONTENT"`
- **Resultado de error esperado:** N/A

### [MSG-004] Enviar mensaje como admin sin recipientUserId
- **Flujo:** Mensajes > Validación
- **Precondiciones:** Token de admin/teacher
- **Pasos:**
  1. POST `/api/messages` sin recipientUserId
- **Endpoint(s):** `POST /api/messages`
- **Datos de entrada:** `{ "gardenId": "xxx", "content": "Hola" }`
- **Resultado esperado:** Status 400, `code: "MISSING_RECIPIENT"`
- **Resultado de error esperado:** N/A

### [MSG-005] Obtener conversaciones (threads) como admin
- **Flujo:** Mensajes > Listar threads
- **Precondiciones:** Mensajes enviados
- **Pasos:**
  1. GET `/api/messages/threads?gardenId={gardenId}&limit=20`
- **Endpoint(s):** `GET /api/messages/threads?gardenId=xxx`
- **Datos de entrada:** gardenId, limit
- **Resultado esperado:** Status 200. Array `threads` con cada thread: _id (threadId), lastMessage (con sender y child), unreadCount, messageCount. Ordenados por último mensaje.
- **Resultado de error esperado:** N/A

### [MSG-006] Obtener conversaciones como familia
- **Flujo:** Mensajes > Listar threads familia
- **Precondiciones:** Familia con mensajes
- **Pasos:**
  1. GET `/api/messages/threads?gardenId={gardenId}` con token de familia
- **Endpoint(s):** `GET /api/messages/threads?gardenId=xxx`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. Solo threads de esa familia (filtrado por familyUserId).
- **Resultado de error esperado:** N/A

### [MSG-007] Obtener mensajes de un thread
- **Flujo:** Mensajes > Leer thread
- **Precondiciones:** Thread con mensajes
- **Pasos:**
  1. GET `/api/messages/thread/{threadId}?gardenId={gardenId}&page=1&limit=50`
- **Endpoint(s):** `GET /api/messages/thread/:threadId?gardenId=xxx`
- **Datos de entrada:** threadId, gardenId, page, limit
- **Resultado esperado:** Status 200. Array `messages` con sender y child populados, ordenados desc por createdAt. Los mensajes del otro usuario se marcan como leídos automáticamente. Paginación.
- **Resultado de error esperado:** N/A

### [MSG-008] Familia accediendo a thread ajeno
- **Flujo:** Mensajes > Permisos
- **Precondiciones:** Thread de otra familia
- **Pasos:**
  1. GET `/api/messages/thread/{threadIdOtraFamilia}?gardenId={gardenId}` con token de familia
- **Endpoint(s):** `GET /api/messages/thread/:threadId`
- **Datos de entrada:** threadId de otra familia
- **Resultado esperado:** Status 403, `code: "THREAD_ACCESS_DENIED"`
- **Resultado de error esperado:** N/A

### [MSG-009] Obtener conteo de mensajes no leídos
- **Flujo:** Mensajes > No leídos
- **Precondiciones:** Mensajes sin leer
- **Pasos:**
  1. GET `/api/messages/unread?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/messages/unread?gardenId=xxx`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. `unreadThreads` (número de threads con no leídos) y `unreadMessages` (total de mensajes no leídos)
- **Resultado de error esperado:** N/A

---

## 10. Calendario

### [CAL-001] Crear evento
- **Flujo:** Calendario > Crear
- **Precondiciones:** Usuario teacher+
- **Pasos:**
  1. POST `/api/calendar`
- **Endpoint(s):** `POST /api/calendar`
- **Datos de entrada:**
  ```json
  {
    "gardenId": "{gardenId}",
    "title": "Acto del 25 de Mayo",
    "description": "Acto escolar con participación de todas las salas",
    "date": "2026-05-25",
    "time": "10:00",
    "endTime": "12:00",
    "type": "event",
    "scope": "garden",
    "color": "#F2A7B3",
    "location": "SUM del jardín"
  }
  ```
- **Resultado esperado:** Status 201, `message: 'Evento "Acto del 25 de Mayo" creado exitosamente 📅'`
- **Resultado de error esperado:** N/A

### [CAL-002] Crear evento sin campos requeridos
- **Flujo:** Calendario > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/calendar` sin title, date, type o scope
- **Endpoint(s):** `POST /api/calendar`
- **Datos de entrada:** Body incompleto
- **Resultado esperado:** Status 400, `code: "MISSING_REQUIRED_FIELDS"`
- **Resultado de error esperado:** N/A

### [CAL-003] Crear evento por sala sin classroomIds
- **Flujo:** Calendario > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/calendar` con scope "classroom" y sin classroomIds
- **Endpoint(s):** `POST /api/calendar`
- **Datos de entrada:** `{ ..., "scope": "classroom", "classroomIds": [] }`
- **Resultado esperado:** Status 400, `code: "MISSING_CLASSROOMS"`
- **Resultado de error esperado:** N/A

### [CAL-004] Obtener eventos del mes
- **Flujo:** Calendario > Listar mes
- **Precondiciones:** Eventos creados
- **Pasos:**
  1. GET `/api/calendar/month?gardenId={gardenId}&year=2026&month=5`
- **Endpoint(s):** `GET /api/calendar/month?gardenId=xxx&year=2026&month=5`
- **Datos de entrada:** gardenId, year, month
- **Resultado esperado:** Status 200. `year`, `month`, array `events` con author y classrooms populados, ordenados por date y time.
- **Resultado de error esperado:** N/A

### [CAL-005] Obtener eventos sin year/month
- **Flujo:** Calendario > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. GET `/api/calendar/month?gardenId={gardenId}` (sin year ni month)
- **Endpoint(s):** `GET /api/calendar/month`
- **Datos de entrada:** Solo gardenId
- **Resultado esperado:** Status 400, `code: "MISSING_DATE_PARAMS"`
- **Resultado de error esperado:** N/A

### [CAL-006] Obtener eventos de hoy
- **Flujo:** Calendario > Hoy
- **Precondiciones:** Eventos para la fecha actual
- **Pasos:**
  1. GET `/api/calendar/today?gardenId={gardenId}`
- **Endpoint(s):** `GET /api/calendar/today?gardenId=xxx`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200. `today` (fecha), array `events` del día ordenados por hora.
- **Resultado de error esperado:** N/A

### [CAL-007] Obtener próximos eventos
- **Flujo:** Calendario > Próximos
- **Precondiciones:** Eventos futuros
- **Pasos:**
  1. GET `/api/calendar/upcoming?gardenId={gardenId}&days=7`
- **Endpoint(s):** `GET /api/calendar/upcoming?gardenId=xxx&days=7`
- **Datos de entrada:** gardenId, days
- **Resultado esperado:** Status 200. `days`, array `events` de los próximos N días, máximo 10.
- **Resultado de error esperado:** N/A

### [CAL-008] Actualizar evento
- **Flujo:** Calendario > Actualizar
- **Precondiciones:** Evento creado, usuario autor o admin
- **Pasos:**
  1. PUT `/api/calendar/{eventId}`
- **Endpoint(s):** `PUT /api/calendar/:eventId`
- **Datos de entrada:** `{ "gardenId": "xxx", "title": "Acto del 25 de Mayo (confirmado)", "status": "scheduled" }`
- **Resultado esperado:** Status 200, mensaje con título actualizado
- **Resultado de error esperado:** N/A

### [CAL-009] Actualizar evento sin permiso
- **Flujo:** Calendario > Permisos
- **Precondiciones:** Evento creado por otro usuario, token de teacher no-autor
- **Pasos:**
  1. PUT `/api/calendar/{eventId}` con token de teacher que no es autor
- **Endpoint(s):** `PUT /api/calendar/:eventId`
- **Datos de entrada:** Datos válidos
- **Resultado esperado:** Status 403, `code: "EDIT_PERMISSION_DENIED"`
- **Resultado de error esperado:** N/A

### [CAL-010] Eliminar evento
- **Flujo:** Calendario > Eliminar
- **Precondiciones:** Evento creado
- **Pasos:**
  1. DELETE `/api/calendar/{eventId}` con gardenId
- **Endpoint(s):** `DELETE /api/calendar/:eventId`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 200, mensaje con título del evento eliminado. Hard delete (deleteOne).
- **Resultado de error esperado:** N/A

### [CAL-011] Eliminar evento sin permiso
- **Flujo:** Calendario > Permisos
- **Precondiciones:** Evento de otro usuario, token de teacher no-autor ni admin
- **Pasos:**
  1. DELETE `/api/calendar/{eventId}` con token de teacher no-autor
- **Endpoint(s):** `DELETE /api/calendar/:eventId`
- **Datos de entrada:** gardenId
- **Resultado esperado:** Status 403, `code: "DELETE_PERMISSION_DENIED"`
- **Resultado de error esperado:** N/A

---

## 11. Uploads

### [UPLOAD-001] Subir avatar de usuario
- **Flujo:** Uploads > Avatar
- **Precondiciones:** Token válido
- **Pasos:**
  1. POST `/api/upload/avatar` con archivo JPEG (multipart/form-data, campo "avatar")
- **Endpoint(s):** `POST /api/upload/avatar`
- **Datos de entrada:** Archivo JPEG <= 10MB
- **Resultado esperado:** Status 200, `message: "Avatar subido correctamente ✅"`, avatar con url, filename, size, mimetype
- **Resultado de error esperado:** N/A

### [UPLOAD-002] Subir avatar sin archivo
- **Flujo:** Uploads > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/upload/avatar` sin archivo
- **Endpoint(s):** `POST /api/upload/avatar`
- **Datos de entrada:** Request sin archivo
- **Resultado esperado:** Status 400, `code: "NO_FILE"`
- **Resultado de error esperado:** N/A

### [UPLOAD-003] Subir archivo con tipo no permitido
- **Flujo:** Uploads > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/upload/avatar` con archivo .exe
- **Endpoint(s):** `POST /api/upload/avatar`
- **Datos de entrada:** Archivo con MIME type no permitido
- **Resultado esperado:** Status 400, `code: "INVALID_FILE_TYPE"`
- **Resultado de error esperado:** N/A

### [UPLOAD-004] Subir archivo demasiado grande (>10MB)
- **Flujo:** Uploads > Validación
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/upload/avatar` con archivo >10MB
- **Endpoint(s):** `POST /api/upload/avatar`
- **Datos de entrada:** Archivo grande
- **Resultado esperado:** Status 400, `code: "FILE_TOO_LARGE"`
- **Resultado de error esperado:** N/A

### [UPLOAD-005] Subir foto de niño
- **Flujo:** Uploads > Foto niño
- **Precondiciones:** Token válido, gardenId
- **Pasos:**
  1. POST `/api/upload/child-photo` con archivo (campo "childPhoto")
- **Endpoint(s):** `POST /api/upload/child-photo`
- **Datos de entrada:** Archivo imagen + gardenId
- **Resultado esperado:** Status 200, photo con url, filename, size, mimetype
- **Resultado de error esperado:** N/A

### [UPLOAD-006] Subir fotos del cuaderno digital (múltiples)
- **Flujo:** Uploads > Fotos diarias
- **Precondiciones:** Token válido, gardenId
- **Pasos:**
  1. POST `/api/upload/daily-photos` con hasta 5 archivos (campo "dailyPhoto")
- **Endpoint(s):** `POST /api/upload/daily-photos`
- **Datos de entrada:** Múltiples archivos imagen
- **Resultado esperado:** Status 200, message con cantidad, array photos
- **Resultado de error esperado:** N/A

### [UPLOAD-007] Subir documentos
- **Flujo:** Uploads > Documentos
- **Precondiciones:** Token válido, gardenId
- **Pasos:**
  1. POST `/api/upload/documents` con archivos PDF/Word (campo "document")
- **Endpoint(s):** `POST /api/upload/documents`
- **Datos de entrada:** Archivos PDF/Word
- **Resultado esperado:** Status 200, documents array con url, filename, originalName, size, mimetype
- **Resultado de error esperado:** N/A

### [UPLOAD-008] Subir logo del jardín
- **Flujo:** Uploads > Logo
- **Precondiciones:** Token válido, gardenId
- **Pasos:**
  1. POST `/api/upload/logo` con imagen (campo "logo")
- **Endpoint(s):** `POST /api/upload/logo`
- **Datos de entrada:** Archivo imagen (incluye SVG)
- **Resultado esperado:** Status 200, logo con url, filename, size, mimetype
- **Resultado de error esperado:** N/A

### [UPLOAD-009] Subir archivos para comunicados
- **Flujo:** Uploads > Comunicados
- **Precondiciones:** Token válido, gardenId
- **Pasos:**
  1. POST `/api/upload/announcements` con hasta 3 archivos (campo "announcement")
- **Endpoint(s):** `POST /api/upload/announcements`
- **Datos de entrada:** Archivos (imagen/PDF/Word)
- **Resultado esperado:** Status 200, attachments array con name, url, type, size
- **Resultado de error esperado:** N/A

### [UPLOAD-010] Subir archivos para mensajes
- **Flujo:** Uploads > Mensajes
- **Precondiciones:** Token válido, gardenId
- **Pasos:**
  1. POST `/api/upload/messages` con hasta 3 archivos (campo "message")
- **Endpoint(s):** `POST /api/upload/messages`
- **Datos de entrada:** Archivos (imagen/PDF)
- **Resultado esperado:** Status 200, attachments array
- **Resultado de error esperado:** N/A

---

## 12. Flujos de Negocio E2E

### [E2E-001] Flujo completo: Registro → Crear sala → Agregar niño → Tomar asistencia
- **Flujo:** E2E > Onboarding completo
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/auth/register` — Crear cuenta con jardín
  2. Guardar token y gardenId
  3. POST `/api/classrooms` — Crear sala "Pollitos" con fee
  4. Guardar classroomId
  5. POST `/api/children` — Crear niño "Valentina" en sala Pollitos
  6. Guardar childId
  7. GET `/api/attendance?gardenId=xxx&classroomId=yyy&date=2026-02-14` — Se crea asistencia automática
  8. PUT `/api/attendance` — Marcar Valentina como presente
  9. GET `/api/attendance/summary?gardenId=xxx` — Verificar resumen
- **Endpoint(s):** Múltiples (ver pasos)
- **Datos de entrada:** Ver tests individuales
- **Resultado esperado:** Cada paso devuelve status exitoso. La asistencia se refleja en el resumen del jardín.
- **Resultado de error esperado:** N/A

### [E2E-002] Flujo completo: Cuaderno digital para familia
- **Flujo:** E2E > Cuaderno familia
- **Precondiciones:** Jardín con sala, niño, docente y familia configurados
- **Pasos:**
  1. Login como docente
  2. POST `/api/daily-entries` — Crear entrada con comidas, siesta, actividades
  3. POST `/api/daily-entries/{entryId}/photos` — Agregar fotos
  4. PUT `/api/daily-entries` — Publicar la entrada (status: "published")
  5. Login como familia
  6. GET `/api/daily-entries/feed?gardenId=xxx` — Verificar que aparece en el feed
  7. Verificar que se marca automáticamente como vista
- **Endpoint(s):** Múltiples
- **Datos de entrada:** Ver tests individuales
- **Resultado esperado:** La familia ve la entrada publicada. Se marca como vista.
- **Resultado de error esperado:** N/A

### [E2E-003] Flujo completo: Ciclo de cobro mensual
- **Flujo:** E2E > Pagos mensual
- **Precondiciones:** Jardín con salas y niños
- **Pasos:**
  1. Login como admin/owner
  2. POST `/api/payments/create-monthly` con period "2026-03" — Generar cuotas
  3. GET `/api/payments?gardenId=xxx&period=2026-03` — Ver cuotas generadas
  4. POST `/api/payments/{paymentId}/record` — Registrar pago de un niño
  5. GET `/api/payments/overdue?gardenId=xxx` — Ver morosos (no debería estar el que pagó)
  6. GET `/api/payments/child/{childId}?gardenId=xxx` — Estado de cuenta
- **Endpoint(s):** Múltiples
- **Datos de entrada:** Ver tests individuales
- **Resultado esperado:** Cuotas generadas, pago registrado, morosos actualizados, estado de cuenta correcto.
- **Resultado de error esperado:** N/A

### [E2E-004] Flujo completo: Comunicado con confirmación de lectura
- **Flujo:** E2E > Comunicado + ACK
- **Precondiciones:** Jardín con familias
- **Pasos:**
  1. Login como admin
  2. POST `/api/announcements` con requiresAck: true, status: "published"
  3. Login como familia
  4. GET `/api/announcements?gardenId=xxx` — Ver comunicado
  5. POST `/api/announcements/{id}/acknowledge` — Confirmar lectura
  6. Login como admin
  7. GET `/api/announcements/{id}?gardenId=xxx` — Ver acknowledgements
- **Endpoint(s):** Múltiples
- **Datos de entrada:** Ver tests individuales
- **Resultado esperado:** La familia ve el comunicado, confirma lectura, el admin ve la confirmación.
- **Resultado de error esperado:** N/A

### [E2E-005] Flujo completo: Invitar docente → Asignar a sala → Docente opera
- **Flujo:** E2E > Invitación docente
- **Precondiciones:** Jardín con sala
- **Pasos:**
  1. POST `/api/gardens/{gardenId}/invite` — Invitar docente
  2. Login como docente (si ya existía) o configurar contraseña
  3. GET `/api/classrooms?gardenId=xxx` — Ver salas
  4. GET `/api/children/classroom/{classroomId}?gardenId=xxx` — Ver niños de su sala
  5. PUT `/api/attendance` — Tomar asistencia
  6. POST `/api/daily-entries` — Crear entrada del cuaderno
  7. POST `/api/announcements` — Crear comunicado
- **Endpoint(s):** Múltiples
- **Datos de entrada:** Ver tests individuales
- **Resultado esperado:** La docente puede operar dentro de sus salas asignadas.
- **Resultado de error esperado:** N/A

### [E2E-006] Flujo completo: Mensajería familia-jardín
- **Flujo:** E2E > Mensajería
- **Precondiciones:** Familia y admin/teacher configurados
- **Pasos:**
  1. Login como familia
  2. POST `/api/messages` — Enviar mensaje sobre su hijo
  3. GET `/api/messages/unread?gardenId=xxx` — Familia sin no leídos (envió ella)
  4. Login como admin
  5. GET `/api/messages/unread?gardenId=xxx` — Admin tiene 1 no leído
  6. GET `/api/messages/threads?gardenId=xxx` — Ver threads
  7. GET `/api/messages/thread/{threadId}?gardenId=xxx` — Leer mensajes (marca como leídos)
  8. POST `/api/messages` — Responder
  9. Login como familia
  10. GET `/api/messages/unread?gardenId=xxx` — Familia tiene 1 no leído
- **Endpoint(s):** Múltiples
- **Datos de entrada:** Ver tests individuales
- **Resultado esperado:** Mensajes van y vienen. Conteos de no leídos correctos.
- **Resultado de error esperado:** N/A

---

## 13. Validaciones y Edge Cases

### [EDGE-001] Acceso a datos de otro jardín (cross-garden)
- **Flujo:** Seguridad > Aislamiento
- **Precondiciones:** Dos jardines diferentes con usuarios distintos
- **Pasos:**
  1. Login como owner del jardín A
  2. GET `/api/classrooms?gardenId={gardenBId}` — Intentar ver salas del jardín B
  3. GET `/api/children?gardenId={gardenBId}` — Intentar ver niños del jardín B
  4. PUT `/api/attendance` con gardenId del jardín B
- **Endpoint(s):** Múltiples
- **Datos de entrada:** gardenId de otro jardín
- **Resultado esperado:** Status 403, `code: "GARDEN_ACCESS_DENIED"` en todos los casos
- **Resultado de error esperado:** N/A

### [EDGE-002] Familia accediendo a niño que no es suyo
- **Flujo:** Seguridad > Permisos familia
- **Precondiciones:** Familia con childrenIds = [childA], existe childB
- **Pasos:**
  1. GET `/api/children/{childBId}?gardenId=xxx` con token de familia
- **Endpoint(s):** `GET /api/children/:childId`
- **Datos de entrada:** childId que no pertenece a la familia
- **Resultado esperado:** Status 403, `code: "CHILD_ACCESS_DENIED"`
- **Resultado de error esperado:** N/A

### [EDGE-003] Request sin gardenId en rutas que lo requieren
- **Flujo:** Seguridad > Validación
- **Precondiciones:** Token válido
- **Pasos:**
  1. GET `/api/classrooms` sin gardenId
  2. GET `/api/children` sin gardenId
  3. PUT `/api/attendance` sin gardenId en body
- **Endpoint(s):** Múltiples
- **Datos de entrada:** Sin gardenId
- **Resultado esperado:** Status 400, `code: "GARDEN_ID_REQUIRED"`
- **Resultado de error esperado:** N/A

### [EDGE-004] Formato de fecha inválido
- **Flujo:** Validación > Fechas
- **Precondiciones:** Ninguna
- **Pasos:**
  1. GET `/api/attendance?gardenId=xxx&classroomId=yyy&date=14-02-2026` (formato incorrecto)
  2. POST `/api/daily-entries` con date: "14/02/2026"
- **Endpoint(s):** Múltiples
- **Datos de entrada:** Fechas con formato incorrecto (se espera YYYY-MM-DD)
- **Resultado esperado:** Error de validación de Mongoose o comportamiento inesperado. Verificar que se maneja correctamente.
- **Resultado de error esperado:** N/A

### [EDGE-005] Formato de período inválido (pagos)
- **Flujo:** Validación > Períodos
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/payments/create-monthly` con period "marzo-2026" (formato incorrecto, se espera YYYY-MM)
- **Endpoint(s):** `POST /api/payments/create-monthly`
- **Datos de entrada:** `{ "gardenId": "xxx", "period": "marzo-2026" }`
- **Resultado esperado:** Error de validación de Mongoose: "Período debe tener formato YYYY-MM"
- **Resultado de error esperado:** N/A

### [EDGE-006] ObjectId inválido en URL
- **Flujo:** Validación > IDs
- **Precondiciones:** Ninguna
- **Pasos:**
  1. GET `/api/children/id-invalido?gardenId=xxx`
  2. GET `/api/classrooms/no-es-un-id?gardenId=xxx`
- **Endpoint(s):** Múltiples
- **Datos de entrada:** IDs que no son ObjectId válidos
- **Resultado esperado:** Error 500 o error de cast de Mongoose. Verificar que no crashea el servidor.
- **Resultado de error esperado:** N/A

### [EDGE-007] Unicidad de asistencia por sala por día
- **Flujo:** Datos > Unicidad
- **Precondiciones:** Asistencia ya creada para sala+fecha
- **Pasos:**
  1. Intentar crear manualmente otro documento de asistencia para la misma sala y fecha
- **Endpoint(s):** N/A (modelo)
- **Datos de entrada:** N/A
- **Resultado esperado:** Índice unique `{ classroomId: 1, date: 1 }` rechaza el duplicado
- **Resultado de error esperado:** N/A

### [EDGE-008] Unicidad de entrada del cuaderno por niño por día
- **Flujo:** Datos > Unicidad
- **Precondiciones:** Entrada ya creada para childId+date
- **Pasos:**
  1. POST `/api/daily-entries` con mismo childId y date (debería actualizar, no duplicar)
- **Endpoint(s):** `POST /api/daily-entries`
- **Datos de entrada:** Mismo childId y date
- **Resultado esperado:** Se actualiza la entrada existente (el controller busca primero). Si se intenta crear directamente, índice unique `{ childId: 1, date: 1 }` previene duplicado con `code: "DUPLICATE_ENTRY"`.
- **Resultado de error esperado:** N/A

### [EDGE-009] Unicidad de pago por niño por período
- **Flujo:** Datos > Unicidad
- **Precondiciones:** Pago existente para childId+period
- **Pasos:**
  1. Intentar crear otro pago para mismo niño y período
- **Endpoint(s):** N/A
- **Datos de entrada:** N/A
- **Resultado esperado:** Índice unique `{ childId: 1, period: 1 }` rechaza duplicado
- **Resultado de error esperado:** N/A

### [EDGE-010] Contenido de mensaje excede maxLength (2000 chars)
- **Flujo:** Validación > Límites
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/messages` con content de 2500 caracteres
- **Endpoint(s):** `POST /api/messages`
- **Datos de entrada:** Content excesivamente largo
- **Resultado esperado:** Error de validación Mongoose (maxLength: 2000)
- **Resultado de error esperado:** N/A

### [EDGE-011] Título de comunicado excede maxLength (200 chars)
- **Flujo:** Validación > Límites
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/announcements` con title de 300 caracteres
- **Endpoint(s):** `POST /api/announcements`
- **Datos de entrada:** Title largo
- **Resultado esperado:** Error de validación Mongoose (maxLength: 200)
- **Resultado de error esperado:** N/A

### [EDGE-012] Health check del API
- **Flujo:** Infraestructura
- **Precondiciones:** Ninguna
- **Pasos:**
  1. GET `/api/health`
- **Endpoint(s):** `GET /api/health`
- **Datos de entrada:** Ninguno
- **Resultado esperado:** Status 200, `{ "status": "ok", "name": "Mi Nido API" }`
- **Resultado de error esperado:** N/A

### [EDGE-013] Soft delete: entidades eliminadas no aparecen en listados
- **Flujo:** Datos > Soft delete
- **Precondiciones:** Entidades con deletedAt seteado
- **Pasos:**
  1. Eliminar una sala (soft delete)
  2. GET `/api/classrooms?gardenId=xxx` — No debe aparecer
  3. Eliminar un niño (soft delete)
  4. GET `/api/children?gardenId=xxx` — No debe aparecer
  5. Eliminar un comunicado (soft delete)
  6. GET `/api/announcements?gardenId=xxx` — No debe aparecer
- **Endpoint(s):** Múltiples
- **Datos de entrada:** N/A
- **Resultado esperado:** Las entidades eliminadas (deletedAt != null) no aparecen en ningún listado
- **Resultado de error esperado:** N/A

### [EDGE-014] Múltiples contactos primarios de emergencia
- **Flujo:** Validación > Niños
- **Precondiciones:** Ninguna
- **Pasos:**
  1. POST `/api/children` con dos emergencyContacts ambos con isPrimary: true
- **Endpoint(s):** `POST /api/children`
- **Datos de entrada:** Dos contactos primarios
- **Resultado esperado:** Error de validación Mongoose: "Solo puede haber un contacto de emergencia primario"
- **Resultado de error esperado:** N/A

---

## 14. Integración Frontend-Backend

### [FE-001] Página de Login (`/login`)
- **Flujo:** Frontend > Login
- **Precondiciones:** Servidor corriendo
- **Pasos:**
  1. Abrir `/login`
  2. Ingresar email y password
  3. Hacer submit
  4. Verificar redirección a `/dashboard`
- **Endpoint(s) que llama:** `POST /api/auth/login`
- **Datos que envía:** `{ email, password }` (de los inputs del form)
- **Respuesta esperada:** Token y user guardados en localStorage. Redirección a `/dashboard`.
- **Verificar:**
  - El form tiene campos email y password
  - Botón de submit muestra loading durante la llamada
  - Error se muestra en la UI si credenciales incorrectas
  - Link a `/register` existe
  - Panel izquierdo decorativo visible en desktop

### [FE-002] Página de Registro (`/register`)
- **Flujo:** Frontend > Registro
- **Precondiciones:** Servidor corriendo
- **Pasos:**
  1. Abrir `/register`
  2. Paso 1: Completar datos personales (firstName, lastName, email, phone, dni, password, confirmPassword)
  3. Validación cliente: nombre requerido, email requerido, password >= 6 chars, passwords coinciden
  4. Paso 2: Completar datos del jardín (gardenName, dirección)
  5. Aceptar términos
  6. Submit
  7. Verificar redirección a `/dashboard`
- **Endpoint(s) que llama:** `POST /api/auth/register`
- **Datos que envía:** `{ email, password, firstName, lastName, phone, dni, gardenName, gardenAddress }`
- **Respuesta esperada:** Token y user guardados en localStorage. Redirección.
- **Verificar:**
  - Formulario en 2 pasos (step 1: datos personales, step 2: datos jardín)
  - Validaciones client-side en cada step
  - Error de servidor se muestra en la UI
  - Link a `/login` existe

### [FE-003] Página Home (`/`) 
- **Flujo:** Frontend > Home
- **Precondiciones:** Ninguna
- **Pasos:**
  1. Abrir `/`
- **Endpoint(s) que llama:** Ninguno
- **Datos que envía:** N/A
- **Respuesta esperada:** Redirect inmediato a `/login`

### [FE-004] Página Dashboard (`/dashboard`)
- **Flujo:** Frontend > Dashboard
- **Precondiciones:** Usuario autenticado
- **Pasos:**
  1. Abrir `/dashboard`
  2. Verificar que muestra datos del usuario
- **Endpoint(s) que llama:** Actualmente usa datos hardcodeados en el frontend (stats cards). No hace llamadas API dinámicas visibles en el código.
- **Datos que envía:** N/A
- **Respuesta esperada:** Saludo personalizado con firstName del usuario. Cards de stats (hardcodeadas por ahora). Secciones de asistencia y próximos eventos (mock data).
- **Verificar:**
  - ProtectedRoute redirige a `/login` si no autenticado
  - Saludo cambia según hora del día (buen día/buenas tardes/buenas noches)
  - Cards de estadísticas visibles
  - Links a otras secciones funcionan

### [FE-005] Página Salas (`/salas`)
- **Flujo:** Frontend > Salas
- **Precondiciones:** Usuario autenticado
- **Pasos:**
  1. Abrir `/salas`
  2. Ver listado de salas
  3. Crear nueva sala (botón + modal)
  4. Editar sala existente
  5. Eliminar sala
- **Endpoint(s) que llama:**
  - `GET /api/classrooms?gardenId=xxx` (listar)
  - `POST /api/classrooms` (crear)
  - `PUT /api/classrooms/:id` (editar)
  - `DELETE /api/classrooms/:id` (eliminar)
- **Datos que envía:** gardenId del primer jardín del usuario. Datos del form: name, emoji, color, ageRange, shift, capacity, fee.
- **Respuesta esperada:** Lista de salas con emoji, nombre, turno, capacidad, cuota. Modal de creación/edición con selección de emoji y color.
- **Verificar:**
  - Se obtiene gardenId del user.gardens[0].id
  - Token se envía en header Authorization
  - Modal de crear/editar muestra opciones de emoji y color
  - Confirmación antes de eliminar
  - Mensajes de éxito/error se muestran

### [FE-006] Página Niños (`/niños`)
- **Flujo:** Frontend > Niños
- **Precondiciones:** Usuario autenticado, salas creadas
- **Pasos:**
  1. Abrir `/niños`
  2. Ver listado de niños con filtros
  3. Crear nuevo niño (formulario completo)
  4. Editar niño
  5. Eliminar niño
- **Endpoint(s) que llama:**
  - `GET /api/children?gardenId=xxx` (listar)
  - `GET /api/classrooms?gardenId=xxx` (para selector de sala)
  - `POST /api/children` (crear)
  - `PUT /api/children/:id` (editar)
  - `DELETE /api/children/:id` (eliminar)
- **Datos que envía:** gardenId, datos completos del niño incluyendo medical, emergencyContacts, authorizedPickups
- **Respuesta esperada:** Lista de niños con foto, nombre, sala, turno. Formulario completo con secciones de datos personales, médicos, contactos.
- **Verificar:**
  - Filtro por sala y búsqueda por nombre
  - Formulario tiene todas las secciones requeridas
  - Validación de contactos de emergencia (mínimo 1)
  - Edad calculada correctamente desde birthDate

### [FE-007] Página Asistencia (`/asistencia`)
- **Flujo:** Frontend > Asistencia
- **Precondiciones:** Usuario autenticado, salas con niños
- **Pasos:**
  1. Abrir `/asistencia`
  2. Seleccionar sala
  3. Seleccionar fecha
  4. Ver lista de niños con estado
  5. Cambiar estado de asistencia de un niño
- **Endpoint(s) que llama:**
  - `GET /api/classrooms?gardenId=xxx` (obtener salas para selector)
  - `GET /api/attendance?gardenId=xxx&classroomId=yyy&date=YYYY-MM-DD` (obtener asistencia)
  - `PUT /api/attendance` (actualizar asistencia individual)
- **Datos que envía:** gardenId, classroomId, date, childId, status, etc.
- **Respuesta esperada:** Selector de sala y fecha. Lista de niños con botones para cambiar estado (presente/ausente/justificado/tarde). Resumen de totales.
- **Verificar:**
  - Al seleccionar sala y fecha, carga automáticamente
  - Botones de status cambian visualmente
  - Saving state muestra indicador
  - Resumen se actualiza al cambiar estados

### [FE-008] Página Cuaderno (`/cuaderno`)
- **Flujo:** Frontend > Cuaderno Digital
- **Precondiciones:** Usuario autenticado (teacher+), salas con niños
- **Pasos:**
  1. Abrir `/cuaderno`
  2. Seleccionar sala y fecha
  3. Ver entradas existentes
  4. Crear/editar entrada para un niño
- **Endpoint(s) que llama:**
  - `GET /api/classrooms?gardenId=xxx`
  - `GET /api/daily-entries?gardenId=xxx&classroomId=yyy&date=YYYY-MM-DD`
  - `POST /api/daily-entries` (crear)
  - `PUT /api/daily-entries` (actualizar)
- **Datos que envía:** childId, date, meals, nap, hygiene, activities, mood, observations, status
- **Respuesta esperada:** Formulario rico con secciones de alimentación, siesta, higiene, actividades, estado de ánimo.
- **Verificar:**
  - Selección de comidas con tipo y nivel de ingesta
  - Control de siesta con horarios
  - Contador de cambios de pañal
  - Selector de actividades por tipo
  - Selector de mood con emojis
  - Publicar/guardar como borrador

### [FE-009] Página Comunicados (`/comunicados`)
- **Flujo:** Frontend > Comunicados
- **Precondiciones:** Usuario autenticado
- **Pasos:**  1. Abrir `/comunicados`
  2. Ver listado de comunicados
  3. Crear comunicado
  4. Editar comunicado
  5. Eliminar comunicado
- **Endpoint(s) que llama:**
  - `GET /api/announcements?gardenId=xxx&status=published`
  - `GET /api/classrooms?gardenId=xxx` (para selector de salas)
  - `POST /api/announcements` (crear)
  - `PUT /api/announcements/:id` (editar)
  - `DELETE /api/announcements/:id` (eliminar)
- **Datos que envía:** gardenId, title, body, scope, classroomIds, requiresAck, status, pinned, urgent
- **Respuesta esperada:** Lista de comunicados con badges (urgente, fijado). Modal de creación con scope garden/classroom.
- **Verificar:**
  - Filtro por estado (all/published/draft)
  - Scope: si classroom, selector de salas aparece
  - Toggle de requiresAck, pinned, urgent
  - Preview del comunicado antes de publicar

### [FE-010] Página Pagos (`/pagos`)
- **Flujo:** Frontend > Pagos
- **Precondiciones:** Usuario autenticado, pagos creados
- **Pasos:**
  1. Abrir `/pagos`
  2. Ver listado de pagos con filtros
  3. Generar cuotas mensuales
  4. Registrar pago
- **Endpoint(s) que llama:**
  - `GET /api/payments?gardenId=xxx`
  - `GET /api/classrooms?gardenId=xxx`
  - `POST /api/payments/create-monthly` (generar cuotas)
  - `POST /api/payments/:id/record` (registrar pago)
  - `GET /api/payments/overdue?gardenId=xxx` (morosos)
- **Datos que envía:** gardenId, period, amount, method, reference, notes
- **Respuesta esperada:** Lista de pagos con status visual (pendiente/pagado/parcial/vencido). Botón generar cuotas. Botón registrar pago.
- **Verificar:**
  - Filtros por status, período, sala
  - Stats cards (total, pendientes, vencidos)
  - Modal de registrar pago con método de pago
  - Reporte de morosos accesible

### [FE-011] Página Familia (`/familia`)
- **Flujo:** Frontend > Vista Familia
- **Precondiciones:** Usuario family autenticado
- **Pasos:**
  1. Abrir `/familia`
  2. Ver feed del cuaderno de sus hijos
  3. Ver comunicados
  4. Ver pagos
- **Endpoint(s) que llama:**
  - `GET /api/daily-entries/feed?gardenId=xxx`
  - `GET /api/announcements?gardenId=xxx`
  - `GET /api/payments?gardenId=xxx`
  - `GET /api/children?gardenId=xxx` (sus hijos)
- **Datos que envía:** gardenId
- **Respuesta esperada:** Feed del cuaderno con entradas de sus hijos. Comunicados relevantes. Estado de pagos.
- **Verificar:**
  - Solo ve datos de sus propios hijos
  - Entradas del cuaderno con fotos, comidas, actividades
  - Comunicados filtrados por sus salas

### [FE-012] Página Más (`/mas`)
- **Flujo:** Frontend > Más opciones
- **Precondiciones:** Ninguna (no requiere datos dinámicos)
- **Pasos:**
  1. Abrir `/mas`
- **Endpoint(s) que llama:** Ninguno (página estática con links)
- **Datos que envía:** N/A
- **Respuesta esperada:** Grid de opciones: Salas, Nenes, Asistencia, Mensajes, Calendario, Ajustes. Sección de ayuda.
- **Verificar:**
  - Todos los links funcionan
  - Responsive: grid se adapta a 1/2/3 columnas

### [FE-013] ProtectedRoute redirige si no autenticado
- **Flujo:** Frontend > Protección de rutas
- **Precondiciones:** No autenticado (sin token en localStorage)
- **Pasos:**
  1. Abrir `/dashboard` sin estar logueado
  2. Abrir `/salas` sin estar logueado
  3. Abrir `/niños` sin estar logueado
- **Endpoint(s) que llama:** Ninguno
- **Datos que envía:** N/A
- **Respuesta esperada:** Redirect a `/login` en todos los casos. Muestra loading spinner mientras verifica autenticación.
- **Verificar:**
  - Loading spinner visible brevemente
  - Redirect limpio a `/login`
  - No flash de contenido protegido

### [FE-014] Logout desde frontend
- **Flujo:** Frontend > Logout
- **Precondiciones:** Usuario autenticado
- **Pasos:**
  1. Hacer click en logout (desde Header o menú)
  2. Verificar que se borra token y user de localStorage
  3. Verificar redirect a `/login`
- **Endpoint(s) que llama:** `POST /api/auth/logout` (opcional, no critical)
- **Datos que envía:** N/A
- **Respuesta esperada:** localStorage limpio. Redirect a login.
- **Verificar:**
  - localStorage.getItem('token') === null
  - localStorage.getItem('user') === null
  - No se puede volver a páginas protegidas con back button

### [FE-015] Navegación y Layout
- **Flujo:** Frontend > Navegación
- **Precondiciones:** Usuario autenticado
- **Pasos:**
  1. Verificar Header con logo y nombre de usuario
  2. Verificar Sidebar con links de navegación (desktop)
  3. Verificar MobileBottomNav (mobile)
  4. Navegar entre todas las páginas
- **Endpoint(s) que llama:** N/A
- **Datos que envía:** N/A
- **Respuesta esperada:** Navegación fluida. Sidebar visible en desktop. BottomNav visible en mobile.
- **Verificar:**
  - AppLayout envuelve todas las páginas protegidas
  - Sidebar highlights la página actual
  - Mobile bottom nav tiene iconos correctos

---

## 15. Responsive y UI

### [UI-001] Login responsive
- **Flujo:** UI > Login
- **Verificar en:** Mobile (375px), Tablet (768px), Desktop (1280px)
- **Qué verificar:**
  - Mobile: Panel izquierdo decorativo oculto. Form centrado.
  - Tablet: Form centrado con padding.
  - Desktop: Panel izquierdo visible (45% ancho) con animaciones floating. Form a la derecha.
  - Animaciones smooth (floating shapes, fade-in-up)
  - Inputs con labels legibles
  - Botón de submit ocupa ancho correcto

### [UI-002] Register responsive
- **Flujo:** UI > Register
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Steps indicator visible y legible
  - Campos del form se apilan en mobile
  - Botones Siguiente/Atrás accesibles
  - Campos de dirección del jardín legibles

### [UI-003] Dashboard responsive
- **Flujo:** UI > Dashboard
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Stats cards: 2 columnas en mobile, 4 en desktop
  - Secciones de asistencia y eventos: 1 columna mobile, 2 desktop
  - Saludo no se trunca en mobile
  - Cards con emojis y colores correctos

### [UI-004] Salas responsive
- **Flujo:** UI > Salas
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Cards de salas: 1 columna mobile, 2 tablet, 3 desktop
  - Modal de crear/editar: fullscreen en mobile, centrado en desktop
  - Selector de emoji y color usable en mobile
  - Botón de crear visible en todas las resoluciones

### [UI-005] Niños responsive
- **Flujo:** UI > Niños
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Lista de niños con fotos legibles
  - Filtros accesibles (búsqueda, selector de sala)
  - Formulario de creación con múltiples secciones scrollable
  - Secciones médicas legibles y editables
  - Array de contactos de emergencia manejable

### [UI-006] Asistencia responsive
- **Flujo:** UI > Asistencia
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Selectores de sala y fecha usables en mobile
  - Lista de niños con botones de estado touch-friendly
  - Botones de status (presente/ausente/etc.) suficientemente grandes para tap
  - Resumen visible sin scroll

### [UI-007] Cuaderno responsive
- **Flujo:** UI > Cuaderno
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Formulario de entrada con muchas secciones scrollable
  - Selector de comidas usable
  - Time pickers para siesta funcionales
  - Grilla de fotos adaptable
  - Selector de mood con emojis touch-friendly

### [UI-008] Comunicados responsive
- **Flujo:** UI > Comunicados
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Lista de comunicados legible
  - Badges (urgente, fijado) visibles
  - Modal de creación funcional
  - Toggle switches (requiresAck, pinned, urgent) usables
  - Textarea para body suficientemente grande

### [UI-009] Pagos responsive
- **Flujo:** UI > Pagos
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Stats cards legibles
  - Tabla/lista de pagos scrollable horizontalmente en mobile
  - Status badges con colores claros
  - Modal de registrar pago funcional
  - Montos formateados en ARS

### [UI-010] Familia responsive
- **Flujo:** UI > Familia
- **Verificar en:** Mobile, Tablet, Desktop
- **Qué verificar:**
  - Feed del cuaderno como timeline/cards
  - Fotos del cuaderno en galería adaptable
  - Comunicados legibles
  - Pagos con badges de status claros

### [UI-011] Navegación mobile
- **Flujo:** UI > Navegación
- **Verificar en:** Mobile (< 768px)
- **Qué verificar:**
  - Sidebar oculta
  - MobileBottomNav visible con iconos correctos
  - Tab activa highlighted
  - Safe area respetada (notch de iPhone)
  - No overlap con contenido

### [UI-012] Design system y consistencia visual
- **Flujo:** UI > Design System
- **Verificar en:** Todas las resoluciones
- **Qué verificar:**
  - Colores del design system usados correctamente (Rosa Nido, Amarillo Pollito, Verde Menta, Celeste Bebé, Lila Pastel)
  - Fuentes: display font para títulos, body font para texto
  - Cards con bordes redondeados y sombras consistentes
  - Botones con estados hover/active
  - Emoji usados consistentemente
  - Mensajes de éxito con ✅, de error con mensaje claro

---

## Resumen de Cobertura

| Módulo | Tests API | Tests Frontend | Tests E2E | Total |
|--------|-----------|----------------|-----------|-------|
| Autenticación | 19 | 3 | - | 22 |
| Jardines | 11 | - | - | 11 |
| Salas | 13 | 1 | - | 14 |
| Niños | 17 | 1 | - | 18 |
| Asistencia | 9 | 1 | - | 10 |
| Cuaderno Digital | 13 | 1 | - | 14 |
| Comunicados | 12 | 1 | - | 13 |
| Pagos | 12 | 1 | - | 13 |
| Mensajes | 9 | - | - | 9 |
| Calendario | 11 | - | - | 11 |
| Uploads | 10 | - | - | 10 |
| E2E | - | - | 6 | 6 |
| Edge Cases | 14 | - | - | 14 |
| UI/Responsive | - | 12 | - | 12 |
| Navegación | - | 3 | - | 3 |
| **TOTAL** | **150** | **24** | **6** | **180** |
