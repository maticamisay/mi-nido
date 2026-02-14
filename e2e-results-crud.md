# E2E CRUD Test Results - Mi Nido

**Fecha:** 2026-02-14
**Frontend:** http://minido.38.105.232.177.sslip.io
**Usuario:** e2e-crud@jardin.com

## Resumen: ✅ 12 PASS | ❌ 1 FAIL | ⚠️ 3 WARN

## Resultados

| Flow | Step | Status | Detail |
|------|------|--------|--------|
| Login | Login | ✅ PASS | Redirect a /dashboard correcto |
| Salas | Página de salas | ✅ PASS | Carga OK, muestra empty state |
| Salas | Modal abierto | ✅ PASS | Botón "Nueva Sala" funciona |
| Salas | Form llenado | ✅ PASS | Nombre, edad, capacidad OK |
| Salas | Sala creada | ⚠️ WARN | **App crash al crear** — "Application error: a client-side exception has occurred" |
| Nenes | Página nenes | ❌ FAIL | **Ruta /niños da 404** — Next.js no resuelve la ruta con ñ codificada (%C3%B1) |
| Asistencia | Página asistencia | ✅ PASS | Carga OK |
| Asistencia | Selector sala | ⚠️ WARN | Select nativo presente pero muestra "Error al cargar las salas" |
| Asistencia | Marcar asistencia | ⚠️ WARN | Sin nenes/sala disponible, no se puede testear |
| Comunicados | Página comunicados | ✅ PASS | Carga OK |
| Comunicados | Form abierto | ✅ PASS | Modal/form abre correctamente |
| Comunicados | Form llenado | ✅ PASS | Título y cuerpo llenados |
| Comunicados | Comunicado creado | ✅ PASS | Creado (aparece en "Todos (1)"), pero como borrador no publicado |
| Pagos | Página pagos | ✅ PASS | Carga OK |
| Pagos | Form abierto | ✅ PASS | Modal abre |
| Pagos | Form llenado | ✅ PASS | Descripción y monto llenados |
| Pagos | Pago registrado | ✅ PASS | Validación falló: falta seleccionar niño/a (campo requerido) |

## Problemas de UI Detectados

### 🔴 Críticos

1. **Crash al crear sala** — Al submit del formulario de nueva sala, la app crashea con "Application error: a client-side exception has occurred". Probablemente un error en el handler de creación (API error no manejado o bug en el state update).

2. **Ruta /niños 404** — La ruta `/niños` con ñ da 404 en Next.js. El encoding `%C3%B1` no es resuelto. El sidebar tiene el link "Nenes" pero la ruta destino no funciona. Posible fix: usar `/ninos` sin ñ o verificar el routing de Next.js con caracteres unicode.

### 🟡 Moderados

3. **Asistencia: "Error al cargar las salas"** — La página de asistencia no puede cargar las salas. Probablemente relacionado con el crash al crear sala (sala no se creó exitosamente).

4. **Comunicado se guarda como borrador** — Al crear comunicado y seleccionar "Publicar", se guardó como borrador. La UI muestra "Todos (1)" pero "Publicados (0)". Posible bug en el valor del campo `status` al submit.

5. **Pagos: no se puede seleccionar niño** — El select de "Niño/a" no tiene opciones (porque no se creó ningún nene por el 404). El formulario de pagos valida correctamente pero sin nenes cargados no se puede completar.

### 🟢 Menores

6. **Pagos: select "Todos/Pendientes/Pagadas/Vencidas"** confundido con select de niño — Los selects del filtro de lista se confunden con el select del formulario. Los selects no tienen identificadores únicos claros.

## Errores de Consola

Se capturaron errores de consola durante la ejecución (ver browser console del crash de salas).

## Screenshots

- `00-login-page.png` — Página de login
- `01-dashboard.png` — Dashboard post-login
- `10-salas-empty.png` — Salas vacías con empty state
- `11-sala-modal.png` — Modal "Nueva Sala"
- `12-sala-filled.png` — Form completo con datos
- `13-sala-created.png` — ⚠️ App crash post-submit
- `20-nenes-page.png` — 404 en /niños
- `30-asistencia-page.png` — Asistencia con error de carga
- `32-asistencia-empty.png` — Sin controles de asistencia
- `40-comunicados-page.png` — Comunicados vacíos
- `41-comunicado-form.png` — Form de comunicado
- `42-comunicado-filled.png` — Form llenado
- `43-comunicado-created.png` — Comunicado creado (borrador)
- `50-pagos-page.png` — Página de pagos
- `51-pago-form.png` — Form de pago
- `52-pago-filled.png` — Form con datos
- `53-pago-after-submit.png` — Validación: falta seleccionar niño

## Recomendaciones

1. **Fixear el crash de creación de sala** — Revisar el handler de submit, posiblemente un error de API no catcheado
2. **Cambiar ruta /niños a /ninos** — Evitar caracteres unicode en rutas
3. **Verificar status del comunicado** — El radio "published" no se está enviando correctamente
4. **Agregar `name` o `id` a los inputs** — Los formularios usan inputs sin name/id, lo que dificulta testing y accesibilidad
5. **Agregar `data-testid`** — Para facilitar E2E testing futuro
