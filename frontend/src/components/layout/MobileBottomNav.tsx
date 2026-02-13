'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const bottomNavigation = [
  { name: 'Inicio', href: '/dashboard', icon: '🏠' },
  { name: 'Cuaderno', href: '/cuaderno', icon: '📒' },
  { name: 'Comunicados', href: '/comunicados', icon: '📢' },
  { name: 'Pagos', href: '/pagos', icon: '💰' },
  { name: 'Más', href: '/mas', icon: '⋯' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    if (href === '/mas') {
      // "Más" es activo para todas las páginas que no están en el bottom nav
      const mainPaths = ['/dashboard', '/cuaderno', '/comunicados', '/pagos']
      return !mainPaths.some(path => pathname.startsWith(path)) && pathname !== '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-warm-100)] bg-white">
      <div className="grid grid-cols-5">
        {bottomNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-colors
              ${
                isActiveLink(item.href)
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }
            `}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium leading-none">{item.name}</span>
            
            {/* Indicador activo */}
            {isActiveLink(item.href) && (
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--color-primary)] rounded-b-full" />
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}