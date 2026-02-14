# E2E Test Results — Mi Nido — 2026-02-14

## Entorno
- **Frontend:** http://minido.38.105.232.177.sslip.io
- **API:** http://api-minido.38.105.232.177.sslip.io/api
- **Usuario:** admin@jardinminido.com (María García, Owner)
- **Garden:** Jardín Mi Nido Test (`698fff58839b97c547dbc9ba`)

---

## Paso 1: Login via API ✅
- Login exitoso, token JWT obtenido
- Garden ID: `698fff58839b97c547dbc9ba`
- Plan: semillita (trial hasta 2026-03-16)

## Paso 2: Generar cuotas mensuales ⚠️
- `POST /payments/create-monthly?gardenId=XXX` → **0 cuotas creadas**
- Motivo: No hay configuración de tarifas (fees) en el jardín
- El endpoint responde correctamente pero no genera cuotas sin config previa

## Paso 3: Registrar pago via API ❌
- No fue posible registrar pagos directamente via API
- `POST /api/payments` → 404 (ruta no existe)
- `POST /api/payments/record` → 404 (ruta no existe)
- Sin cuotas generadas, no hay pagos que registrar
- **Nota:** La UI de Pagos funciona y muestra correctamente el estado vacío con botón "+ Nuevo pago"

## Paso 4: Review Visual Completo

### Screenshots generados (22 total)
| Viewport | Páginas |
|----------|---------|
| Desktop 1280x800 | login, dashboard, salas, ninos, asistencia, cuaderno, comunicados, pagos, familia, mas |
| Mobile 375x812 | login, dashboard, salas, ninos, asistencia, cuaderno, comunicados, pagos, familia, mas |
| Tablet 768x1024 | dashboard, salas |

Ubicación: `/home/mati/projects/mi-nido/e2e-screenshots/final/`

---

## Review por Página

### 🖥️ Desktop (1280x800)

#### `/login` — ✅ Bien
- Layout split-screen funciona correctamente
- Formulario centrado, campos visibles
- **Issue menor:** Los iconos decorativos del lado izquierdo se renderizan como □ (emoji no soportado por font del server headless)

#### `/dashboard` — ✅ Bien con issues menores
- Layout general correcto, sidebar + contenido
- Cards de estadísticas bien distribuidas (4 columnas)
- Asistencia de Hoy y Actividad Reciente lado a lado
- Acciones Rápidas en 4 columnas
- **Issue:** Iconos de sidebar renderizados como □ (emoji rendering)
- **Issue:** Sala "Ar" en asistencia — nombre truncado (debería ser "Arcoíris" u otro)
- **Issue:** Salas/Nenes muestra 4/5 en header pero 7/5 en mobile — inconsistencia de datos

#### `/salas` — ⚠️ Error de datos
- Muestra error: "Ups, no pudimos cargar las salas. Intentá de nuevo"
- Empty state "Todavía no hay salas" + botón "Crear Primera Sala"
- **Bug:** El dashboard SÍ muestra salas con asistencia, pero la página /salas no las carga
- Layout y diseño del empty state correcto

#### `/ninos` — ⚠️ Error de datos
- Muestra error: "Ups, no pudimos cargar los nenes. Intentá de nuevo"
- Empty state correcto con CTA "Registrar primer nene"
- Mismo bug que salas: la API devuelve niños pero la página no los carga

#### `/asistencia` — ⚠️ Error de datos
- Error: "Error al cargar las salas"
- Formulario de fecha y sala visible y correcto
- Sin salas disponibles para seleccionar

#### `/cuaderno` — ✅ Funcional
- Muestra selector de sala y fecha
- Layout correcto

#### `/comunicados` — ✅ Bien
- Tabs Todos/Publicados/Borradores funcionan
- Empty state "No hay comunicados publicados" correcto
- Botón "+ Nuevo comunicado" visible

#### `/pagos` — ✅ Bien
- Filtros (Período, Estado, Sala) correctamente alineados en fila
- Empty state "No hay pagos registrados" con CTA "+ Registrar pago"
- Botón "+ Nuevo pago" en header

#### `/familia` — 🔴 Issues visuales
- **CRÍTICO:** Emoji grande de avatar/icono renderizado como □□□□ (4 cuadrados grandes)
- **CRÍTICO:** El emoji en la card rosa del header también son □□□□
- Error: "Error al cargar tus hijos"
- El texto "Sin niños registrados" tiene emoji roto también

#### `/mas` — ✅ Bien
- Grid de 2 columnas con cards de acciones
- Sección de ayuda con "Guía de uso" y "Contactar soporte"
- Layout correcto, buen spacing

---

### 📱 Mobile (375x812)

#### Bottom Navbar — ✅ Presente
- Visible en todas las páginas autenticadas
- 5 items: Inicio, Cuaderno, Comunicados, Pagos, Más
- Iconos renderizados como □ (emoji rendering issue del headless browser, probablemente OK en dispositivos reales)

