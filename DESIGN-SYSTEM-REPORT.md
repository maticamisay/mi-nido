# Mi Nido — Design System Report

## Resumen Ejecutivo

- **Total componentes identificados:** 25
- **Alta prioridad:** 10 | **Media:** 9 | **Baja:** 6
- **Estimación de reducción de código:** ~35-40%
- **Páginas analizadas:** 11 (dashboard, niños, salas, asistencia, familia, pagos, cuaderno, comunicados, mas, login, register)
- **Componentes existentes:** 5 (AppLayout, Header, Sidebar, MobileBottomNav, ProtectedRoute)

---

## Componentes existentes

### En `globals.css` (clases CSS reutilizables)
| Clase | Descripción |
|-------|-------------|
| `.btn`, `.btn-primary`, `.btn-secondary` | Botones base |
| `.card`, `.card-compact`, `.card-spacious` | Tarjetas |
| `.input` | Inputs de formulario |
| `.badge` + variantes (sala-pollitos, success, warning, error) | Badges |
| `.avatar` + `.size-sm/md/lg` | Avatares |
| `.page-container` | Contenedor de página |
| `.page-header` | Header de página |
| `.page-section`, `.page-section-title` | Secciones |
| `.grid-stats`, `.grid-cards`, `.grid-actions` | Layouts de grilla |
| `.form-group`, `.form-field`, `.form-actions` | Layout de formularios |
| `.animate-*`, `.stagger-children` | Animaciones |
| `.glass`, `.bg-pattern` | Efectos decorativos |

### En `src/components/`
| Componente | Descripción |
|-----------|-------------|
| `AppLayout` | Layout principal con sidebar + header + bottom nav |
| `Header` | Barra superior con búsqueda, notificaciones, perfil |
| `Sidebar` | Navegación lateral desktop |
| `MobileBottomNav` | Navegación inferior mobile |
| `ProtectedRoute` | Guard de autenticación |

**Problema central:** Las clases CSS existen pero NO hay componentes React que las encapsulen. Cada página reimplementa los mismos patrones inline con variaciones.

---

## Componentes necesarios

### 1. Layout

#### PageHeader
🔴 **Alta prioridad** — Se repite en TODAS las páginas (9 de 9)

```typescript
interface PageHeaderProps {
  title: string           // Con emoji incluido
  description?: string
  actions?: ReactNode     // Botón "Nuevo X" a la derecha
  children?: ReactNode    // Filtros, búsqueda, etc. debajo
}
```

**Duplicación actual:**
```tsx
// dashboard/page.tsx
<div className="page-header animate-fade-in-up">
  <h1>{getGreeting()}, {firstName}! 👋</h1>
  <p>Acá tenés un resumen...</p>
</div>

// niños/page.tsx
<div className="page-header">
  <div className="flex items-center justify-between">
    <div>
      <h1>👶 Administración de Nenes</h1>
      <p>Administrá los nenes del jardín...</p>
    </div>
    <button className="btn btn-primary">...</button>
  </div>
  {/* filtros */}
</div>

// salas/page.tsx — idéntico patrón
// asistencia/page.tsx — idéntico patrón
// pagos/page.tsx — idéntico patrón
// comunicados/page.tsx — idéntico patrón
// cuaderno/page.tsx — idéntico patrón
```

---

#### ClassroomDateFilter
🔴 **Alta prioridad** — Se repite en 3 páginas idéntico

```typescript
interface ClassroomDateFilterProps {
  classrooms: Classroom[]
  selectedClassroom: string
  onClassroomChange: (id: string) => void
  selectedDate?: string
  onDateChange?: (date: string) => void
  showDate?: boolean  // default true
}
```

**Duplicación actual:**
```tsx
// asistencia/page.tsx
<div className="flex flex-col sm:flex-row gap-5 mb-6">
  <div className="sm:w-48">
    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Fecha</label>
    <input type="date" value={selectedDate} onChange={...} className="input" />
  </div>
  <div className="flex-1">
    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Sala</label>
    <select value={selectedClassroom} onChange={...} className="input">...</select>
  </div>
</div>

// cuaderno/page.tsx — EXACTAMENTE igual
// pagos/page.tsx — variante con más filtros
```

---

#### ClassroomInfoCard
🟡 **Media prioridad** — Se repite en asistencia y cuaderno

