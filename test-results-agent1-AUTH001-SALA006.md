# Test Results: Agent 1 — AUTH-001 a SALA-006

**Fecha:** 2026-02-14 11:48 ART
**Tester:** Agent 1
**API:** http://api-minido.38.105.232.177.sslip.io/api
**Total:** 36 tests
**Pass:** 0 | **Fail:** 36

## ⚠️ Nota Crítica

**TODOS los endpoints del API devuelven `500 Internal Server Error`** con el mismo body:
```json
{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}
```

Esto incluye rutas de auth, gardens, classrooms — **toda la API está caída**. La causa más probable es una falla en la conexión a MongoDB. El servidor Express responde (headers `X-Powered-By: Express`) pero el error handler global atrapa todas las excepciones.

**Recomendación:** Revisar logs del backend en Coolify y verificar la conexión a la base de datos antes de re-ejecutar los tests.

## Resumen de Fallos

| Test ID | Nombre | Error |
|---------|--------|-------|
| AUTH-001 | Registro exitoso | 500 INTERNAL_ERROR |
| AUTH-002 | Registro con email duplicado | 500 INTERNAL_ERROR |
| AUTH-003 | Registro con nombre de jardín duplicado | 500 INTERNAL_ERROR |
| AUTH-004 | Registro sin campos requeridos | 500 INTERNAL_ERROR (×5 sub-tests) |
| AUTH-005 | Registro con contraseña corta | 500 INTERNAL_ERROR |
| AUTH-006 | Login exitoso | 500 INTERNAL_ERROR |
| AUTH-007 | Login con credenciales incorrectas | 500 INTERNAL_ERROR (×2) |
| AUTH-008 | Login sin campos requeridos | 500 INTERNAL_ERROR (×2) |
| AUTH-009 | Obtener usuario actual (GET /me) | 500 INTERNAL_ERROR |
| AUTH-010 | Acceso sin token | 500 INTERNAL_ERROR (×3, esperaba 401) |
| AUTH-011 | Acceso con token inválido | 500 INTERNAL_ERROR (esperaba 401) |
| AUTH-012 | Acceso con token expirado | 500 INTERNAL_ERROR (esperaba 401) |
| AUTH-013 | Actualizar perfil | 500 INTERNAL_ERROR |
| AUTH-014 | Cambiar contraseña exitosamente | 500 INTERNAL_ERROR |
| AUTH-015 | Cambiar contraseña con contraseña incorrecta | 500 INTERNAL_ERROR |
| AUTH-016 | Cambiar contraseña con nueva corta | 500 INTERNAL_ERROR |
| AUTH-017 | Logout | 500 INTERNAL_ERROR |
| AUTH-018 | Login con usuario soft-deleted | SKIP — API caída |
| AUTH-019 | Acceso con usuario desactivado | SKIP — API caída |
| GARDEN-001 | Obtener jardines del usuario | 500 INTERNAL_ERROR |
| GARDEN-002 | Obtener jardín específico | 500 INTERNAL_ERROR |
| GARDEN-003 | Obtener jardín sin acceso | 500 INTERNAL_ERROR |
| GARDEN-004 | Actualizar jardín (owner) | 500 INTERNAL_ERROR |
| GARDEN-005 | Actualizar jardín sin permiso | SKIP — necesita token de teacher |
| GARDEN-006 | Obtener estadísticas del jardín | 500 INTERNAL_ERROR |
| GARDEN-007 | Obtener miembros del jardín | 500 INTERNAL_ERROR |
| GARDEN-008 | Invitar usuario al jardín | 500 INTERNAL_ERROR |
| GARDEN-009 | Invitar usuario ya miembro | 500 INTERNAL_ERROR |
| GARDEN-010 | Invitar con rol inválido | 500 INTERNAL_ERROR |
| GARDEN-011 | Invitar sin campos requeridos | 500 INTERNAL_ERROR |
| SALA-001 | Crear sala exitosamente | 500 INTERNAL_ERROR |
| SALA-002 | Crear sala sin campos requeridos | 500 INTERNAL_ERROR |
| SALA-003 | Crear sala con ageRange inválido | 500 INTERNAL_ERROR |
| SALA-004 | Crear sala como teacher | SKIP — necesita token de teacher |
| SALA-005 | Listar salas del jardín | 500 INTERNAL_ERROR |
| SALA-006 | Obtener sala específica con niños | 500 INTERNAL_ERROR |

## Detalle

### AUTH-001 — Registro exitoso de nuevo usuario con jardín
- **Status:** ❌ FAIL
- **HTTP Status:** 500
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Esperado:** 201 con user, garden, token
- **Notas:** API completamente caída. El error ocurre antes de cualquier lógica de negocio.

