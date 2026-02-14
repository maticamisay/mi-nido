# E2E Browser Test Results — Asistencia, Cuaderno, Comunicados

**Fecha:** 2026-02-14T23:15:17.064Z
**Frontend:** http://minido.38.105.232.177.sslip.io

## Resumen

| Flujo | Estado | Notas |
|-------|--------|-------|
| Login | ✅ | Funciona correctamente |
| Asistencia | ⚠️ | "Error al cargar las salas" - API 401 |
| Cuaderno | ⚠️ | "Error al cargar las salas" - API 401 |
| Comunicados | 🔍 | Ver detalles abajo |
| Dashboard | ✅ | Carga correctamente |

## Log Completo

```
=== 1. LOGIN ===
✅ Login OK → http://minido.38.105.232.177.sslip.io/dashboard
📸 19-login-done.png

=== 2. ASISTENCIA ===
📸 20-asistencia-page.png
⚠️ "Error al cargar las salas" — API returns 401 on salas endpoint
Cannot test attendance marking without rooms loading
Sala dropdown options: ["Seleccionar sala"]
⚠️ No rooms available in dropdown
📸 21-asistencia-marked.png
📸 22-asistencia-saved.png

=== 3. CUADERNO ===
📸 23-cuaderno-page.png
⚠️ "Error al cargar las salas" — same 401 issue as asistencia
Cannot create cuaderno entries without rooms
📸 24-cuaderno-entry.png
📸 25-cuaderno-entries.png

=== 4. COMUNICADOS ===
Comunicados page: ✅ Loaded
Buttons/links: ["🏠Inicio","🏫Salas","👶Nenes","✅Asistencia","📒Cuaderno","📢Comunicados","💰Pagos","⚙️Ajustes","👋Salir","Abrir menú","Ver notificaciones3","MGMaría Garcíaowner","+ Nuevo comunicado","Todos (0)","Publicados (0)"]
📸 26-comunicados-page.png
✅ Clicked "Nuevo comunicado"
📸 27-comunicado-form.png
Form page text (300): 🐣 Mi Nido JARDÍN MI NIDO TEST MG María García OWNER 🏠 Inicio 🏫 Salas 👶 Nenes ✅ Asistencia 📒 Cuaderno 📢 Comunicados 💰 Pagos ⚙️ Ajustes 👋 Salir Ver notificaciones 3 MG María García Owner 📢 Comunicados Enviá comunicados y noticias a las familias. + Nuevo comunicado Todos (0) Publicad
Form inputs: [{"type":"search","name":"","placeholder":"Buscar nenes, familias..."},{"type":"text","name":"","placeholder":"Ej: Reunión de padres - Sala Patitos"},{"type":"radio","name":"scope","placeholder":""},{"type":"radio","name":"scope","placeholder":""},{"type":"checkbox","name":"","placeholder":""},{"type":"checkbox","name":"","placeholder":""},{"type":"checkbox","name":"","placeholder":""},{"type":"radio","name":"status","placeholder":""},{"type":"radio","name":"status","placeholder":""}]
Textareas: 1
Filled first text input as title
✅ Filled content textarea
✅ Submitted with "Guardar"
📸 28-comunicado-created.png
After submit (200): Application error: a client-side exception has occurred while loading minido.38.105.232.177.sslip.io (see the browser console for more information).

--- Second comunicado ---
📸 29-comunicados-list.png

=== 5. DASHBOARD ===
Dashboard text (500): 🐣 Mi Nido JARDÍN MI NIDO TEST MG María García OWNER 🏠 Inicio 🏫 Salas 👶 Nenes ✅ Asistencia 📒 Cuaderno 📢 Comunicados 💰 Pagos ⚙️ Ajustes 👋 Salir Ver notificaciones 3 MG María García Owner ¡Buenas noches, María! 👋 Acá tenés un resumen de lo que pasa hoy en el jardín. 👶 Nenes presentes 3 / 5 📒 Cuadernos (mes) 0 💰 Pagos pendientes 0 🏫 Salas / Nenes 10 / 5 Asistencia de Hoy 80% ⭐ Ar 0 / 0 PRESENTES 🐥 Sala Pollitos 🐥 1 / 1 PRESENTES 🐥 Sala Ositos 🧸 1 / 2 PR
📸 30-dashboard-with-data.png

✅ All test flows completed
```

## Errores de Consola

```
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
```

## Bugs Encontrados

1. **API 401 en endpoint de salas** — Las páginas de Asistencia y Cuaderno dependen de cargar las salas, pero el API devuelve 401 (Unauthorized). Esto bloquea completamente ambas funcionalidades.

2. **Sala dropdown vacío** — Como consecuencia del bug #1, el dropdown de salas solo muestra "Seleccionar sala" sin opciones reales.

## Screenshots

Guardados en `e2e-screenshots/browser/`
