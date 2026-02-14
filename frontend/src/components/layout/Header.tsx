'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [notificationsCount] = useState(3)
  const { user } = useAuth()

  const getInitials = () => {
    if (!user) return 'US'
    return `${(user.profile.firstName || '').charAt(0)}${(user.profile.lastName || '').charAt(0)}`.toUpperCase()
  }

  const primaryGarden = user?.gardens?.[0]

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--color-warm-100)] bg-white/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] lg:hidden transition-colors"
        onClick={onMenuClick}
      >
        <span className="sr-only">Abrir menú</span>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <span className="text-xl">🐣</span>
        <h1 className="font-bold text-[var(--color-nido-500)]" style={{ fontFamily: 'var(--font-display)' }}>Mi Nido</h1>
      </div>

      {/* Spacer and right actions */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search — desktop */}
        <div className="hidden lg:flex lg:flex-1 items-center">
          <div className="relative w-full max-w-md">
            <input
              type="search"
              placeholder="Buscar nenes, familias..."
              className="input w-full pl-10 text-sm bg-[var(--color-warm-50)] border-transparent focus:bg-white focus:border-[var(--color-nido-200)]"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-x-3 ml-auto lg:gap-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="relative p-2.5 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-warm-50)] transition-all"
          >
            <span className="sr-only">Ver notificaciones</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-nido-300), var(--color-nido-500))' }}>
                {notificationsCount}
              </span>
            )}
          </button>

          {/* Profile — desktop */}
          <div className="hidden lg:block">
            <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--color-warm-50)] transition-all">
              <div className="avatar size-sm" style={{ background: 'linear-gradient(135deg, var(--color-nido-300), var(--color-nido-500))' }}>
                {getInitials()}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {user ? `${user.profile.firstName} ${user.profile.lastName}` : 'Usuario'}
                </p>
                <p className="text-[10px] font-medium text-[var(--color-text-secondary)] capitalize">
                  {primaryGarden?.role || 'Usuario'}
                </p>
              </div>
              <svg className="h-4 w-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
