# Test Results: Agent 2 — SALA-007 a DAILY-003

**Fecha:** 2026-02-14 | **Total:** 36 | **Pass:** 27 | **Fail:** 6 | **Skip:** 3

## Resumen de Fallos

| Test ID | Nombre | Error |
|---------|--------|-------|
| SALA-009 | Reducir capacidad por debajo de niños activos | Devolvió 200 OK en vez de 400 CAPACITY_TOO_LOW — no valida que capacity < niños activos |
| SALA-012 | Crear sala con docentes asignadas | Endpoint POST /gardens/:id/invite devuelve 500 INTERNAL_ERROR — no se pudo obtener teacherId |
| CHILD-010 | Obtener niño de otro jardín | Devolvió 403 GARDEN_ACCESS_DENIED en vez del esperado CHILD_ACCESS_DENIED — el middleware bloquea antes a nivel jardín |
| ATTEND-009 | Validación de formato de hora (arrivedAt) | Devolvió 500 INTERNAL_ERROR en vez de error de validación Mongoose — hora "25:00" no se valida correctamente |
| DAILY-003 | Crear entrada sin campos requeridos (sin date) | Código correcto (400 MISSING_REQUIRED_FIELDS) pero el mensaje dice "childId y date son requeridos" en ambos sub-tests — ✅ en realidad PASS |

## Tests Skipped

| Test ID | Nombre | Razón |
|---------|--------|-------|
| CHILD-006 | Crear niño como teacher (sin permiso) | No se pudo crear teacher (invite endpoint 500) |
| CHILD-008 | Listar niños como familia (solo sus hijos) | No hay usuario family disponible |
| CHILD-017 | Docente accediendo a sala no asignada | No se pudo crear teacher (invite endpoint 500) |

## Detalle

### SALA-007: Obtener sala inexistente
**Status:** ✅ PASS  
**HTTP:** 404  
**Response:** `{"error":"Sala no encontrada","code":"CLASSROOM_NOT_FOUND"}`

---

### SALA-008: Actualizar sala
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Sala \"Pollitos Grandes\" actualizada exitosamente ✅","classroom":{...}}`  
Nombre y capacity actualizados correctamente.

---

### SALA-009: Reducir capacidad por debajo de niños activos
**Status:** ❌ FAIL  
**HTTP:** 200 (esperado: 400)  
**Response:** `{"message":"Sala \"Pollitos Grandes\" actualizada exitosamente ✅","classroom":{...}}`  
**Problema:** Se envió `capacity: 0` con 1 niño activo en la sala. El backend aceptó la actualización sin validar. Falta la validación `CAPACITY_TOO_LOW` en el controller `updateClassroom`.

---

### SALA-010: Eliminar sala sin niños activos
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Sala \"TempDel\" eliminada exitosamente ✅"}`

---

### SALA-011: Eliminar sala con niños activos
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"No puedes eliminar la sala. Hay 1 niños activos.","code":"CLASSROOM_HAS_CHILDREN"}`

---

### SALA-012: Crear sala con docentes asignadas
**Status:** ❌ FAIL  
**HTTP:** 500 (invite endpoint failed)  
**Invite Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`  
**Problema:** El endpoint `POST /api/gardens/:gardenId/invite` devuelve 500. Probablemente un bug similar con Mongoose hooks o query params en el garden invite controller. Sin teacher ID, no se puede crear la sala con docentes.

---

### SALA-013: Crear sala con docente inválida
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"Alguna de las docentes no tiene acceso a este jardín","code":"INVALID_TEACHER"}`

---

### CHILD-001: Crear niño exitosamente
**Status:** ✅ PASS  
**HTTP:** 201  
**Response:** `{"message":"Niño Mateo López registrado exitosamente 🎉","child":{...}}`  
Incluye classroomId populado, medical info, emergencyContacts.

---

### CHILD-002: Crear niño sin campos requeridos
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"Campos requeridos: firstName, lastName, birthDate, gender, classroomId, shift","code":"MISSING_REQUIRED_FIELDS"}`

---

### CHILD-003: Crear niño sin contacto de emergencia
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"Debe incluir al menos un contacto de emergencia","code":"MISSING_EMERGENCY_CONTACT"}`

---

### CHILD-004: Crear niño en sala llena
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"La sala Sala Chica está completa (2 niños)","code":"CLASSROOM_FULL"}`

---

### CHILD-005: Crear niño en sala de otro jardín
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"Sala no válida","code":"INVALID_CLASSROOM"}`

---

### CHILD-006: Crear niño como teacher (sin permiso)
**Status:** ⏭️ SKIP  
**Razón:** No se pudo crear teacher — invite endpoint devuelve 500.

---

### CHILD-007: Listar niños del jardín
**Status:** ✅ PASS  
**HTTP:** 200  
- Lista general: 4 niños
- Filtro por classroom: funciona correctamente (2 niños en CID1)
- Búsqueda por "Vale": funciona (1 resultado)

---

### CHILD-008: Listar niños como familia (solo sus hijos)
**Status:** ⏭️ SKIP  
**Razón:** No hay usuario family disponible.

---

### CHILD-009: Obtener niño específico
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** Objeto `child` completo con classroom y garden populados.

---

### CHILD-010: Obtener niño de otro jardín
**Status:** ❌ FAIL  
**HTTP:** 403 (código correcto)  
**Response:** `{"error":"No tienes acceso a este jardín","code":"GARDEN_ACCESS_DENIED"}`  
**Problema:** Se esperaba `code: "CHILD_ACCESS_DENIED"` pero el middleware `requireGardenAccess` intercepta antes y devuelve `GARDEN_ACCESS_DENIED`. El test usó un gardenId falso (000...0) por lo que la verificación a nivel jardín bloquea primero. **Nota:** Esto puede considerarse funcionalmente correcto (el acceso es denegado) aunque el código de error no coincide exactamente con el esperado.

---

### CHILD-011: Obtener expediente completo del niño
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** Objeto con `child` completo y `stats` (recentDailyEntries, recentAttendanceDays, pendingPayments).

---

### CHILD-012: Actualizar niño
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Datos de Valentina actualizados correctamente ✅","child":{...}}`  
Nickname actualizado a "Valentinita", alergias actualizadas a ["Maní","Leche"].

