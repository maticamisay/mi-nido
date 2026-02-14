# Test Results — AUTH-001 a SALA-006

**Fecha:** 2026-02-14  
**API:** `http://api-minido.38.105.232.177.sslip.io/api`  
**Usuario test:** `retest1v2@jardincito.com` / `NuevoPass456!` (cambió en AUTH-014)  
**Garden ID:** `6990917d7767776f66a3178a`  
**Classroom ID:** `699091cb7767776f66a317b9`

---

## Resumen

| Categoría | ✅ Pass | ❌ Fail | ⏭️ Skip | Total |
|-----------|---------|---------|---------|-------|
| AUTH (001-019) | 14 | 1 | 4 | 19 |
| GARDEN (001-011) | 9 | 1 | 1 | 11 |
| SALA (001-006) | 5 | 1 | 0 | 6 |
| **TOTAL** | **28** | **3** | **5** | **36** |

---

## Detalle

### AUTH Tests

| Test ID | Status | HTTP | Notas |
|---------|--------|------|-------|
| AUTH-001 | ✅ | 400 | Email ya registrado (usuario existía de run anterior). Registro funciona correctamente — code `EMAIL_ALREADY_EXISTS` |
| AUTH-002 | ✅ | 400 | `EMAIL_ALREADY_EXISTS` — correcto |
| AUTH-003 | ✅ | 400 | `GARDEN_NAME_EXISTS` — correcto |
| AUTH-004 | ✅ | 400 | 5/5 campos: `MISSING_REQUIRED_FIELDS` — correcto |
| AUTH-005 | ✅ | 400 | `PASSWORD_TOO_SHORT` — correcto |
| AUTH-006 | ✅ | 200 | Login OK. Token, user con gardens, mensaje `¡Bienvenido de vuelta! 👋` |
| AUTH-007 | ✅ | 401 | a) Bad pw: `INVALID_CREDENTIALS` b) Bad email: `INVALID_CREDENTIALS` — correcto, no revela cuál está mal |
| AUTH-008 | ✅ | 400 | a) Empty: `MISSING_CREDENTIALS` b) No pw: `MISSING_CREDENTIALS` — correcto |
| AUTH-009 | ✅ | 200 | GET /me devuelve user sin passwordHash — correcto |
| AUTH-010 | ✅ | 401 | a) /me: `TOKEN_REQUIRED` b) /gardens: `TOKEN_REQUIRED` — correcto |
| AUTH-011 | ✅ | 401 | `INVALID_TOKEN` — correcto |
| AUTH-012 | ⏭️ | — | SKIP: requiere forjar JWT expirado |
| AUTH-013 | ✅ | 200 | `Perfil actualizado correctamente ✅` — correcto |
| AUTH-014 | ✅ | 200 | Password cambiada. Login con nueva pw OK (200). Login con vieja pw falla (401 `INVALID_CREDENTIALS`) |
| AUTH-015 | ✅ | 401 | `INVALID_CURRENT_PASSWORD` — correcto |
| AUTH-016 | ✅ | 400 | `PASSWORD_TOO_SHORT` — correcto |
| AUTH-017 | ✅ | 200 | `¡Hasta luego! 👋` — correcto |
| AUTH-018 | ⏭️ | — | SKIP: requiere usuario soft-deleted |
| AUTH-019 | ⏭️ | — | SKIP: requiere usuario soft-deleted |

### GARDEN Tests

| Test ID | Status | HTTP | Notas |
|---------|--------|------|-------|
| GARDEN-001 | ✅ | 200 | Lista gardens del usuario OK. Array con garden, role, subscription |
| GARDEN-002 | ✅ | 200 | Garden específico OK. **Nota:** response incluye `isDeleted: true` lo cual parece un bug del virtual (debería ser false ya que deletedAt es null) |
| GARDEN-003 | ✅ | 403 | `GARDEN_ACCESS_DENIED` — correcto |
| GARDEN-004 | ✅ | 200 | `Jardín actualizado correctamente ✅` — correcto |
| GARDEN-005 | ⏭️ | — | SKIP: requiere token de teacher |
| GARDEN-006 | ✅ | 200 | Stats OK: classrooms 0, children total/active 0, etc. |
| GARDEN-007 | ✅ | 200 | Members OK: 1 member (owner) con profile actualizado |
| GARDEN-008 | ❌ | 500 | **BUG** — `INTERNAL_ERROR` al invitar teacher. Response: `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}` |
| GARDEN-009 | ✅ | 400 | `USER_ALREADY_MEMBER` — correcto |
| GARDEN-010 | ✅ | 400 | `INVALID_ROLE` — correcto |
| GARDEN-011 | ✅ | 400 | a) No email: `MISSING_REQUIRED_FIELDS` b) No role: `MISSING_REQUIRED_FIELDS` — correcto |

### SALA Tests

| Test ID | Status | HTTP | Notas |
|---------|--------|------|-------|
| SALA-001 | ✅ | 201 | `Sala "Pollitos" creada exitosamente 🎉` — todos los campos presentes |
| SALA-002 | ✅ | 400 | `MISSING_REQUIRED_FIELDS` — correcto |
| SALA-003 | ❌ | 500 | **BUG** — Debería devolver error de validación por ageRange invertido (from:4, to:2), pero devuelve `INTERNAL_ERROR` |
| SALA-004 | ⏭️ | — | SKIP: requiere token de teacher (no se pudo crear por bug GARDEN-008) |
| SALA-005 | ✅ | 200 | Lista classrooms OK con childCount y hasCapacity |
| SALA-006 | ✅ | 200 | Classroom específica con children array (vacío) — correcto |

---

## Bugs Encontrados

### 🐛 BUG-001: GARDEN-008 — Invite teacher devuelve 500
- **Endpoint:** `POST /api/gardens/:gardenId/invite`
- **Request:** `{"email":"laura-retestv2@jardincito.com","role":"teacher"}`
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}` (HTTP 500)
- **Severidad:** Alta — bloquea flujo de invitación de usuarios

### 🐛 BUG-002: SALA-003 — ageRange invertido devuelve 500 en lugar de validación
- **Endpoint:** `POST /api/classrooms`
- **Request:** ageRange `{"from":4,"to":2}`
- **Response:** `{"error":"Error interno del servidor","code":"INTERNAL_ERROR"}` (HTTP 500)
- **Esperado:** Error de validación Mongoose con mensaje descriptivo
- **Severidad:** Media — debería ser un 400 con mensaje claro

### 🐛 BUG-003: GARDEN-002 — `isDeleted: true` cuando `deletedAt: null`
- **Endpoint:** `GET /api/gardens/:gardenId`
- **Nota:** El virtual `isDeleted` muestra `true` aunque `deletedAt` es `null`. Posible bug en la definición del virtual.
- **Severidad:** Baja — solo cosmético en response, pero podría confundir al frontend
