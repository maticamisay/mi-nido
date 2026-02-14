'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarProps {
  onClose?: () => void
}

const getNavigationByRole = (role?: string) => {
  if (role === 'family') {
    return [
      { name: 'Portal Familiar', href: '/familia', icon: '👨‍👩‍👧‍👦' },
      { name: 'Cuaderno', href: '/cuaderno', icon: '📒' },
      { name: 'Comunicados', href: '/comunicados', icon: '📢' },
      { name: 'Estado de Cuenta', href: '/pagos', icon: '💰' },
    ]
  }
  
  return [
    { name: 'Inicio', href: '/dashboard', icon: '🏠' },
    { name: 'Salas', href: '/salas', icon: '🏫' },
    { name: 'Nenes', href: '/niños', icon: '👶' },
    { name: 'Asistencia', href: '/asistencia', icon: '✅' },
    { name: 'Cuaderno', href: '/cuaderno', icon: '📒' },
    { name: 'Comunicados', href: '/comunicados', icon: '📢' },
    { name: 'Pagos', href: '/pagos', icon: '💰' },
  ]
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getInitials = () => {
    if (!user) return 'US'
    return `${(user.profile.firstName || '').charAt(0)}${(user.profile.lastName || '').charAt(0)}`.toUpperCase()
  }

  const primaryGarden = user?.gardens?.[0]
  const navigation = getNavigationByRole(primaryGarden?.role)

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    if (href === '/familia') return pathname === '/familia' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-white border-r border-[var(--color-warm-100)] px-5 py-6">
      {/* Logo */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, var(--color-nido-300), var(--color-nido-400))' }}>
            🐣
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-nido-500)]" style={{ fontFamily: 'var(--font-display)' }}>
              Mi Nido
            </h1>
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              {primaryGarden?.name || 'Mi Jardín'}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-warm-50)] transition-colors">
            ✕
          </button>
        )}
      </div>

      {/* User card */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[var(--color-nido-50)] to-[var(--color-melocoton-100)]">
        <div className="avatar size-md" style={{ background: 'linear-gradient(135deg, var(--color-nido-300), var(--color-nido-500))' }}>
          {user?.profile.avatar ? (
            <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            getInitials()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[var(--color-text)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {user ? `${user.profile.firstName} ${user.profile.lastName}` : 'Usuario'}
          </p>
          <p className="text-[10px] font-medium text-[var(--color-text-secondary)] capitalize uppercase tracking-wider">
            {primaryGarden?.role || 'Usuario'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-6">
          <li>
            <ul role="list" className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      group flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200
                      ${isActiveLink(item.href)
                        ? 'bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] text-white shadow-md'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-warm-50)]'
                      }
                    `}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <span className="text-lg w-7 text-center">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          
          {/* Bottom section */}
          <li className="mt-auto space-y-1">
            <Link
              href="/configuracion"
              onClick={onClose}
              className={`group flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActiveLink('/configuracion')
                  ? 'bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] text-white shadow-md'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-warm-50)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-lg w-7 text-center">⚙️</span>
              Ajustes
            </Link>
            
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-error-text)] hover:bg-[var(--color-nido-50)] transition-all duration-200"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-lg w-7 text-center">👋</span>
              Salir
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
