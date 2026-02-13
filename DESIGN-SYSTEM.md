# 🐣 Mi Nido — Design System

## Filosofía de Diseño

Mi Nido debe sentirse como un lugar **cálido, seguro y cercano** — igual que un jardín maternal. Nada de interfaces frías o corporativas. Cada pantalla debe transmitir:

- **Calidez**: colores suaves, bordes redondeados, íconos amigables
- **Confianza**: limpio, organizado, sin ruido visual
- **Ternura**: sin ser infantil ni cursi — profesional pero con corazón
- **Simplicidad**: las seños y los papás no son techies, todo debe ser obvio

**Referencia estética**: pensá en la decoración de un jardín maternal lindo — paredes pastel, carteleras con dibujos, letras redondeadas, stickers. Eso, pero digital y profesional.

---

## 🎨 Paleta de Colores

### Colores Primarios

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Rosa Nido** | `#F2A7B3` | Color principal, botones primarios, header |
| **Rosa Suave** | `#FAD4DB` | Fondos destacados, cards activas, badges |
| **Rosa Pétalo** | `#FFF0F3` | Fondo general de la app |

### Colores Secundarios

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Lila Pastel** | `#D4B5D6` | Acentos, tags, categorías |
| **Melocotón** | `#FADBC8` | Notificaciones, alertas suaves |
| **Verde Menta** | `#B8E0D2` | Éxito, confirmaciones, asistencia "presente" |
| **Celeste Bebé** | `#B5D5E8` | Info, links, elementos secundarios |
| **Amarillo Pollito** | `#FDE8A0` | Destacados, estrellas, favoritos |

### Neutros

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Blanco Nube** | `#FFFFFF` | Fondo de cards, modales |
| **Gris Cálido 50** | `#FAF8F7` | Fondo de página alternativo |
| **Gris Cálido 100** | `#F0EDEB` | Bordes, separadores |
| **Gris Cálido 300** | `#C9C3BF` | Texto secundario, placeholders |
| **Gris Cálido 600** | `#7A726D` | Texto body |
| **Gris Cálido 800** | `#3D3733` | Títulos, texto principal |

### Estados

| Estado | Color | Hex |
|--------|-------|-----|
| Éxito / Presente | Verde Menta | `#B8E0D2` |
| Éxito texto | Verde Oscuro | `#2D7A5F` |
| Alerta / Pendiente | Melocotón | `#FADBC8` |
| Alerta texto | Naranja Oscuro | `#B5651D` |
| Error / Ausente | Rosa Intenso | `#E88A9A` |
| Error texto | Rojo Oscuro | `#9B3A4A` |
| Info | Celeste Bebé | `#B5D5E8` |
| Info texto | Azul Oscuro | `#2A6496` |

---

## 🔤 Tipografía

### Font Principal: **Nunito**
- Google Font, gratuita
- Redondeada, amigable, muy legible
- Perfecta para el tono cálido de Mi Nido
- Alternativa: Quicksand (más geométrica pero igual de suave)

### Font Secundaria: **Inter**
- Para textos largos, tablas, datos numéricos
- Neutral, altamente legible en pantalla
- Complementa bien a Nunito sin competir

### Escala Tipográfica

| Elemento | Font | Peso | Tamaño | Line Height |
|----------|------|------|--------|-------------|
| **H1 — Título de página** | Nunito | Bold (700) | 28px / 1.75rem | 1.3 |
| **H2 — Sección** | Nunito | SemiBold (600) | 22px / 1.375rem | 1.35 |
| **H3 — Subsección** | Nunito | SemiBold (600) | 18px / 1.125rem | 1.4 |
| **Body** | Inter | Regular (400) | 16px / 1rem | 1.5 |
| **Body Small** | Inter | Regular (400) | 14px / 0.875rem | 1.5 |
| **Caption** | Inter | Medium (500) | 12px / 0.75rem | 1.4 |
| **Button** | Nunito | Bold (700) | 15px / 0.9375rem | 1 |
| **Label** | Nunito | SemiBold (600) | 14px / 0.875rem | 1 |
| **Número/Dato** | Inter | SemiBold (600) | 16px / 1rem | 1.2 |

