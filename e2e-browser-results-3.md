# E2E Browser Test Results — Pagos, Familia, Más + Mobile Review

**Fecha:** 2026-02-14  
**Frontend:** `http://minido.38.105.232.177.sslip.io`  
**Herramienta:** Playwright (headless Chromium)

---

## 1. Login ✅

- Login con `admin@jardinminido.com` / `MiNido2024!` exitoso
- Redirige correctamente a `/dashboard`
- Screenshot: `39-login-success.png`

## 2. Pagos

- **URL:** `/pagos` → carga correctamente
- **Elementos visibles:**
  - Título "Gestión de Pagos" con subtítulo descriptivo
  - Botón "+ Nuevo pago" (rosa, esquina superior derecha)
  - Filtros: Período (Feb 2026), Estado (Todos), Sala (Todas las salas)
  - Estado vacío: "No hay pagos registrados" con botón "+ Registrar pago"
- **No se encontró botón "Generar cuotas"** — la funcionalidad parece ser registro manual de pagos
- **No hay cuotas preexistentes** para registrar un pago
- Screenshots: `40-pagos-page.png`, `41-pagos-cuotas.png`, `42-pagos-pago-registrado.png`

## 3. Familia

- **URL:** `/familia` → carga correctamente
- **Elementos visibles:**
  - Banner de bienvenida: "Hola, María" con descripción del portal familiar
  - 🔴 **Error:** Banner rosa "Error al cargar tus hijos" — error de carga de datos
  - Estado vacío: "Sin niños registrados" — indica contactar al jardín
- **Observación:** Esta vista muestra el portal familiar desde perspectiva admin. El admin no tiene hijos asociados, lo que causa el error. Podría mejorarse ocultando esta sección para roles admin o mostrando una vista de gestión de familias.
- Screenshot: `43-familia-page.png`

## 4. Más

- **URL:** `/mas` → carga correctamente
- **Opciones listadas (6 cards):**
  1. 🏫 Salas — Administrar salas y seños
  2. 👶 Nenes — Fichas y legajos de los nenes
  3. ✅ Asistencia — Controlar la asistencia diaria
  4. 💬 Mensajes — Comunicación con familias
  5. 📅 Calendario — Eventos y actividades
  6. ⚙️ Ajustes — Configuración del jardín
- **Sección de ayuda:** "¿Necesitás ayuda?" con botones Guía de uso y Contactar soporte
- **Sub-páginas visitadas:**
  - `/configuracion` (Ajustes) → `45-mas---ajustes.png`
  - `/mensajes` (Mensajes) → `46-mas---mensajescomunicaci-n-con-fam.png`
  - `/calendario` (Calendario) → `47-mas---calendarioeventos-y-activida.png`
- Screenshots: `44-mas-page.png` + sub-páginas

## 5. Review Visual Mobile (375×812)

### Resumen por página

| Página | Navbar | Iconos □ | Contenido tapado | Padding | Scroll |
|--------|--------|----------|------------------|---------|--------|
| `/dashboard` | ✅ Visible | 🔴 SÍ - todos □ | ⚠️ Posible overlap | ✅ OK | 2484px |
| `/salas` | ✅ Visible | 🔴 SÍ | ✅ OK | ✅ OK | 812px |
| `/ninos` | ✅ Visible | 🔴 SÍ | ⚠️ Posible overlap | ✅ OK | 938px |
| `/asistencia` | ✅ Visible | 🔴 SÍ | ⚠️ Contenido muy cerca del navbar | ✅ OK | 830px |
| `/cuaderno` | ✅ Visible | 🔴 SÍ | ⚠️ Posible overlap | ✅ OK | 890px |
| `/comunicados` | ✅ Visible | 🔴 SÍ | ✅ OK | ✅ OK | 812px |
| `/pagos` | ✅ Visible | 🔴 SÍ | ⚠️ Posible overlap | ✅ OK | 992px |
| `/familia` | ✅ Visible | 🔴 SÍ | ✅ OK | ✅ OK | 812px |
| `/mas` | ✅ Visible | 🔴 SÍ | ⚠️ Contenido largo (1982px) | ✅ OK | 1982px |

