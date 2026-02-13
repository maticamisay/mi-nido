'use client'

import { ReactNode, useState } from 'react'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import Header from './Header'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Sidebar para desktop */}
      <div className="hidden tablet-up lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      {/* Sidebar móvil overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="lg:pl-72">
        {/* Header con menú hamburguesa para móvil */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Contenido */}
        <main className="pb-16 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation para móvil */}
      <div className="tablet-up:hidden">
        <MobileBottomNav />
      </div>
    </div>
  )
}