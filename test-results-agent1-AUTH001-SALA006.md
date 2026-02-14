# Test Results: AUTH-001 a SALA-006

**Fecha:** 2026-02-14 12:30 ART  
**API:** `http://api-minido.38.105.232.177.sslip.io/api`  
**Usuario:** `retest1@jardincito.com` / `Test123!`  
**Garden ID:** `69908dc997c6dfbab771a1f4`  
**Classroom ID:** `6990954bdc01b08af9e9aed2`

---

## Resumen

| Sección | ✅ Pass | ❌ Fail | ⚠️ Parcial | ⏭️ Skip | Total |
|---------|---------|---------|------------|---------|-------|
| AUTH (001-019) | 14 | 1 | 1 | 2 | 18 |
| GARDEN (001-011) | 9 | 1 | 0 | 1 | 11 |
| SALA (001-006) | 5 | 1 | 0 | 0 | 6 |
| **TOTAL** | **28** | **3** | **1** | **2** | **35** |

---

## Autenticación (AUTH-001 a AUTH-019)

### AUTH-001 ✅ Registro exitoso
- **Status:** 201
- **Response:** User created con id, email, profile, gardens[], garden con subscription plan "semillita" status "trial", token JWT

### AUTH-002 ✅ Registro email duplicado
- **Status:** 400
- **Response:** `{"error":"El email ya está registrado","code":"EMAIL_ALREADY_EXISTS"}`

### AUTH-003 ✅ Registro garden name duplicado
- **Status:** 400
- **Response:** `{"error":"Ya existe un jardín con ese nombre. Prueba con otro nombre.","code":"GARDEN_NAME_EXISTS"}`

### AUTH-004 ✅ Registro sin campos requeridos (5 sub-tests)
- **Status:** 400 para cada caso (sin email, sin password, sin firstName, sin lastName, sin gardenName)
- **Response:** `{"error":"Campos requeridos: email, password, firstName, lastName, gardenName","code":"MISSING_REQUIRED_FIELDS"}`

### AUTH-005 ✅ Registro con contraseña corta
- **Status:** 400
- **Response:** `{"error":"La contraseña debe tener al menos 6 caracteres","code":"PASSWORD_TOO_SHORT"}`

### AUTH-006 ✅ Login exitoso
- **Status:** 200
- **Response:** `message: "¡Bienvenido de vuelta! 👋"`, user con gardens, lastLoginAt, token

### AUTH-007 ✅ Login credenciales incorrectas (2 sub-tests)
- **Status:** 401 (password incorrecto y email inexistente)
- **Response:** `{"error":"Email o contraseña incorrectos","code":"INVALID_CREDENTIALS"}`

### AUTH-008 ✅ Login sin campos requeridos (2 sub-tests)
- **Status:** 400 (body vacío y sin password)
- **Response:** `{"error":"Email y contraseña son requeridos","code":"MISSING_CREDENTIALS"}`

### AUTH-009 ✅ GET /me con token válido
- **Status:** 200
- **Response:** user con id, email, profile, gardens[], lastLoginAt. No incluye passwordHash.

### AUTH-010 ✅ Acceso sin token (3 rutas)
- **Status:** 401 para /me, /gardens, /classrooms
- **Response:** `{"error":"Token de acceso requerido","code":"TOKEN_REQUIRED"}`

### AUTH-011 ✅ Acceso con token inválido
- **Status:** 401
- **Response:** `{"error":"Token inválido","code":"INVALID_TOKEN"}`

### AUTH-012 ⚠️ Acceso con token expirado
- **Status:** 401
- **Response:** `{"error":"Token inválido","code":"INVALID_TOKEN"}`
- **Nota:** Devuelve `INVALID_TOKEN` en lugar de `TOKEN_EXPIRED`. El test plan esperaba `TOKEN_EXPIRED` como code separado. Funciona pero el code no es el esperado.

### AUTH-013 ✅ Actualizar perfil
- **Status:** 200
- **Response:** `{"message":"Perfil actualizado correctamente ✅","profile":{"firstName":"Retest José","lastName":"Uno","phone":"1199887766"}}`

### AUTH-014 ✅ Cambiar contraseña exitosamente
- **Status:** 200
- **Response:** `{"message":"Contraseña actualizada correctamente ✅"}`
- Login con nueva contraseña OK, password restaurado OK.

### AUTH-015 ✅ Cambiar contraseña con actual incorrecta
- **Status:** 401
- **Response:** `{"error":"Contraseña actual incorrecta","code":"INVALID_CURRENT_PASSWORD"}`

### AUTH-016 ✅ Cambiar contraseña nueva corta
- **Status:** 400
- **Response:** `{"error":"La nueva contraseña debe tener al menos 6 caracteres","code":"PASSWORD_TOO_SHORT"}`