```typescript
interface ClassroomInfoCardProps {
  classroom: Classroom
  subtitle?: string  // fecha, descripción
}
```

**Duplicación:**
```tsx
// asistencia/page.tsx
<div className="card page-section">
  <div className="flex items-center gap-5 mb-4">
    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
         style={{ backgroundColor: currentClassroom.color }}>
      {currentClassroom.emoji}
    </div>
    <div>
      <h2>Sala {currentClassroom.name}</h2>
      <p>Turno {currentClassroom.shift} • {fecha}</p>
    </div>
  </div>
</div>

// cuaderno/page.tsx — IDÉNTICO
```

---

### 2. Feedback / Estados

#### LoadingSpinner
🔴 **Alta prioridad** — Se repite en TODAS las páginas (8 de 8 páginas protegidas)

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'   // default 'md'
  fullPage?: boolean            // default false — h-64 centered
  color?: string               // default primary
}
```

**Duplicación actual (idéntica en 8 archivos):**
```tsx
// niños/page.tsx, salas/page.tsx, asistencia/page.tsx, pagos/page.tsx,
// cuaderno/page.tsx, comunicados/page.tsx, familia/page.tsx, dashboard/page.tsx
<div className="flex items-center justify-center h-64">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
</div>
```

También hay un spinner inline para botones de "Guardando...":
```tsx
// asistencia, pagos, cuaderno, comunicados
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
```

---

#### AlertMessage
🔴 **Alta prioridad** — Se repite en 7 páginas

```typescript
interface AlertMessageProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}
```

**Duplicación actual (idéntica en 7 archivos):**
```tsx
// Error — niños, salas, asistencia, pagos, cuaderno, comunicados, familia
{error && (
  <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
    <div className="flex items-center gap-2">
      <span className="text-red-600">⚠️</span>
      <p className="text-red-700 text-sm font-medium">{error}</p>
    </div>
  </div>
)}

// Success — asistencia, pagos, cuaderno, comunicados
{successMessage && (
  <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
    <div className="flex items-center gap-2">
      <span className="text-green-600">✅</span>
      <p className="text-green-700 text-sm font-medium">{successMessage}</p>
    </div>
  </div>
)}
```

---

#### EmptyState
🔴 **Alta prioridad** — Se repite en 8+ lugares

```typescript
interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

**Duplicación actual:**
```tsx
// niños/page.tsx
<div className="text-center py-12">
  <div className="text-6xl mb-4">👶</div>
  <h3 className="text-xl font-semibold mb-2">Todavía no hay nenes registrados 👶</h3>
  <p className="text-[var(--color-text-secondary)] mb-6">¡Comenzá registrando el primer nene!</p>
  <button className="btn btn-primary">...</button>
</div>

// salas/page.tsx — mismo patrón, emoji 🏫
// pagos/page.tsx — mismo patrón, emoji 💸
// comunicados/page.tsx — mismo patrón, emoji 📭
// asistencia/page.tsx — mismo patrón, emoji 👶 y ✅
// cuaderno/page.tsx — mismo patrón, emoji 📒
// familia/page.tsx — emojis 📖, 📮, 💰, 👨👩👧👦
```

---

### 3. Cards

#### StatCard
🔴 **Alta prioridad** — Se usa en dashboard y pagos

```typescript
interface StatCardProps {
  icon: string           // emoji
  label: string
  value: string | number
  color: string          // background color del icono
  accent?: string
}
```

**Duplicación:**
```tsx
// dashboard/page.tsx
<div className="card animate-fade-in-up group cursor-default p-4 sm:p-6">
  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg"
         style={{ backgroundColor: stat.color }}>{stat.icon}</div>
    <div>
      <p className="text-[11px] sm:text-xs font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
      <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
    </div>
  </div>
</div>

// pagos/page.tsx — variante con emoji grande + texto centrado
<div className="card text-center p-6">
  <div className="text-3xl mb-2">💚</div>
  <p className="text-2xl font-bold">{formatCurrency(stats.totalPaidThisMonth)}</p>
  <p className="text-sm text-[var(--color-text-secondary)]">Pagos del mes</p>
</div>

// asistencia/page.tsx — variante compacta
<div className="card text-center">
  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
  <div className="text-sm text-[var(--color-text-secondary)]">Presentes</div>
</div>
```