### Detalle por checklist

- **¿Bottom navbar visible?** ✅ SÍ en todas las páginas — 5 tabs: Inicio, Cuaderno, Comunicados, Pagos, Más
- **¿Contenido inferior no tapado?** ⚠️ PARCIALMENTE — En páginas con scroll (dashboard, ninos, pagos, cuaderno), el contenido puede quedar detrás del navbar fijo. Falta `padding-bottom` suficiente en el contenedor principal.
- **¿Textos completos?** ✅ SÍ — todos los textos son legibles y no se cortan
- **¿Padding lateral OK?** ✅ SÍ — márgenes laterales consistentes
- **¿Iconos correctos (no □)?** 🔴 **NO — ISSUE CRÍTICO** — Todos los iconos se renderizan como □ (cuadrados vacíos). Afecta: header, títulos de página, navbar inferior, cards, estados vacíos. Solo los emojis Unicode (⚙️, ⋯) se ven correctamente.
- **¿Cards espaciadas?** ✅ SÍ — spacing adecuado entre cards

---

## LISTA CONSOLIDADA DE ISSUES VISUALES

### 🔴 Críticos

| # | Issue | Ubicación | Descripción |
|---|-------|-----------|-------------|
| 1 | **Iconos rotos (□) en TODA la app mobile** | Global | Todos los iconos se renderizan como cuadrados vacíos. La librería de iconos (probablemente Lucide) no carga correctamente en headless/producción. Afecta navbar, headers, cards, estados vacíos. |
| 2 | **Error "Error al cargar tus hijos" en /familia** | `/familia` | El portal familiar muestra error para el admin. Debería manejar el rol admin de forma diferente o mostrar vista de gestión. |

### 🟡 Moderados

| # | Issue | Ubicación | Descripción |
|---|-------|-----------|-------------|
| 3 | **Contenido puede quedar detrás del navbar fijo** | Mobile global | En páginas con scroll, el contenido inferior puede ocultarse detrás del bottom navbar. Agregar `padding-bottom: 80px` al contenedor principal. |
| 4 | **No hay funcionalidad "Generar cuotas"** | `/pagos` | Solo existe registro manual de pagos. No hay forma de generar cuotas masivas para un mes. |
| 5 | **Botón "+ Nuevo pago" puede colisionar con header en pantallas pequeñas** | `/pagos` mobile | El FAB flotante puede superponerse al texto del header en viewports muy angostos. |

### 🟢 Menores / Sugerencias

| # | Issue | Ubicación | Descripción |
|---|-------|-----------|-------------|
| 6 | **textContent del body incluye JSON de Next.js** | Global | `page.textContent('body')` retorna datos RSC en vez de texto renderizado — indica que el contenido se carga client-side (hidratación). No es un bug visual pero dificulta testing con selectores de texto. |
| 7 | **Sección "Más" duplica opciones del sidebar** | `/mas` | Las opciones de "Más" son las mismas que el sidebar desktop. Esto es correcto para mobile (donde no hay sidebar) pero podría optimizarse. |
| 8 | **Dashboard mobile scrollea mucho (2484px)** | `/dashboard` mobile | El dashboard tiene mucho contenido vertical. Considerar colapsar secciones o usar tabs. |

---

### Screenshots generados

**Desktop:**
- `39-login-success.png`
- `40-pagos-page.png`, `41-pagos-cuotas.png`, `42-pagos-pago-registrado.png`
- `43-familia-page.png`
- `44-mas-page.png`
- `45-mas---ajustes.png`, `46-mas---mensajescomunicaci-n-con-fam.png`, `47-mas---calendarioeventos-y-activida.png`, `48-mas---ajustesconfiguraci-n-del-jar.png`

**Mobile (375×812):**
- `mobile-01-dashboard.png` through `mobile-09-mas.png`
