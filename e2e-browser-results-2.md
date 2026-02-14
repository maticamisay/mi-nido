# E2E Browser Test Results — Asistencia, Cuaderno, Comunicados

**Fecha:** 2026-02-14T23:20:00Z  
**Frontend:** http://minido.38.105.232.177.sslip.io  
**Testeado como:** admin@jardinminido.com (María García, Owner)

## Resumen

| Flujo | Estado | Notas |
|-------|--------|-------|
| Login | ✅ OK | Credenciales correctas, redirige a /dashboard |
| Asistencia | ❌ Bloqueado | "Error al cargar las salas" — API 401 |
| Cuaderno | ❌ Bloqueado | "Error al cargar las salas" — API 401 |
| Comunicados (form) | ⚠️ Parcial | El formulario abre bien, pero al hacer submit crashea con "Application error: client-side exception" |
| Comunicados (lectura) | ✅ OK | La página lista se carga, tabs Todos/Publicados/Borradores funcionan |
| Dashboard | ✅ OK | Muestra stats: 3/5 nenes presentes, 10 salas, 80% asistencia, actividad reciente |

## Detalle por Flujo

### 1. Login ✅
- Campos: email (`input[name="email"]`) y password (`input[name="password"]`)
- Botón "Ingresar" funciona
- Redirige a `/dashboard` correctamente

### 2. Asistencia ❌
- La página carga con fecha (02/14/2026) y selector de sala
- **BUG:** El dropdown de sala solo muestra "Seleccionar sala" (vacío)
- **BUG:** Aparece error rosa: "⚠️ Error al cargar las salas"
- **Causa:** El API de salas devuelve 401 (Unauthorized) — probablemente el token no se envía o expiró
- Sin salas, no se puede tomar asistencia
- Screenshot: `20-asistencia-page.png`

### 3. Cuaderno ❌
- Mismo problema que Asistencia: depende de cargar salas primero
- **BUG:** "Error al cargar las salas" — API 401
- No se puede seleccionar sala → no se puede ver nenes → no se puede escribir cuaderno
- Screenshot: `23-cuaderno-page.png`

### 4. Comunicados ⚠️
- La página lista se carga correctamente
- Tabs: Todos (0), Publicados (0), Borradores (0)
- Botón "+ Nuevo comunicado" abre modal con:
  - Título del comunicado (input text)
  - Contenido (textarea)
  - Destinatarios: "Todo el jardín" / "Salas específicas" (radio)
  - Opciones: Confirmación de lectura, Fijar, Marcar urgente (checkboxes)
  - Estado: "Guardar como borrador" / "Publicar inmediatamente" (radio, default: publicar)
- Se llenó título "Reunión de padres - Marzo 2026" y contenido ✅
- **BUG CRÍTICO:** Al hacer click en "Guardar", la app crashea con:
  > "Application error: a client-side exception has occurred while loading minido.38.105.232.177.sslip.io"
- El segundo comunicado no se pudo crear porque la app quedó en estado de error
- Screenshots: `27-comunicado-form.png`, `28-comunicado-created.png`

### 5. Dashboard ✅
- Muestra greeting: "¡Buenas noches, María! 👋"
- Stats: Nenes presentes 3/5, Cuadernos (mes) 0, Pagos pendientes 0, Salas/Nenes 10/5
- Asistencia de Hoy: 80%
  - Sala Pollitos: 1/1
  - Sala Ositos: 1/2
  - Sala Jirafitas: 1/2
  - (+ salas duplicadas con 0/0 — **posible bug de salas duplicadas**)
- Actividad Reciente muestra data de tests API previos:
  - Valentina López: Cuaderno actualizado — Sala Pollitos (hace 15 min)
  - Santiago Fernández: Asistencia marcada — Sala Ositos (hace 1 hora)
  - Nuevo comunicado: Reunión de padres — Sala Pollitos (hace 2 horas)
- Acciones Rápidas: Escribir cuaderno, Tomar asistencia, Nuevo comunicado, Agregar nene
- Screenshot: `30-dashboard-with-data.png`

## Bugs Encontrados

| # | Severidad | Bug | Dónde |
|---|-----------|-----|-------|
| 1 | 🔴 Alta | API de salas devuelve 401 — bloquea Asistencia y Cuaderno | `/asistencia`, `/cuaderno` |
| 2 | 🔴 Alta | Submit de comunicado crashea con client-side exception | `/comunicados` (modal form) |
| 3 | 🟡 Media | Salas aparecen duplicadas en el dashboard (3 salas × 3 = 9 cards + 1 "Ar") | `/dashboard` |
| 4 | 🟡 Media | "Salas / Nenes: 10 / 5" — hay solo 3 salas creadas, no 10 | `/dashboard` |

## Screenshots

Guardados en `e2e-screenshots/browser/`:
- `19-login-done.png` — Dashboard post-login
- `20-asistencia-page.png` — Asistencia con error de salas
- `21-asistencia-marked.png` — Sin cambios (no hay salas)
- `22-asistencia-saved.png` — Sin cambios
- `23-cuaderno-page.png` — Cuaderno con error de salas
- `26-comunicados-page.png` — Lista de comunicados vacía
- `27-comunicado-form.png` — Formulario de nuevo comunicado
- `28-comunicado-created.png` — Client-side exception crash
- `29-comunicados-list.png` — App en estado de error
- `30-dashboard-with-data.png` — Dashboard con stats y actividad
