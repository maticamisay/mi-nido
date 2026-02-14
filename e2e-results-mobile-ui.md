# E2E Mobile UI Test Results — Mi Nido

**Fecha:** 2026-02-14  
**Viewports:** Mobile (375×812), Tablet (768×1024)  
**URL:** http://minido.38.105.232.177.sslip.io  
**Screenshots:** `/e2e-screenshots/`

---

## Resumen Ejecutivo

Se capturaron **15 screenshots** (12 mobile, 3 tablet). No se detectó overflow horizontal en ninguna página. Se encontraron **18 issues** de distinta severidad.

### Resultados por página

| Página | Mobile | Tablet | Overflow | Issues |
|--------|--------|--------|----------|--------|
| Login | ✅ | ✅ | No | 2 |
| Register | ✅ | - | No | 2 |
| Dashboard | ✅ | ✅ | No | 3 |
| Salas | ✅ | ✅ | No | 2 |
| Niños | ✅ (404) | - | No | 1 |
| Asistencia | ✅ | - | No | 2 |
| Cuaderno | ✅ | - | No | 2 |
| Comunicados | ✅ | - | No | 1 |
| Pagos | ✅ | - | No | 1 |
| Familia | ✅ | - | No | 2 |
| Más | ✅ | - | No | 2 |
| Sidebar | ❌ No se pudo abrir | - | - | 1 |

---

## Issues Encontrados

### 🔴 CRÍTICO (4)

#### 1. Bottom navbar tapa contenido
- **Páginas:** Dashboard, Más, y potencialmente todas
- **Descripción:** El contenido inferior queda oculto detrás del bottom navbar fijo. En dashboard, la card "Asistencia de Hoy" se corta. En "Más", las cards de Mensajes/Calendario/Ajustes quedan parcialmente tapadas.
- **Fix:** Agregar `padding-bottom: 70px` (o la altura del navbar) al contenedor principal de contenido.
- **Screenshot:** `mobile-viewport-dashboard.png`, `mobile-mas.png`

#### 2. Iconos/emojis rotos (tofu □)
- **Páginas:** Todas (más visible en Familia, Dashboard, Bottom navbar)
- **Descripción:** Múltiples iconos aparecen como cuadrados vacíos (□). Afecta: logo en header, iconos del bottom navbar, emojis en títulos, avatares, ilustraciones de estado vacío.
- **Fix:** Verificar que la icon font esté cargada correctamente, o migrar a SVGs inline.
- **Screenshot:** `mobile-familia.png`, `mobile-cuaderno.png`

#### 3. Página /ninos devuelve 404
- **Descripción:** La ruta `/ninos` muestra página 404 sin navegación de escape. El usuario queda en un callejón sin salida.
- **Fix:** Verificar la ruta correcta (¿`/niños`? ¿`/children`?) y agregar botón "Volver al inicio" en la 404.
- **Screenshot:** `mobile-ninos.png`

#### 4. Error + Estado vacío simultáneos
- **Páginas:** Salas, Asistencia, Cuaderno
- **Descripción:** Se muestra el banner de error ("no pudimos cargar") Y el estado vacío ("no hay datos, creá uno") al mismo tiempo. Mensajes contradictorios.
- **Fix:** Si hay error de carga, mostrar solo el error con botón "Reintentar". Si la carga fue exitosa y no hay datos, mostrar el estado vacío.

### 🟠 ALTO (4)

#### 5. Hamburger menu no se pudo abrir
- **Descripción:** El botón de hamburger menu existe pero no responde al click en el test automatizado. Puede ser un problema de z-index, tamaño de touch target, o estado del componente.
- **Fix:** Verificar que el botón sea clickeable y tenga `aria-label="menu"`.

#### 6. Touch targets del header muy pequeños (~24-30px)
- **Páginas:** Todas
- **Descripción:** El botón hamburger (☰) y la campana de notificaciones (🔔) tienen ~24-30px, por debajo del mínimo de 44px (Apple HIG).
- **Fix:** Aumentar el área tappeable a mínimo 44×44px con padding.

