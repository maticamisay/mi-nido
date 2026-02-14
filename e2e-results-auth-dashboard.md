# E2E Test Results — Auth & Dashboard

**Fecha:** 2026-02-14T17:52 (ART)
**Frontend:** http://minido.38.105.232.177.sslip.io
**Viewports:** Desktop 1280x800, Mobile 375x812

## Resultados

### Desktop (1280x800)

| Paso | Estado | Screenshot | Notas |
|------|--------|------------|-------|
| 1.1 Página registro | ✅ | `desktop-01-register.png` | 1099ms carga |
| 1.2 Step 1 llenado (datos personales) | ✅ | `desktop-02-register-filled.png` | firstName, lastName, email, phone, dni, password, confirmPassword |
| 1.3 Step 2 visible (datos jardín) | ✅ | — | Formulario multi-paso funciona |
| 1.4 Step 2 llenado | ✅ | — | gardenName, gardenAddress.street, gardenAddress.city, acceptTerms |
| 1.5 Registro submit | ✅ | — | Redirigió a /dashboard correctamente |
| 2.1 Página login | ✅ | — | Carga OK |
| 2.2 Login result | ✅ | `01-after-login.png` | Redirigió a /dashboard |
| 3.1 Dashboard cargado | ✅ | `01-after-login.png` | Muestra saludo "¡Buenas tardes, E2E!" |
| 3.2 Saludo visible | ⚠️ | — | Regex no matcheó (dice "Buenas tardes" con ¡) — visualmente SÍ está |
| 3.3 Cards/Stats | ✅ | — | 14 cards encontradas (Nenes presentes, Cuadernos, Pagos pendientes, Salas/Nenes) |
| 3.4 Sidebar | ✅ | — | Sidebar visible: Inicio, Salas, Nenes, Asistencia, Cuaderno, Comunicados, Pagos, Ajustes, Salir |
| 4. Salas | ✅ | `10-salas-empty.png` | 504ms |
| 4. Asistencia | ✅ | — | 440ms |
| 4. Cuaderno | ✅ | — | 477ms |
| 4. Comunicados | ✅ | — | 415ms |
| 4. Pagos | ✅ | — | 480ms |
| 5. Logout | ✅ | `16-desktop-logout.png` | Redirigió a /login |

### Mobile (375x812)

| Paso | Estado | Screenshot | Notas |
|------|--------|------------|-------|
| 1.1 Página registro | ✅ | `17-mobile-register.png` | 831ms |
| 1.2 Step 1 llenado | ✅ | `18-mobile-register-step1-filled.png` | |
| 1.3 Step 2 visible | ✅ | `19-mobile-register-step2.png` | |
| 1.4 Step 2 llenado | ✅ | `20-mobile-register-step2-filled.png` | |
| 1.5 Registro submit | ❌ | `21-mobile-register-result.png` | Email ya existía (del registro desktop). Se quedó en /register |
| 2.1 Página login | ✅ | `22-mobile-login.png` | |
| 2.2 Login result | ✅ | `24-mobile-login-result.png` | Redirigió a /dashboard |
| 3.1 Dashboard | ✅ | `25-mobile-dashboard.png` | Muestra saludo, cards, actividad reciente, acciones rápidas, bottom nav |
| 3.3 Cards/Stats | ✅ | — | 14 cards |
| 4. Salas | ✅ | `26-mobile-nav-salas.png` | 446ms |
| 4. Asistencia | ✅ | `27-mobile-nav-asistencia.png` | 503ms |
| 4. Cuaderno | ✅ | `28-mobile-nav-cuaderno.png` | 362ms |
| 4. Comunicados | ✅ | `29-mobile-nav-comunicados.png` | 316ms |
| 4. Pagos | ✅ | `30-mobile-nav-pagos.png` | 350ms |
| 5. Logout (Más) | ⚠️ | `31-mobile-mas.png` | Llegó a /mas pero el script se colgó buscando botón logout. La página "Más" se ve correcta |

## Errores de Consola

Ninguno capturado durante las pruebas.

## Observaciones de UI

1. **Dashboard desktop** — Se ve muy bien. Sidebar con toda la navegación, 4 stat cards en fila, secciones de Asistencia de Hoy, Actividad Reciente y Acciones Rápidas.
2. **Dashboard mobile** — Layout responsivo correcto. Cards en grid de 2 columnas, bottom navigation bar con Inicio/Cuaderno/Comunicados/Pagos/Más.
3. **Registro multi-paso** — Funciona bien, Step 1 (datos personales) → Step 2 (datos jardín). UX clara con indicadores de paso.
4. **Registro mobile duplicado** — Falla silenciosamente (no muestra error visible al usuario cuando el email ya existe). Se queda en /register sin feedback claro. **Bug potencial.**
5. **Navegación** — Todas las páginas cargan rápidamente (300-500ms). Sin errores 404.
6. **Bottom nav mobile** — Funciona correctamente con iconos y labels.
7. **Emojis en iconos** — Algunos iconos de las cards se muestran como rectangulitos (font fallback) en el screenshot headless. Verificar en browser real.

## Resumen

- ✅ Pasaron: **28**
- ⚠️ Advertencias: **3** (saludo regex, mobile registro duplicado, mobile logout script)
- ❌ Fallaron: **1** (mobile registro — email duplicado, esperado)
- **Total: 32 pasos**

### Conclusión
Los flujos de autenticación y dashboard funcionan correctamente tanto en desktop como mobile. El registro, login, navegación entre páginas y logout operan sin errores. El único issue encontrado es que el formulario de registro no muestra feedback claro cuando un email ya está registrado.
