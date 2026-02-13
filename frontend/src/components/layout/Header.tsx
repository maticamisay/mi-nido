'use client'

import { useState } from 'react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [notificationsCount] = useState(3) // Mock

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--color-warm-100)] bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Menú hamburguesa - solo móvil */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-[var(--color-text-secondary)] lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Abrir menú</span>
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Logo móvil */}
      <div className="flex items-center gap-2 lg:hidden">
        <span className="text-xl">🐣</span>
        <h1 className="font-bold text-[var(--color-primary)] font-display">
          Mi Nido
        </h1>
      </div>

      {/* Espaciador */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Buscador - desktop */}
        <div className="hidden lg:flex lg:flex-1">
          <div className="relative w-full max-w-lg">
            <input
              type="search"
              placeholder="Buscar nenes, familias..."
              className="input w-full pl-10 text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Acciones de la derecha */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notificaciones */}
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            <span className="sr-only">Ver notificaciones</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                {notificationsCount}
              </span>
            )}
          </button>

          {/* Separador */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[var(--color-warm-200)]" />

          {/* Perfil - solo desktop */}
          <div className="hidden lg:block">
            <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--color-nido-50)] transition-colors">
              <div className="avatar size-sm bg-[var(--color-primary)]">
                MG
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  María González
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Directora
                </p>
              </div>
              <svg
                className="h-4 w-4 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}