#### 7. Checkbox "Recordarme" demasiado pequeño en login
- **Página:** Login
- **Descripción:** El checkbox tiene ~18×18px, muy por debajo del mínimo de 44px.
- **Fix:** Usar un toggle o aumentar el área de tap incluyendo el label.

#### 8. Label "Comunicados" en bottom navbar al límite
- **Páginas:** Todas (bottom navbar)
- **Descripción:** "Comunicados" es muy largo para el espacio disponible (~75px por tab). Riesgo de truncamiento con font sizes mayores o dispositivos más angostos (320px).
- **Fix:** Abreviar a "Comunic." o usar solo iconos con tooltip.

### 🟡 MEDIO (5)

#### 9. Register: formulario muy largo para viewport
- **Descripción:** 7 campos + botón + header + stepper = mucho scroll. El botón "Siguiente" queda apenas visible al fondo.
- **Fix:** Considerar dividir en más pasos o colapsar campos opcionales.

#### 10. Espacio vertical excesivo entre secciones
- **Páginas:** Salas, Cuaderno, Asistencia
- **Descripción:** Gap de ~80-100px entre el banner de error y el estado vacío desperdicia espacio mobile.
- **Fix:** Reducir gaps a 24-32px.

#### 11. Login: link "Registrá tu jardín" muy pequeño
- **Descripción:** Link de texto sin padding, tap target insuficiente.
- **Fix:** Agregar padding vertical al link.

#### 12. Tablet: layout mobile estirado, no optimizado
- **Descripción:** En 768px se usa el mismo layout de mobile. Las cards de contenido se estiran a todo el ancho (~700px+) con mucho espacio vacío interno. El bottom navbar se sigue usando en lugar de sidebar.
- **Fix:** Implementar breakpoint para tablet con sidebar navigation y layouts de 2 columnas.

#### 13. Dashboard: iconos de stat cards aparecen como rectángulos vacíos
- **Descripción:** Los iconos dentro de las stat cards no se renderizan.
- **Fix:** Mismo issue que #2, verificar icon font/SVGs.

### 🟢 BAJO (5)

#### 14. Login: "¿Olvidaste tu contraseña?" wrapping incómodo
#### 15. Register: padding inconsistente entre campos lado a lado (Nombre/Apellido)
#### 16. Tablet dashboard: padding superior excesivo (~60-70px)
#### 17. Tablet dashboard: spacing inconsistente entre secciones
#### 18. Banner de error sin botón de retry explícito (solo emoji 🔄)

---

## Screenshots Capturados

### Mobile (375×812)
| Screenshot | Página |
|-----------|--------|
| `mobile-login.png` | Login (full page) |
| `mobile-register.png` | Register (full page) |
| `mobile-dashboard.png` | Dashboard (full page) |
| `mobile-viewport-dashboard.png` | Dashboard (viewport, para verificar navbar) |
| `mobile-salas.png` | Gestión de Salas |
| `mobile-ninos.png` | Niños (404) |
| `mobile-asistencia.png` | Asistencia Diaria |
| `mobile-cuaderno.png` | Cuaderno Digital |
| `mobile-comunicados.png` | Comunicados |
| `mobile-pagos.png` | Gestión de Pagos |
| `mobile-familia.png` | Familia |
| `mobile-mas.png` | Más Opciones |

### Tablet (768×1024)
| Screenshot | Página |
|-----------|--------|
| `tablet-login.png` | Login |
| `tablet-dashboard.png` | Dashboard |
| `tablet-salas.png` | Gestión de Salas |

---

## Datos Técnicos

- **Overflow horizontal:** No detectado en ninguna página
- **Playwright:** Chromium headless
- **Sidebar mobile:** No se pudo abrir (hamburger button no respondió al click)
- **Bottom navbar:** Presente en todas las páginas post-login, altura detectada pero posición reportada como 0 (posiblemente `position: fixed`)