---

### CHILD-013: Cambiar niño de sala
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Datos de Mateo actualizados correctamente ✅","child":{...}}`  
Niño movido de CID1 a CID3 exitosamente.

---

### CHILD-014: Cambiar niño a sala llena
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"La sala Sala Chica está completa","code":"CLASSROOM_FULL"}`

---

### CHILD-015: Eliminar niño (soft delete)
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Para Borrar eliminado del sistema ✅"}`

---

### CHILD-016: Obtener niños de una sala específica (endpoint docente)
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** Objeto con `classroom` (id, name, emoji) y `children` array.

---

### CHILD-017: Docente accediendo a sala no asignada
**Status:** ⏭️ SKIP  
**Razón:** No se pudo crear teacher — invite endpoint devuelve 500.

---

### ATTEND-001: Obtener asistencia de sala por fecha (auto-crea)
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** Asistencia creada automáticamente con niños activos en status "absent". Incluye records populados con childId y summary.

---

### ATTEND-002: Actualizar asistencia de un niño (present)
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Asistencia de Valentina actualizada ✅","attendance":{...}}`  
Status cambiado a "present" con arrivedAt "08:30" y notes.

---

### ATTEND-003: Actualizar asistencia con justificación
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Asistencia de Valentina actualizada ✅","attendance":{...}}`  
Status cambiado a "justified" con justificación.

---

### ATTEND-004: Actualizar asistencia sin campos requeridos
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"classroomId, date, childId y status son requeridos","code":"MISSING_REQUIRED_FIELDS"}`

---

### ATTEND-005: Actualizar asistencia de niño que no pertenece a la sala
**Status:** ✅ PASS  
**HTTP:** 400  
**Response:** `{"error":"Niño no válido para esta sala","code":"INVALID_CHILD"}`

---

### ATTEND-006: Obtener asistencia por rango de fechas
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** Array `attendance` con registros del rango, records populados.

---

### ATTEND-007: Obtener reporte de asistencia de un niño
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** Objeto `report` con child info, period, attendance array y summary (totalDays, attendanceRate, etc.).

---

### ATTEND-008: Obtener resumen de asistencia del jardín
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** Incluye `date`, `gardenSummary` (totalChildren:4, present:0, absent:3, justified:1), y `classrooms` array con detalle por sala.

---

### ATTEND-009: Validación de formato de hora (arrivedAt/leftAt)
**Status:** ❌ FAIL  
**HTTP:** 500 (esperado: error de validación)  
**Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}`  
**Problema:** Enviar `arrivedAt: "25:00"` causa un error no manejado (probablemente Mongoose validator crash). Debería devolver un error de validación legible como "Hora de llegada debe tener formato HH:MM".

---

### DAILY-001: Crear entrada del cuaderno digital
**Status:** ✅ PASS  
**HTTP:** 201  
**Response:** `{"message":"Cuaderno de Valentina creado ✅","entry":{...}}`  
Entrada completa con meals, nap, hygiene, activities, mood, observations. Status "published".

---

### DAILY-002: Actualizar entrada existente (misma fecha y niño)
**Status:** ✅ PASS  
**HTTP:** 200  
**Response:** `{"message":"Cuaderno de Valentina actualizado ✅","entry":{...}}`  
Mood actualizado a "tranquilo", observations actualizada. Campos previos (meals, nap, etc.) se mantienen.

---

### DAILY-003: Crear entrada sin campos requeridos
**Status:** ✅ PASS  
**HTTP:** 400  
**Response (sin childId):** `{"error":"childId y date son requeridos","code":"MISSING_REQUIRED_FIELDS"}`  
**Response (sin date):** `{"error":"childId y date son requeridos","code":"MISSING_REQUIRED_FIELDS"}`

---

## Bugs Encontrados Durante Testing

1. **`express-mongo-sanitize` incompatible con Express 5** — `req.query` es read-only en Express 5. Reemplazado con middleware custom. (Corregido durante tests)
2. **Mongoose pre hooks usando `next()` callback** — Mongoose 7+ no pasa `next` a pre hooks. Reemplazados con `throw`. (Corregido durante tests)
3. **`req.query` undefined sin query parser** — Express 5 necesita `app.set('query parser', 'simple')`. (Corregido durante tests)
4. **Endpoint `/gardens/:id/invite` devuelve 500** — Bug pendiente de investigar.
5. **Validación CAPACITY_TOO_LOW falta** — `updateClassroom` no verifica que la nueva capacidad sea >= niños activos.
6. **Validación de formato hora (HH:MM)** — `arrivedAt: "25:00"` causa 500 en vez de error de validación.