#### `/login` — ✅ Bien
- Formulario centrado, responsive correcto
- **Issue menor:** "Recordarme" y "¿Olvidaste tu contraseña?" se solapan ligeramente en línea estrecha

#### `/dashboard` — ✅ Bien
- Cards de stats en grid 2x2 ✅
- Contenido scrolleable, no hay overflow
- Bottom navbar visible ✅
- **Issue:** Contenido de asistencia se superpone con bottom navbar — la sección "Asistencia de Hoy" queda cortada por la barra inferior al hacer scroll
- **Issue:** Salas duplicadas en asistencia (mañana y tarde listadas separado)

#### `/salas` — ⚠️ Error pero layout OK
- Error de carga, pero empty state responsive correcto

#### `/ninos` — ⚠️ Error pero layout OK  
- Descripción larga se adapta bien a mobile
- Botón "Agregar nene" correctamente posicionado
- Búsqueda y filtro de sala ocupan ancho completo ✅

#### `/asistencia` — ⚠️ Error pero layout OK
- Campos de fecha y sala stack vertical ✅

#### `/pagos` — ✅ Bien
- Filtros stackeados verticalmente ✅
- Botón "+ Nuevo pago" bien posicionado
- Empty state legible

#### `/familia` — 🔴 Mismos issues de emoji que desktop

#### `/mas` — ✅ Bien
- Grid adaptado, cards visibles
- Bottom navbar visible

#### Verificaciones Mobile Específicas:
- **Bottom navbar visible:** ✅ Sí, en todas las páginas
- **Padding lateral:** ✅ Adecuado (~16px)
- **Textos no truncados:** ✅ Se adaptan correctamente (multiline)
- **Iconos (no □):** ❌ Emojis se renderizan como □ en headless — requiere verificación en dispositivo real

---

### 📱 Tablet (768x1024)

#### `/dashboard` — ✅ Bien
- Usa layout mobile (bottom navbar) en vez de sidebar — correcto para 768px
- Cards de stats en grid 2x2
- Contenido se adapta bien

#### `/salas` — ⚠️ Error de datos, layout OK

---

## LISTA CONSOLIDADA DE ISSUES

### 🔴 Críticos (Severidad Alta)

| # | Issue | Páginas | Detalle |
|---|-------|---------|---------|
| 1 | **Emojis rotos (□□□□) en /familia** | `/familia` | Avatar y emojis decorativos se renderizan como cuadrados. Visible como 4 □ grandes. Afecta UX significativamente. |
| 2 | **Páginas /salas, /ninos, /asistencia no cargan datos** | `/salas`, `/ninos`, `/asistencia` | Muestran error "no pudimos cargar" a pesar de que la API SÍ tiene datos (el dashboard los muestra). Posible issue con la query de salas que filtra por `isDeleted`. |

### 🟡 Medios (Severidad Media)

| # | Issue | Páginas | Detalle |
|---|-------|---------|---------|
| 3 | **Emojis de sidebar/navbar como □** | Todas | Los iconos del sidebar (desktop) y bottom navbar (mobile) se renderizan como □. Probablemente solo en headless browser, pero verificar en Safari/dispositivos antiguos. |
| 4 | **Sala "Ar" truncada en dashboard** | `/dashboard` | En la sección "Asistencia de Hoy", una sala aparece como "Ar" en vez de su nombre completo. |
| 5 | **Inconsistencia Salas/Nenes count** | `/dashboard` | Desktop muestra "4/5" pero mobile muestra "7/5" para el mismo dato de Salas/Nenes |
| 6 | **Salas duplicadas en asistencia mobile** | `/dashboard` mobile | Se listan las mismas salas dos veces (turno mañana y turno tarde) en la sección de asistencia |
| 7 | **Bottom navbar puede tapar contenido** | `/dashboard` mobile | Al scrollear, el contenido inferior puede quedar parcialmente cubierto por la bottom navbar. Falta padding-bottom en el contenido. |

### 🟢 Menores (Severidad Baja)

| # | Issue | Páginas | Detalle |
|---|-------|---------|---------|
| 8 | **Login mobile: "Recordarme" y enlace se aprietan** | `/login` mobile | El checkbox "Recordarme" y "¿Olvidaste tu contraseña?" están muy juntos en pantallas < 375px |
| 9 | **Empty states sin datos de test** | `/pagos`, `/comunicados` | No hay datos de prueba para validar el render de listas con contenido |
| 10 | **API de pagos incompleta** | API | No existe endpoint POST para crear pagos directamente. El create-monthly depende de config de fees previa. |

---

## Resumen

| Categoría | Cantidad |
|-----------|----------|
| 🔴 Críticos | 2 |
| 🟡 Medios | 5 |
| 🟢 Menores | 3 |
| **Total** | **10** |

**Estado general:** La UI es visualmente sólida y responsive. El diseño rosa/coral es consistente, la tipografía legible, y la navegación funciona correctamente en los 3 viewports. Los problemas principales son de **datos** (salas/nenes no cargan por posible filtro de `isDeleted`) y **emoji rendering** (crítico en /familia, menor en iconos de navegación).