### AUTH-002 — Registro con email duplicado
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Notas:** No se puede evaluar — la API falla antes de validar duplicados.

### AUTH-003 — Registro con nombre de jardín duplicado (slug)
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### AUTH-004 — Registro sin campos requeridos
- **Status:** ❌ FAIL
- **HTTP Status:** 500 en los 5 sub-tests (esperado: 400)
- **Response:** Mismo error en todos: `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Sub-tests:** sin email, sin password, sin firstName, sin lastName, sin gardenName — todos 500
- **Notas:** La validación de campos debería ejecutarse ANTES de tocar la DB. Esto sugiere que el middleware de error se ejecuta por conexión a DB fallida en algún middleware previo (ej: session/auth middleware que toca DB).

### AUTH-005 — Registro con contraseña corta
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### AUTH-006 — Login exitoso
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### AUTH-007 — Login con credenciales incorrectas
- **Status:** ❌ FAIL
- **HTTP Status:** 500 en ambos sub-tests (esperado: 401)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Sub-tests:** password incorrecto y email inexistente — ambos 500

### AUTH-008 — Login sin campos requeridos
- **Status:** ❌ FAIL
- **HTTP Status:** 500 en ambos sub-tests (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Sub-tests:** body vacío `{}` y sin password — ambos 500

### AUTH-009 — Obtener usuario actual (GET /me)
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Notas:** No se pudo obtener token real de AUTH-001, se usó placeholder.

### AUTH-010 — Acceso sin token (rutas protegidas)
- **Status:** ❌ FAIL
- **HTTP Status:** 500 en los 3 sub-tests (esperado: 401 TOKEN_REQUIRED)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Sub-tests:** GET /auth/me, GET /gardens, GET /classrooms — todos 500
- **Notas:** Esto es particularmente grave: el middleware de auth debería devolver 401 ANTES de tocar la DB.

### AUTH-011 — Acceso con token inválido
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 401 INVALID_TOKEN)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### AUTH-012 — Acceso con token expirado
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 401 TOKEN_EXPIRED)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Notas:** Se usó un JWT expirado crafteado. El error sugiere que incluso la verificación de JWT falla, posiblemente porque el middleware intenta acceder a la DB.

### AUTH-013 — Actualizar perfil
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Notas:** SKIP parcial — depende de AUTH-001 para token válido.

### AUTH-014 — Cambiar contraseña exitosamente
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Notas:** SKIP parcial — depende de AUTH-001.

### AUTH-015 — Cambiar contraseña con contraseña actual incorrecta
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 401)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### AUTH-016 — Cambiar contraseña con nueva contraseña corta
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### AUTH-017 — Logout
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
- **Notas:** Este endpoint debería ser trivial (solo devolver mensaje). Si falla con 500, confirma que algo global está roto (DB connection o middleware).

### AUTH-018 — Login con usuario soft-deleted
- **Status:** ❌ FAIL (SKIP)
- **Notas:** No se puede testear — requiere un usuario con deletedAt seteado en DB, y la API está caída.

### AUTH-019 — Acceso con usuario desactivado
- **Status:** ❌ FAIL (SKIP)
- **Notas:** No se puede testear — requiere manipulación de DB.

### GARDEN-001 — Obtener jardines del usuario autenticado
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-002 — Obtener jardín específico
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-003 — Obtener jardín sin acceso
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 403)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-004 — Actualizar jardín (owner)
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-005 — Actualizar jardín sin permiso (teacher/family)
- **Status:** ❌ FAIL (SKIP)
- **Notas:** Depende de AUTH-001 y GARDEN-008 para obtener token de teacher. API caída.

### GARDEN-006 — Obtener estadísticas del jardín
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-007 — Obtener miembros del jardín
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-008 — Invitar usuario al jardín (teacher)
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-009 — Invitar usuario ya miembro
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-010 — Invitar con rol inválido
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### GARDEN-011 — Invitar sin campos requeridos
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### SALA-001 — Crear sala exitosamente
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 201)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### SALA-002 — Crear sala sin campos requeridos
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### SALA-003 — Crear sala con ageRange inválido
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 400)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### SALA-004 — Crear sala como teacher (sin permiso)
- **Status:** ❌ FAIL (SKIP)
- **Notas:** Depende de token de teacher (GARDEN-008 falló). API caída.

### SALA-005 — Listar salas del jardín
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`

### SALA-006 — Obtener sala específica con niños
- **Status:** ❌ FAIL
- **HTTP Status:** 500 (esperado: 200)
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`
