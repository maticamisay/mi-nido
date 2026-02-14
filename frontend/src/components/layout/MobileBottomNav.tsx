'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isFamily = user?.gardens?.[0]?.role === 'family'

  const bottomNavigation = isFamily ? [
    { name: 'Familia', href: '/familia', icon: '👨‍👩‍👧‍👦' },
    { name: 'Cuaderno', href: '/cuaderno', icon: '📒' },
    { name: 'Comunicados', href: '/comunicados', icon: '📢' },
    { name: 'Pagos', href: '/pagos', icon: '💰' },
    { name: 'Más', href: '/mas', icon: '⋯' },
  ] : [
    { name: 'Inicio', href: '/dashboard', icon: '🏠' },
    { name: 'Cuaderno', href: '/cuaderno', icon: '📒' },
    { name: 'Comunicados', href: '/comunicados', icon: '📢' },
    { name: 'Pagos', href: '/pagos', icon: '💰' },
    { name: 'Más', href: '/mas', icon: '⋯' },
  ]

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    if (href === '/familia') return pathname === '/familia' || pathname === '/'
    if (href === '/mas') {
      const mainPaths = isFamily 
        ? ['/familia', '/cuaderno', '/comunicados', '/pagos']
        : ['/dashboard', '/cuaderno', '/comunicados', '/pagos']
      return !mainPaths.some(path => pathname.startsWith(path)) && pathname !== '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-warm-100)] bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="grid grid-cols-5">
        {bottomNavigation.map((item) => {
          const active = isActiveLink(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center py-2.5 px-1.5 min-h-[62px] transition-all duration-200
                ${active
                  ? 'text-[var(--color-nido-500)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }
              `}
            >
              <span className={`text-xl mb-0.5 transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                {item.name}
              </span>
              
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full" style={{ background: 'linear-gradient(90deg, var(--color-nido-300), var(--color-nido-400))' }} />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