---

#### ActionCard
🟡 **Media prioridad** — Dashboard acciones rápidas + más/page.tsx

```typescript
interface ActionCardProps {
  emoji: string
  label: string
  href: string
  description?: string
}
```

**Duplicación:**
```tsx
// dashboard/page.tsx
<Link href={action.href} className="card text-center p-5 group hover:shadow-lg hover:-translate-y-0.5">
  <div className="text-3xl mb-2 group-hover:scale-110">{action.emoji}</div>
  <p className="text-sm font-semibold">{action.label}</p>
</Link>

// mas/page.tsx
<Link href={option.href} className="card hover:shadow-lg p-6 text-center group">
  <div className="text-4xl mb-4 group-hover:scale-110">{option.icon}</div>
  <h3 className="text-lg font-semibold mb-2">{option.name}</h3>
  <p className="text-sm text-[var(--color-text-secondary)]">{option.description}</p>
</Link>
```

---

### 4. Data Display

#### Avatar
🔴 **Alta prioridad** — Se usa en 6+ páginas con lógica de foto/iniciales

```typescript
interface AvatarProps {
  firstName: string
  lastName: string
  photo?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string           // gradient o color sólido
}
```

La función `getInitials()` se duplica en: dashboard, niños, salas, asistencia, cuaderno, pagos, familia, Header, Sidebar.

**Duplicación (idéntica en 6+ archivos):**
```tsx
<div className="avatar size-md bg-[var(--color-primary)]">
  {child.photo ? (
    <img src={child.photo} alt="Foto" className="w-full h-full object-cover rounded-full" />
  ) : (
    getInitials(child.firstName, child.lastName)
  )}
</div>
```

---

#### DataRow
🟡 **Media prioridad** — Patrón label:value en niños y salas

```typescript
interface DataRowProps {
  label: string
  value: string | ReactNode
}
```

**Duplicación:**
```tsx
// niños/page.tsx
<div className="flex justify-between">
  <span className="text-sm text-[var(--color-text-secondary)]">Edad:</span>
  <span className="text-sm font-medium">{calculateAge(child.birthDate)} años</span>
</div>

// salas/page.tsx — idéntico patrón para Edades, Capacidad, Cuota, Vence el
```

---

#### StatusBadge
🔴 **Alta prioridad** — Lógica de badges de pago se duplica en pagos y familia

```typescript
interface StatusBadgeProps {
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived' | 'draft' | 'published' | 'archived'
  dueDate?: string     // para calcular vencimiento
}
```

**Duplicación:** `getStatusBadge()` está implementada de forma IDÉNTICA en:
- `pagos/page.tsx`
- `familia/page.tsx`

---

### 5. Overlay / Modal

#### Modal
🔴 **Alta prioridad** — Se repite en 5 páginas

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'  // max-w-md | max-w-2xl | max-w-4xl
  children: ReactNode
}
```

**Duplicación (idéntica estructura en 5 archivos):**
```tsx
// niños, salas, pagos, cuaderno, comunicados
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-XL w-full max-h-[90vh] overflow-y-auto">
      <div className="card-spacious">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
          <button onClick={handleCloseModal} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">✕</button>
        </div>
        {/* contenido */}
      </div>
    </div>
  </div>
)}
```

---

#### ConfirmDialog
🟡 **Media prioridad** — `window.confirm()` se usa en niños, salas, pagos, comunicados

```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}
```

Actualmente usa `window.confirm()` nativo — poco profesional para la app.

---

### 6. Formularios

#### FormField
🔴 **Alta prioridad** — El patrón label + input se repite ~80 veces en toda la app

```typescript
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode   // el input/select/textarea
}
```

**Duplicación (se repite ~80 veces):**
```tsx
<div>
  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
    Nombre *
  </label>
  <input type="text" required value={...} onChange={...} className="input" placeholder="..." />