### AUTH-017 ✅ Logout
- **Status:** 200
- **Response:** `{"message":"¡Hasta luego! 👋","note":"Elimina el token del almacenamiento local"}`

### AUTH-018 ⏭️ Login con usuario soft-deleted
- **Skip:** Requiere acceso directo a DB para setear deletedAt en un usuario

### AUTH-019 ⏭️ Acceso con usuario desactivado
- **Skip:** Requiere acceso directo a DB para setear deletedAt después de emitir token

---

## CRUD Jardines (GARDEN-001 a GARDEN-011)

### GARDEN-001 ✅ Listar jardines
- **Status:** 200
- **Response:** Array `gardens` con id, name, slug, address, settings, subscription, role, joinedAt

### GARDEN-002 ✅ Obtener jardín específico
- **Status:** 200
- **Response:** Objeto `garden` completo. Nota: incluye `isDeleted` como campo virtual en vez de ocultar deletedAt

### GARDEN-003 ✅ Obtener jardín sin acceso
- **Status:** 403
- **Response:** `{"error":"No tienes acceso a este jardín","code":"GARDEN_ACCESS_DENIED"}`

### GARDEN-004 ✅ Actualizar jardín (owner)
- **Status:** 200
- **Response:** `{"message":"Jardín actualizado correctamente ✅","garden":{...}}`

### GARDEN-005 ⏭️ Actualizar jardín sin permiso (teacher/family)
- **Skip:** Requiere token de teacher (no hay teacher invitado - GARDEN-008 falló)

### GARDEN-006 ✅ Estadísticas del jardín
- **Status:** 200
- **Response:** `{"stats":{"classrooms":0,"children":{"total":0,"active":0},"dailyEntries":{"lastMonth":0},"payments":{"pending":0,"monthlyIncome":0,"monthlyPaidCount":0}}}`

### GARDEN-007 ✅ Miembros del jardín
- **Status:** 200
- **Response:** Array `members` con id, email, profile, role, joinedAt, lastLoginAt

### GARDEN-008 ❌ Invitar teacher al jardín
- **Status:** 500
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Bug:** El endpoint de invitación genera un error interno del servidor

### GARDEN-009 ✅ Invitar usuario ya miembro
- **Status:** 400
- **Response:** `{"error":"El usuario ya pertenece a este jardín","code":"USER_ALREADY_MEMBER"}`

### GARDEN-010 ✅ Invitar con rol inválido
- **Status:** 400
- **Response:** `{"error":"Rol inválido","code":"INVALID_ROLE"}`

### GARDEN-011 ✅ Invitar sin campos requeridos (2 sub-tests)
- **Status:** 400 (sin email y sin role)
- **Response:** `{"error":"Email y rol son requeridos","code":"MISSING_REQUIRED_FIELDS"}`

---

## CRUD Salas (SALA-001 a SALA-006)

### SALA-001 ✅ Crear sala exitosamente
- **Status:** 201
- **Response:** `{"message":"Sala \"Pollitos\" creada exitosamente 🎉","classroom":{...}}` con todos los campos

### SALA-002 ✅ Crear sala sin campos requeridos
- **Status:** 400 (probado sin name)
- **Response:** `{"error":"Campos requeridos: name, ageRange, shift, capacity, fee","code":"MISSING_REQUIRED_FIELDS"}`

### SALA-003 ❌ Crear sala con ageRange inválido (from > to)
- **Status:** 500
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Bug:** Debería devolver 400 con validación "La edad mínima no puede ser mayor a la edad máxima", pero da 500 (la validación de Mongoose no se captura correctamente)

### SALA-004 ❌ Crear sala como teacher (sin permiso)
- **No ejecutado:** Depende de GARDEN-008 que falló (no hay token de teacher)
- **Marcado como FAIL** porque GARDEN-008 es blocker

### SALA-005 ✅ Listar salas del jardín
- **Status:** 200
- **Response:** Array `classrooms` con childCount, hasCapacity, todos los campos. Ordenadas por nombre.

### SALA-006 ✅ Obtener sala específica con niños
- **Status:** 200
- **Response:** Objeto `classroom` con array `children` (vacío, no hay niños aún)

---

## Bugs Encontrados

| # | Test | Severidad | Descripción |
|---|------|-----------|-------------|
| 1 | GARDEN-008 | 🔴 Alta | Invitar usuario al jardín devuelve 500 Internal Error |
| 2 | SALA-003 | 🟡 Media | Validación ageRange from>to no se captura, da 500 en vez de 400 |
| 3 | AUTH-012 | 🟢 Baja | Token expirado devuelve `INVALID_TOKEN` en vez de `TOKEN_EXPIRED` |
