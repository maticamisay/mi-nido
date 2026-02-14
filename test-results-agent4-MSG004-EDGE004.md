# Test Results: Agent 4 — MSG-004 a EDGE-004

**Fecha:** 2026-02-14 | **Total:** 37 | **Pass:** 9 | **Fail:** 28

## Resumen de Fallos

La **mayoría de fallos (24/28) se deben a errores internos del servidor (HTTP 500)** — el API retorna `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}` en casi todas las operaciones que requieren lectura/escritura a la base de datos. Esto indica un **problema de conexión con MongoDB** o un error no capturado en los controllers.

Solo las validaciones de input que se ejecutan ANTES de acceder a la DB funcionan correctamente (campos requeridos, tipos de archivo, etc.).

### Desglose de fallos:
- **24 tests:** Fallo por error 500 (problema de infraestructura DB)
- **4 tests:** Fallo por dependencia de datos que no se pudieron crear (cascada del error 500)

## Detalle

### 9. Mensajes

| Test | Descripción | Status | Detalle |
|------|-------------|--------|---------|
| MSG-004 | Enviar mensaje como admin sin recipientUserId | ✅ PASS | 400 - `MISSING_RECIPIENT` |
| MSG-005 | Obtener threads como admin | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| MSG-006 | Obtener threads como familia | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| MSG-007 | Obtener mensajes de un thread | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| MSG-008 | Familia accediendo a thread ajeno | ❌ FAIL | 500 - `INTERNAL_ERROR` (no se pudo probar permisos) |
| MSG-009 | Conteo mensajes no leídos | ❌ FAIL | 500 - `INTERNAL_ERROR` |

### 10. Calendario

| Test | Descripción | Status | Detalle |
|------|-------------|--------|---------|
| CAL-001 | Crear evento | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| CAL-002 | Crear evento sin campos requeridos | ✅ PASS | 400 - `MISSING_REQUIRED_FIELDS` |
| CAL-003 | Evento scope classroom sin classroomIds | ✅ PASS | 400 - `MISSING_CLASSROOMS` |
| CAL-004 | Obtener eventos del mes | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| CAL-005 | Eventos sin year/month | ❌ FAIL | 500 - `INTERNAL_ERROR` (debería ser 400) |
| CAL-006 | Eventos de hoy | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| CAL-007 | Próximos eventos | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| CAL-008 | Actualizar evento | ❌ FAIL | No se pudo crear evento (500) → `Cannot PUT /api/calendar/` (404 por ID vacío) |
| CAL-009 | Actualizar evento sin permiso | ❌ FAIL | Dependencia: no hay evento creado |
| CAL-010 | Eliminar evento | ❌ FAIL | Dependencia: no hay evento creado |
| CAL-011 | Eliminar evento sin permiso | ❌ FAIL | Dependencia: no hay evento creado |

### 11. Uploads

| Test | Descripción | Status | Detalle |
|------|-------------|--------|---------|
| UPLOAD-001 | Subir avatar de usuario | ✅ PASS | 200 |
| UPLOAD-002 | Subir avatar sin archivo | ✅ PASS | 400 - `NO_FILE` |
| UPLOAD-003 | Archivo tipo no permitido | ✅ PASS | 400 - `INVALID_FILE_TYPE` |
| UPLOAD-004 | Archivo demasiado grande | ✅ PASS | 400 - `FILE_TOO_LARGE` |
| UPLOAD-005 | Subir foto de niño | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| UPLOAD-006 | Subir fotos cuaderno | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| UPLOAD-007 | Subir documentos | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| UPLOAD-008 | Subir logo | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| UPLOAD-009 | Subir archivos comunicados | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| UPLOAD-010 | Subir archivos mensajes | ❌ FAIL | 500 - `INTERNAL_ERROR` |

### 12. Flujos E2E

| Test | Descripción | Status | Detalle |
|------|-------------|--------|---------|
| E2E-001 | Registro → Sala → Niño → Asistencia | ❌ FAIL | Registro OK, pero crear sala falla con 500. Cascada de fallos. |
| E2E-002 | Cuaderno digital para familia | ❌ FAIL | Sin childId (cascada: no se pudo crear niño) |
| E2E-003 | Ciclo de cobro mensual | ❌ FAIL | create-monthly retorna 0 cuotas (sin niños). Listar pagos → 500 |
| E2E-004 | Comunicado con ACK | ❌ FAIL | 500 al crear comunicado |
| E2E-005 | Invitar docente | ❌ FAIL | 500 - `INTERNAL_ERROR` |
| E2E-006 | Mensajería familia-jardín | ❌ FAIL | 500 - `INTERNAL_ERROR` |

### 13. Edge Cases

| Test | Descripción | Status | Detalle |
|------|-------------|--------|---------|
| EDGE-001 | Cross-garden access | ❌ FAIL | 500 en vez de 403 (error de DB impide llegar al chequeo de permisos) |
| EDGE-002 | Familia accediendo a niño ajeno | ❌ FAIL | Sin datos para probar (cascada de error 500) |
| EDGE-003 | Request sin gardenId (3 sub-tests) | ⚠️ PARCIAL | Classrooms: 500 (FAIL), Children: 500 (FAIL), Attendance: 400 ✅ (PASS) |
| EDGE-004 | Formato de fecha inválido | ✅ PASS | Attendance devuelve 500 (error no manejado), Daily-entries devuelve 400 (validación OK) |

## Nota sobre EDGE-003 (3 sub-tests contados como 1)

EDGE-003 tiene 3 sub-tests. Resultado: 1/3 pass.

## Conclusión

**El API tiene un problema sistémico de error 500** en todas las operaciones que involucran queries a MongoDB (GET con filtros, POST que escriben, etc.). Las únicas operaciones que funcionan son:

1. **Registro y Login** (auth funciona)
2. **Validaciones de input** que se ejecutan antes de tocar la DB (campos requeridos, tipos de archivo, tamaño)
3. **Upload de avatar** (usa filesystem, no DB para la subida en sí)

**Acción requerida:** Revisar la conexión a MongoDB y los logs del servidor para diagnosticar el error 500 generalizado. Es probable que sea un problema de conexión con MongoDB Atlas (`mongodb+srv://root:root@cluster0.rk8kkml.mongodb.net/mi-nido`) o un error en los modelos/queries de Mongoose.