</div>
```

---

#### FormActions
🟡 **Media prioridad** — Botones cancelar/guardar al fondo de modales

```typescript
interface FormActionsProps {
  onCancel: () => void
  submitLabel?: string
  saving?: boolean
  cancelLabel?: string
}
```

**Duplicación (en 5 modales):**
```tsx
<div className="form-actions pt-4 border-t border-[var(--color-warm-100)]">
  <button type="button" onClick={handleCloseModal} className="btn btn-secondary flex-1">Cancelar</button>
  <button type="submit" disabled={saving} className={`btn btn-primary flex-1 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
    {saving ? <LoadingSpinner /> : 'Guardar'}
  </button>
</div>
```

---

#### SearchInput
🟡 **Media prioridad**

```typescript
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}
```

Se usa en niños/page.tsx y Header.tsx con variantes.

---

### 7. Botones

#### IconButton
🟡 **Media prioridad** — Botones de editar/eliminar se repiten en 4+ páginas

```typescript
interface IconButtonProps {
  icon: string           // emoji
  onClick: () => void
  variant?: 'primary' | 'danger' | 'ghost'
  title?: string
}
```

**Duplicación:**
```tsx
// niños, salas, pagos, comunicados
<button onClick={() => handleEdit(item)}
  className="text-[var(--color-primary)] hover:bg-[var(--color-nido-50)] p-2 rounded-lg transition-colors">
  ✏️
</button>
<button onClick={() => handleDelete(item)}
  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
  🗑️
</button>
```

---

#### LoadingButton
🟡 **Media prioridad** — Botones con estado de carga

```typescript
interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary'
  children: ReactNode
}
```

**Duplicación (login, register, asistencia, pagos, cuaderno, comunicados):**
```tsx
<button disabled={saving} className={`btn btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
  {saving ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Guardando...
    </div>
  ) : 'Guardar'}
</button>
```

---

### 8. Navegación

#### TabBar
🟡 **Media prioridad** — Se usa en familia y comunicados

```typescript
interface TabBarProps {
  tabs: Array<{
    key: string
    label: string
    icon?: string
    count?: number
  }>
  activeTab: string
  onChange: (key: string) => void
}
```

**Duplicación:**
```tsx
// familia/page.tsx
<div className="flex gap-2 mb-6 overflow-x-auto">
  <button onClick={() => setActiveTab('cuaderno')}
    className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
      activeTab === 'cuaderno'
        ? 'bg-[var(--color-primary)] text-white'
        : 'bg-white border border-[var(--color-warm-100)] text-[var(--color-text-secondary)]'
    }`}>
    📒 Cuaderno del día
  </button>
  {/* ... más tabs */}
</div>

// comunicados/page.tsx — mismo patrón para filtros all/published/draft
```

---

### 9. Misceláneos

#### EmojiIconBox
🟢 **Baja prioridad** — Cuadrado con emoji + color de fondo

```typescript
interface EmojiIconBoxProps {
  emoji: string
  color: string        // backgroundColor
  size?: 'sm' | 'md' | 'lg'   // 10/12/16 -> w-10/w-12/w-16
}
```

**Duplicación (salas, asistencia, cuaderno, familia, dashboard):**
```tsx
<div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
     style={{ backgroundColor: classroom.color }}>
  {classroom.emoji}
</div>
```

---

#### EmojiPicker (simple)
🟢 **Baja prioridad** — Solo en salas/page.tsx para elegir emoji de sala

```typescript
interface EmojiPickerProps {
  options: string[]
  selected: string
  onChange: (emoji: string) => void
}
```

---

#### ColorPicker (simple)
🟢 **Baja prioridad** — Solo en salas/page.tsx

```typescript
interface ColorPickerProps {
  options: Array<{ name: string; value: string }>
  selected: string
  onChange: (color: string) => void
}
```

---

#### TagList
🟢 **Baja prioridad** — Para alergias/condiciones en niños

```typescript
interface TagListProps {
  items: string[]
  onAdd?: (item: string) => void
  onRemove?: (index: number) => void
  variant?: 'warning' | 'error' | 'info'
  editable?: boolean
  placeholder?: string
}
```

---

#### ActivityItem
🟢 **Baja prioridad** — Dashboard actividad reciente

```typescript
interface ActivityItemProps {
  avatar: { initials: string; color: string } | { emoji: string; color: string }
  title: string
  description: string
  timestamp: string
}
```

---

#### AttendanceStatusButton
🟢 **Baja prioridad** — Específico de asistencia, pero bien encapsulable

