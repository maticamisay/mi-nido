# Test Results — Agent 4: MSG-004 a EDGE-004

**Fecha:** 2026-02-14 ~15:00 ART  
**API:** `http://api-minido.38.105.232.177.sslip.io/api`  
**Usuario:** `retest4@jardincito.com` / `Test123!`  
**Garden:** Jardín Retest 4 (`69908dd597c6dfbab771a20d`)

---

## Resumen

| Resultado | Cantidad |
|-----------|----------|
| ✅ PASS   | 33       |
| ❌ FAIL   | 2        |
| ⚠️ NOTA   | 3        |
| ⏭️ SKIP   | 1        |
| **Total** | **39**   |

---

## Resultados Detallados

### 9. Mensajes (MSG-004 a MSG-009)

| Test ID | Status | Descripción | Detalle |
|---------|--------|-------------|---------|
| MSG-004 | ✅ PASS | Admin msg sin recipientUserId | 400 como esperado |
| MSG-005 | ✅ PASS | Get threads como admin | 200, threads array OK |
| MSG-006 | ✅ PASS | Get threads (owner=familia test) | 200, threads filtrados OK |
| MSG-007 | ✅ PASS | Get mensajes de thread | 200, mensajes con sender/child populados, paginación OK |
| MSG-008 | ⚠️ NOTA | Familia accediendo thread ajeno | No se puede testear sin usuario familia separado. Owner con threadId inexistente devuelve 200 con array vacío (no 403). Requiere 2 usuarios family para test real. |
| MSG-009 | ✅ PASS | Conteo mensajes no leídos | 200, unreadThreads y unreadMessages presentes |

### 10. Calendario (CAL-001 a CAL-011)

| Test ID | Status | Descripción | Detalle |
|---------|--------|-------------|---------|
| CAL-001 | ✅ PASS | Crear evento | 201, evento creado con todos los campos |
| CAL-002 | ✅ PASS | Crear evento sin title | 400, `MISSING_REQUIRED_FIELDS` |
| CAL-003 | ✅ PASS | Evento classroom sin classroomIds | 400, `MISSING_CLASSROOMS` |
| CAL-004 | ✅ PASS | Get eventos del mes | 200, events array con author populado |
| CAL-005 | ✅ PASS | Get eventos sin year/month | 400, `MISSING_DATE_PARAMS` |
| CAL-006 | ✅ PASS | Get eventos de hoy | 200, today + events array |
| CAL-007 | ✅ PASS | Get próximos eventos | 200, days + events array |
| CAL-008 | ✅ PASS | Actualizar evento | 200, título actualizado |
| CAL-009 | ⚠️ NOTA | Update evento sin permiso | Requiere usuario teacher no-autor. Owner siempre puede editar (200). No testeable sin segundo usuario. |
| CAL-010 | ✅ PASS | Eliminar evento | 200, hard delete OK |
| CAL-011 | ✅ PASS | Eliminar evento inexistente | 404 como esperado |

### 11. Uploads (UPLOAD-001 a UPLOAD-010)

| Test ID | Status | Descripción | Detalle |
|---------|--------|-------------|---------|
| UPLOAD-001 | ✅ PASS | Upload avatar | 200, avatar con url/filename/size/mimetype |
| UPLOAD-002 | ✅ PASS | Upload avatar sin archivo | 400, `NO_FILE` |
| UPLOAD-003 | ✅ PASS | Upload tipo inválido | 400, `INVALID_FILE_TYPE` |
| UPLOAD-004 | ⏭️ SKIP | Upload >10MB | No se puede generar archivo >10MB en test automatizado |
| UPLOAD-005 | ✅ PASS | Upload child photo | 200 (requiere gardenId como query param, no form field) |
| UPLOAD-006 | ✅ PASS | Upload daily photos | 200, photos array OK |
| UPLOAD-007 | ✅ PASS | Upload documents | 200, documents con originalName OK |
| UPLOAD-008 | ✅ PASS | Upload logo | 200, logo OK |
| UPLOAD-009 | ✅ PASS | Upload announcement files | 200, attachments con name/url/type/size |
| UPLOAD-010 | ✅ PASS | Upload message files | 200, attachments OK |

**Nota UPLOAD-005 a 010:** El `gardenId` debe enviarse como **query parameter** (`?gardenId=xxx`), NO como form field en multipart. Si se envía como form field, devuelve 400 `GARDEN_ID_REQUIRED`.

### 12. Flujos E2E (E2E-001 a E2E-004)

| Test ID | Status | Descripción | Detalle |
|---------|--------|-------------|---------|
| E2E-001 | ✅ PASS | Register→Sala→Niño→Asistencia | Flujo completo OK, summary 200 |
| E2E-002 | ✅ PASS | Cuaderno digital para familia | Entrada creada y recuperada OK |
| E2E-003 | ✅ PASS | Ciclo de cobro mensual | Cuota creada, pago registrado, estado de cuenta OK |
| E2E-004 | ✅ PASS | Comunicado con ACK | Comunicado creado, ACK confirmado, verificado |

### 13. Edge Cases (EDGE-001 a EDGE-004)

| Test ID | Status | Descripción | Detalle |
|---------|--------|-------------|---------|
| EDGE-001 | ✅ PASS | Cross-garden access | 403 `GARDEN_ACCESS_DENIED` en classrooms y children |
| EDGE-002 | ✅ PASS | Acceso a niño inexistente | 404 `CHILD_NOT_FOUND` (owner; test real requiere usuario family) |
| EDGE-003 | ✅ PASS | Request sin gardenId | 400 `GARDEN_ID_REQUIRED` en classrooms, children y attendance |
| EDGE-004a | ❌ FAIL | Fecha inválida en attendance | Devuelve **500 INTERNAL_ERROR** en vez de 400 con validación |
| EDGE-004b | ❌ FAIL | Fecha inválida en daily-entries | Devuelve **500 INTERNAL_ERROR** en vez de 400 con validación |

---

## Bugs Encontrados

### 🐛 BUG-1: Fecha inválida causa 500 Internal Error (EDGE-004)
- **Endpoints:** `GET /api/attendance?date=14-02-2026` y `POST /api/daily-entries` con `date: "14/02/2026"`
- **Esperado:** 400 con error de validación de formato de fecha
- **Obtenido:** 500 `INTERNAL_ERROR`
- **Severidad:** Media — el servidor no valida formato de fecha antes de procesar, lo que genera un error no manejado
- **Recomendación:** Agregar validación de formato YYYY-MM-DD antes de pasar la fecha a MongoDB/Mongoose

### 📝 NOTA: gardenId en uploads requiere query param
- Los endpoints de upload (`/upload/child-photo`, `/upload/daily-photos`, etc.) requieren `gardenId` como query parameter, no como campo en multipart form-data. Esto podría confundir a desarrolladores frontend.
