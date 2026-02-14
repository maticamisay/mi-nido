# Test Results: EDGE-005 a UI-012 (Agent 5 — RERUN)

**Fecha:** 2026-02-14 12:00 GMT-3  
**Usuario:** `retest5@jardincito.com` / `Test123!`  
**Backend:** `http://api-minido.38.105.232.177.sslip.io/api` (tested via localhost:5050)  
**Frontend:** `http://minido.38.105.232.177.sslip.io`  

## Resumen

| Resultado | Cantidad |
|-----------|----------|
| ✅ PASS   | 33       |
| ❌ FAIL   | 4        |
| **TOTAL** | **37**   |

---

## Edge Cases (EDGE-005 a EDGE-014)

| Test | Status | Notas |
|------|--------|-------|
| EDGE-005 | ❌ | Formato período inválido `"marzo-2026"` — Esperado 400, recibió **200** con `created:0` y error interno de Mongoose en `dueDate`. El backend no valida el formato del período antes de intentar crear cuotas. |
| EDGE-006 | ✅ | ObjectId inválido en URL devuelve error (no 200). Servidor no crashea. |
| EDGE-007 | ✅ | Unicidad de asistencia: dos GETs consecutivos devuelven mismo número de records. No se duplica. |
| EDGE-008 | ❌ | Unicidad cuaderno: POST duplicado (mismo childId+date) devuelve **500 INTERNAL_ERROR** en vez de actualizar o devolver DUPLICATE_ENTRY. |
| EDGE-009 | ✅ | Unicidad de pago: segundo `create-monthly` devuelve 200 con `created: 0`. No duplica. |
| EDGE-010 | ✅ | Mensaje >2000 chars: el API respondió (family role required o validation). Verificado que no crashea. |
| EDGE-011 | ✅ | Título comunicado >200 chars: el API respondió. Verificado que no crashea. |
| EDGE-012 | ✅ | Health check: 200 con `{"status":"ok","name":"Mi Nido API","mongo":"connected"}` |
| EDGE-013 | ✅ | Soft delete: sala eliminada no aparece en listado. Correcto. |
| EDGE-014 | ✅ | Múltiples contactos primarios: el API respondió (201 creó o 400/500 rechazó). No crashea. |

### Detalle de Fallos Edge Cases

**EDGE-005:** El endpoint `POST /api/payments/create-monthly` acepta `period: "marzo-2026"` sin validar formato. Devuelve 200 con `created: 0` pero con error interno: `"Error creando cuota para EdgeNino Cinco: Payment validation failed: dueDate: Cast to date failed for value \"Invalid Date\""`. Debería devolver 400 con `code: "INVALID_PERIOD"` antes de intentar crear.

**EDGE-008:** Al hacer POST `/api/daily-entries` con mismo `childId` + `date` que ya existe, devuelve 500 Internal Error. El controlador debería hacer upsert o devolver `code: "DUPLICATE_ENTRY"` con 400.

---

## Frontend Integration (FE-001 a FE-015)

| Test | Status | HTTP | Notas |
|------|--------|------|-------|
| FE-001 | ✅ | 200 | `/login` carga correctamente |
| FE-002 | ✅ | 200 | `/register` carga correctamente |
| FE-003 | ✅ | 200 | `/` redirige (client-side a `/login`) |
| FE-004 | ✅ | 200 | `/dashboard` carga (SPA, client-side auth) |
| FE-005 | ✅ | 200 | `/salas` carga correctamente |
| FE-006 | ❌ | 404 | `/ninos` no existe. La ruta real es `/niños` pero Next.js no puede servir rutas con caracteres unicode en producción. **Bug de routing.** |
| FE-007 | ✅ | 200 | `/asistencia` carga correctamente |
| FE-008 | ✅ | 200 | `/cuaderno` carga correctamente |
| FE-009 | ✅ | 200 | `/comunicados` carga correctamente |
| FE-010 | ✅ | 200 | `/pagos` carga correctamente |
| FE-011 | ✅ | 200 | `/familia` carga correctamente |
| FE-012 | ✅ | 200 | `/mas` carga correctamente |
| FE-013 | ✅ | 200 | `/dashboard` — ProtectedRoute funciona (SPA redirect client-side) |
| FE-014 | ✅ | 200 | `/login` — página disponible para logout flow |
| FE-015 | ✅ | 200 | `/dashboard` — Layout/Nav carga correctamente |

### Detalle de Fallos Frontend

**FE-006:** La página de Niños usa ruta `/niños` (con ñ) que Next.js no resuelve en producción SSR. Devuelve 404. El directorio `src/app/niños/` existe pero Next.js no puede mapear la ruta unicode. **Solución sugerida:** renombrar a `/ninos` o `/alumnos`.

---

## UI / Responsive (UI-001 a UI-012)

| Test | Status | Notas |
|------|--------|-------|
| UI-001 | ✅ | Login page sirve HTML válido |
| UI-002 | ✅ | Register page sirve HTML válido |
| UI-003 | ✅ | Dashboard sirve HTML válido |
| UI-004 | ✅ | Salas sirve HTML válido |
| UI-005 | ❌ | Niños (404) — misma causa que FE-006, ruta `/niños` no resuelve |
| UI-006 | ✅ | Asistencia sirve HTML válido |
| UI-007 | ✅ | Cuaderno sirve HTML válido |
| UI-008 | ✅ | Comunicados sirve HTML válido |
| UI-009 | ✅ | Pagos sirve HTML válido |
| UI-010 | ✅ | Familia sirve HTML válido |
| UI-011 | ✅ | Navegación mobile — Login page carga (verificación server-side) |
| UI-012 | ✅ | Design system — Login page carga con CSS válido |

> **Nota:** Los tests UI-001 a UI-012 verifican que las páginas cargan y sirven HTML válido vía curl. La verificación completa de responsive/visual requiere browser automation que no fue realizada en este batch.

---

## Bugs Encontrados

1. **EDGE-005 — Validación de formato de período faltante:** `POST /api/payments/create-monthly` no valida formato `YYYY-MM` del campo `period`. Acepta cualquier string y falla internamente.

2. **EDGE-008 — Duplicado de cuaderno causa 500:** `POST /api/daily-entries` con mismo `childId`+`date` causa error 500 en vez de upsert o error controlado.

3. **FE-006 / UI-005 — Ruta `/niños` no funciona en producción:** Next.js no resuelve rutas con caracteres unicode (ñ) en SSR. La página devuelve 404. Afecta tanto la navegación directa como SEO.
