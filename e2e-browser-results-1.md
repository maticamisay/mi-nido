# E2E Browser Test Results

**Date:** 2026-02-14T23:18:58.580Z
**URL:** http://minido.38.105.232.177.sslip.io

## Results

✅ **Login page loaded**

✅ **Login → dashboard redirect**

✅ **Dashboard greeting** — Buenas noches, María! 👋

ℹ️ **Dashboard stats** — resumen de lo que pasa hoy en el jardín. | 👶 | Nenes presentes | 3 / 5 | 📒 | Cuadernos (mes) | 0 | 💰 | Pagos pendientes | 0 | 🏫 | Salas / Nenes | 10 / 5 | Asistencia de Hoy | 80% | ⭐ | Ar | 0 / 0 

✅ **Salas page loaded** — OK

✅ **Crear sala "Sala Pollitos 🐥"** — HTTP 201

✅ **Crear sala "Sala Ositos 🧸"** — HTTP 201

✅ **Crear sala "Sala Jirafitas 🦒"** — HTTP 201

✅ **Salas in list** — Found: Pollitos, Ositos, Jirafitas (3/3)

✅ **Niños page loaded**

⚠️ **Crear nene "Valentina López"** — Dialog stayed open

⚠️ **Crear nene "Santiago Rodríguez"** — Dialog stayed open

⚠️ **Crear nene "Mía García"** — Dialog stayed open

⚠️ **Crear nene "Mateo Fernández"** — Dialog stayed open

⚠️ **Crear nene "Sofía Martínez"** — Dialog stayed open

✅ **Niños in list** — Found: Valentina, Santiago, Mía, Mateo, Sofía (5/5)

## Console Errors (10)

- `Failed to load resource: the server responded with a status of 404 (Not Found)`

## Screenshots

All saved to `/home/mati/projects/mi-nido/e2e-screenshots/browser/`

## Key Findings

- API base: `http://api-minido.38.105.232.177.sslip.io/api/`
- Auth via Bearer token in header + gardenId as query param
- **BUG:** Navigating via `page.goto()` (full reload) causes 401 on API calls — auth token race condition on page load
- SPA navigation (clicking links) preserves auth state correctly