### Import
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
```

---

## 📐 Espaciado y Layout

### Sistema de Espaciado (base 4px)

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Micro separaciones |
| `space-2` | 8px | Entre íconos y texto |
| `space-3` | 12px | Padding interno de badges/tags |
| `space-4` | 16px | Padding de cards, gap entre elementos |
| `space-5` | 20px | Separación entre secciones menores |
| `space-6` | 24px | Padding de contenedores |
| `space-8` | 32px | Separación entre secciones |
| `space-10` | 40px | Margen de página mobile |
| `space-12` | 48px | Separación de bloques grandes |

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 8px | Inputs, badges |
| `radius-md` | 12px | Cards, botones |
| `radius-lg` | 16px | Modales, contenedores grandes |
| `radius-xl` | 24px | Avatares, elementos destacados |
| `radius-full` | 9999px | Avatares circulares, pills |

**Regla**: nada con esquinas rectas. Todo redondeado, como los juguetes de un jardín.

---

## 🧩 Componentes Base

### Botones

```
[Primario]     bg: Rosa Nido (#F2A7B3) → text: white → hover: #E8919F
[Secundario]   bg: white → border: Rosa Nido → text: Rosa Nido → hover: Rosa Pétalo bg
[Ghost]        bg: transparent → text: Gris 600 → hover: Gris 50 bg
[Éxito]        bg: Verde Menta (#B8E0D2) → text: #2D7A5F
[Peligro]      bg: #E88A9A → text: white
```

- Todos con `radius-md` (12px)
- Padding: `12px 24px`
- Font: Nunito Bold 15px
- Transición suave en hover (200ms)
- Sombra sutil en primario: `0 2px 8px rgba(242, 167, 179, 0.3)`

### Cards

```
bg: white
border: 1px solid #F0EDEB
border-radius: 12px
padding: 16px
shadow: 0 1px 3px rgba(0, 0, 0, 0.04)
hover: shadow 0 4px 12px rgba(0, 0, 0, 0.06)
```

### Inputs

```
bg: white
border: 1.5px solid #F0EDEB
border-radius: 8px
padding: 12px 16px
font: Inter Regular 16px
focus: border-color Rosa Nido, shadow 0 0 0 3px rgba(242, 167, 179, 0.15)
placeholder: Gris 300
```

### Avatares (Niños)

- Circulares (`radius-full`)
- Con iniciales si no hay foto
- Fondo: color pastel aleatorio de la paleta secundaria
- Borde: 2px solid white + sombra sutil
- Tamaños: 32px (lista), 48px (card), 72px (perfil)

### Tags / Badges

```
bg: color pastel correspondiente
text: versión oscura del mismo color
padding: 4px 12px
border-radius: 8px
font: Nunito SemiBold 12px
```

Ejemplos:
- Sala "Patitos" → bg: Amarillo Pollito, text: #8B7425
- Turno Mañana → bg: Celeste Bebé, text: #2A6496
- Cuota Pendiente → bg: Melocotón, text: #B5651D
- Presente → bg: Verde Menta, text: #2D7A5F

---

## 🖼️ Iconografía

### Estilo
- **Lucide Icons** (o Phosphor Icons) — línea redondeada, consistente
- Trazo: 1.5px-2px
- Estilo: rounded/duotone
- Tamaño base: 20px (nav), 24px (acciones), 16px (inline)

### Íconos Clave del Dominio

| Concepto | Ícono sugerido |
|----------|---------------|
| Sala / Aula | `🏠` Home |
| Niño/a | `👶` Baby o avatar circular |
| Asistencia | `✅` CheckCircle |
| Cuaderno del día | `📒` BookOpen |
| Fotos | `📷` Camera |
| Comunicados | `📢` Megaphone |
| Cuota / Pagos | `💰` Wallet |
| Familia | `👨‍👩‍👧` Users |
| Calendario | `📅` Calendar |
| Configuración | `⚙️` Settings |

---

## 📱 Responsive / Mobile-First

### Breakpoints

| Nombre | Ancho | Dispositivo |
|--------|-------|-------------|
| `mobile` | 0 - 639px | Celulares (uso principal) |
| `tablet` | 640 - 1023px | Tablets |
| `desktop` | 1024px+ | Escritorio (admin) |

### Principios Mobile
- **Touch targets mínimo 44px** (dedos, no mouse)
- **Bottom navigation** en mobile (4-5 tabs: Inicio, Cuaderno, Comunicados, Pagos, Más)
- **Sidebar** en desktop
- Fotos: galería swipeable
- Formularios: un campo por línea en mobile
- FAB (Floating Action Button) para acciones principales (ej: "Agregar entrada al cuaderno")

---

## 🌙 Tema Oscuro (Futuro)

No es MVP, pero la paleta se presta bien:
- Fondos: `#1A1517` (rosado muy oscuro cálido)
- Cards: `#2A2225`
- Rosa Nido se mantiene como acento
- Los pasteles se saturan levemente

---

## 🎭 Tono Visual (Do's & Don'ts)

### ✅ Sí
- Bordes redondeados en todo
- Espacios generosos (no apretado)
- Emojis en títulos y estados
- Ilustraciones suaves (estilo flat/minimal con paleta pastel)
- Animaciones micro sutiles (fade in cards, bounce suave en botones)
- Fotos de niños con bordes redondeados y sombra suave

### ❌ No
- Esquinas rectas
- Colores saturados/neón
- Tipografías serif o monospace en UI
- Layouts densos tipo dashboard corporativo
- Íconos con trazo grueso/angular
- Sombras duras

---

## 🏗️ Tailwind Config Base

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        nido: {
          50: '#FFF0F3',   // Rosa Pétalo
          100: '#FAD4DB',  // Rosa Suave
          200: '#F5B8C3',
          300: '#F2A7B3',  // Rosa Nido (primary)
          400: '#E8919F',
          500: '#D4727F',
          600: '#9B3A4A',
        },
        lila: {
          100: '#EDE0EE',
          300: '#D4B5D6',
          600: '#8A5F8D',
        },
        melocoton: {
          100: '#FFF0E5',
          300: '#FADBC8',
          600: '#B5651D',
        },
        menta: {
          100: '#E5F5EE',
          300: '#B8E0D2',
          600: '#2D7A5F',
        },
        celeste: {
          100: '#E5F0F8',
          300: '#B5D5E8',
          600: '#2A6496',
        },
        pollito: {
          100: '#FFF8E0',
          300: '#FDE8A0',
          600: '#8B7425',
        },
        warm: {
          50: '#FAF8F7',
          100: '#F0EDEB',
          300: '#C9C3BF',
          600: '#7A726D',
          800: '#3D3733',
        },
      },
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'button': '12px',
        'input': '8px',
        'modal': '16px',
        'avatar': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'button': '0 2px 8px rgba(242, 167, 179, 0.3)',
        'focus': '0 0 0 3px rgba(242, 167, 179, 0.15)',
      },
    },
  },
}
```

---

## 🖼️ Logo Conceptual

**Concepto**: Un nido estilizado con forma redondeada, quizás con un huevito o un pajarito asomando. Líneas suaves. Color principal Rosa Nido con detalles en Melocotón o Amarillo Pollito.

**Alternativa**: La letra "N" de Nido con forma orgánica/redondeada, como hecha con una ramita, en Rosa Nido.

**Texto**: "mi nido" en Nunito Bold, minúsculas, con el ícono a la izquierda.

---

*Design System v1.0 — Mi Nido — Febrero 2026*
