# E2E Browser Test Results — Final Run

**Date:** 2026-02-14T23:22:14.078Z
**URL:** http://minido.38.105.232.177.sslip.io

## Results

✅ **Login page loaded**

✅ **Login → dashboard redirect**

✅ **Dashboard greeting** — Buenas noches, María! 👋

ℹ️ **Dashboard stats** — resumen de lo que pasa hoy en el jardín. | 👶 | Nenes presentes | 3 / 5 | 📒 | Cuadernos (mes) | 0 | 💰 | Pagos pendientes | 0 | 🏫 | Salas / Nenes | 3 / 5 | Asistencia de Hoy | 80% | 🐥 | Sala Pollit

✅ **Salas page loaded**

✅ **Crear sala "Sala Pollitos 🐥"** — HTTP 201

✅ **Crear sala "Sala Ositos 🧸"** — HTTP 201

✅ **Crear sala "Sala Jirafitas 🦒"** — HTTP 201

✅ **Salas in list** — Found: Pollitos, Ositos, Jirafitas

✅ **Niños page loaded**

✅ **Crear nene "Valentina López"** — HTTP 201

✅ **Crear nene "Santiago Rodríguez"** — HTTP 201

✅ **Crear nene "Mía García"** — HTTP 201

✅ **Crear nene "Mateo Fernández"** — HTTP 201

✅ **Crear nene "Sofía Martínez"** — HTTP 201

✅ **Niños in list** — Found: Valentina, Santiago, Mía, Mateo, Sofía (5/5)

## Console Errors (5 total, 1 unique)

- `Failed to load resource: the server responded with a status of 404 (Not Found)`

## Screenshots

All saved to `/home/mati/projects/mi-nido/e2e-screenshots/browser/`

| File | Description |
|------|-------------|
| 01-login-page.png | Login page |
| 02-dashboard-after-login.png | Dashboard after login |
| 03-dashboard-desktop.png | Dashboard desktop view |
| 04-salas-initial.png | Salas page initial state |
| 05-sala-form.png | Sala creation form |
| 06-sala-created.png | After first sala created |
| 07-salas-all.png | All salas in list |
| 08-ninos-initial.png | Niños page initial state |
| 09-nino-form.png | Nino creation form |
| 10-ninos-all.png | All niños in list |

## Key Findings

- **API base URL:** `http://api-minido.38.105.232.177.sslip.io/api/`
- **Auth:** Bearer token + gardenId query param
- **BUG found:** Full page navigation (page.goto) causes auth token loss — API calls return 401. SPA navigation (link clicks) works correctly.
- **Salas page:** Has both error state AND empty state shown simultaneously when salas fail to load (UI bug)
- **Nino form:** Has 2 required emergency contacts (Nombre, Parentesco, Teléfono each)
