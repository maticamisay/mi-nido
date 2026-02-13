'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  onClose?: () => void
}

// Iconos básicos como strings (después se pueden reemplazar con un icon library)
const icons = {
  home: '🏠',
  children: '👶',
  classrooms: '🏫',
  attendance: '✅',
  notebook: '📒',
  announcements: '📢',
  payments: '💰',
  messages: '💬',
  calendar: '📅',
  settings: '⚙️',
  logout: '👋'
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: icons.home },
  { name: 'Salas', href: '/salas', icon: icons.classrooms },
  { name: 'Niños', href: '/niños', icon: icons.children },
  { name: 'Asistencia', href: '/asistencia', icon: icons.attendance },
  { name: 'Cuaderno Digital', href: '/cuaderno', icon: icons.notebook },
  { name: 'Comunicados', href: '/comunicados', icon: icons.announcements },
  { name: 'Pagos', href: '/pagos', icon: icons.payments },
  { name: 'Mensajes', href: '/mensajes', icon: icons.messages },
  { name: 'Calendario', href: '/calendario', icon: icons.calendar },
]

const secondaryNavigation = [
  { name: 'Configuración', href: '/configuracion', icon: icons.settings },
]

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-[var(--color-warm-100)] px-6">
      {/* Logo y cerrar en móvil */}
      <div className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🐣</div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-primary)] font-display">
              Mi Nido
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Jardín Rayito de Sol
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Usuario actual */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-nido-50)]">
        <div className="avatar size-md bg-[var(--color-primary)]">
          MG
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--color-text)]">
            María González
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Directora
          </p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-colors
                      ${
                        isActiveLink(item.href)
                          ? 'bg-[var(--color-primary)] text-white shadow-md'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-nido-50)]'
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          
          {/* Navegación secundaria */}
          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-colors
                      ${
                        isActiveLink(item.href)
                          ? 'bg-[var(--color-primary)] text-white shadow-md'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-nido-50)]'
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
              
              {/* Logout */}
              <li>
                <button
                  className="group flex w-full gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-error-text)] hover:bg-red-50 transition-colors"
                >
                  <span className="text-lg">{icons.logout}</span>
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}