```typescript
interface AttendanceStatusButtonProps {
  status: 'present' | 'late' | 'justified' | 'absent'
  selected: boolean
  onClick: () => void
}
```

---

## Utilidades compartidas que también se duplican

Además de componentes, hay **funciones utilitarias** copiadas entre archivos:

| Función | Archivos donde se duplica |
|---------|--------------------------|
| `getInitials(firstName, lastName)` | dashboard, niños, asistencia, cuaderno, pagos, familia, Header, Sidebar |
| `formatCurrency(amount)` | salas, pagos, familia |
| `formatDate(dateString)` | familia, pagos, comunicados |
| `calculateAge(birthDate)` | niños |
| `getStatusBadge(status, dueDate)` | pagos, familia |

**Recomendación:** Crear `src/lib/utils.ts` con estas funciones.

---

## Plan de implementación recomendado

### Fase 1 — Fundación (impacto inmediato, 0 dependencias)
1. **`src/lib/utils.ts`** — Extraer getInitials, formatCurrency, formatDate
2. **`LoadingSpinner`** — 5 min, elimina duplicación en 8 archivos
3. **`AlertMessage`** — 10 min, elimina duplicación en 7 archivos
4. **`EmptyState`** — 10 min, elimina duplicación en 8+ lugares
5. **`Avatar`** — 15 min, elimina duplicación en 6+ archivos

### Fase 2 — Layout y estructura
6. **`PageHeader`** — 15 min, elimina duplicación en 9 páginas
7. **`Modal`** — 20 min, elimina duplicación en 5 modales
8. **`FormField`** — 10 min, simplifica ~80 instancias

### Fase 3 — Componentes compuestos
9. **`StatCard`** — 15 min, dashboard + pagos + asistencia
10. **`StatusBadge`** — 10 min, pagos + familia
11. **`IconButton`** — 10 min, 4+ páginas
12. **`LoadingButton`** / **`FormActions`** — 15 min, 5+ modales
13. **`TabBar`** — 15 min, familia + comunicados
14. **`ClassroomDateFilter`** — 15 min, asistencia + cuaderno
15. **`ConfirmDialog`** — 20 min, reemplaza window.confirm

### Fase 4 — Refinamiento
16. **`DataRow`** — niños + salas
17. **`ActionCard`** — dashboard + más
18. **`SearchInput`** — niños + header
19. **`EmojiIconBox`** — varios
20. **`ClassroomInfoCard`** — asistencia + cuaderno

### Fase 5 — Específicos
21-25. TagList, EmojiPicker, ColorPicker, ActivityItem, AttendanceStatusButton

### Estructura de archivos sugerida
```
src/
├── components/
│   ├── ui/
│   │   ├── Avatar.tsx
│   │   ├── AlertMessage.tsx
│   │   ├── Badge.tsx (StatusBadge)
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Modal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── TabBar.tsx
│   │   ├── IconButton.tsx
│   │   ├── LoadingButton.tsx
│   │   ├── EmojiIconBox.tsx
│   │   └── ProtectedRoute.tsx (ya existe)
│   ├── form/
│   │   ├── FormField.tsx
│   │   ├── FormActions.tsx
│   │   ├── SearchInput.tsx
│   │   ├── TagList.tsx
│   │   ├── EmojiPicker.tsx
│   │   └── ColorPicker.tsx
│   ├── cards/
│   │   ├── StatCard.tsx
│   │   ├── ActionCard.tsx
│   │   ├── DataRow.tsx
│   │   └── ClassroomInfoCard.tsx
│   ├── layout/
│   │   ├── AppLayout.tsx (ya existe)
│   │   ├── PageHeader.tsx
│   │   ├── ClassroomDateFilter.tsx
│   │   ├── Header.tsx (ya existe)
│   │   ├── Sidebar.tsx (ya existe)
│   │   └── MobileBottomNav.tsx (ya existe)
│   └── index.ts (barrel exports)
├── lib/
│   ├── utils.ts (getInitials, formatCurrency, formatDate, calculateAge)
│   └── api.ts (ya existe)
```

### Tiempo estimado total: ~4-6 horas
- Fase 1: ~1 hora
- Fase 2: ~1 hora
- Fase 3: ~1.5 horas
- Fase 4: ~1 hora
- Fase 5: ~0.5-1 hora
