'use client'

import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import Link from 'next/link'

const moreOptions = [
  { name: 'Salas', href: '/salas', icon: '🏫', description: 'Administrar salas y seños' },
  { name: 'Nenes', href: '/niños', icon: '👶', description: 'Fichas y legajos de los nenes' },
  { name: 'Asistencia', href: '/asistencia', icon: '✅', description: 'Controlar la asistencia diaria' },
  { name: 'Mensajes', href: '/mensajes', icon: '💬', description: 'Comunicación con familias' },
  { name: 'Calendario', href: '/calendario', icon: '📅', description: 'Eventos y actividades' },
  { name: 'Ajustes', href: '/configuracion', icon: '⚙️', description: 'Configuración del jardín' },
]

export default function MasPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="py-10">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              ⋯ Más Opciones
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Accedé a todas las funciones de Mi Nido.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {moreOptions.map((option) => (
              <Link
                key={option.name}
                href={option.href}
                className="card hover:shadow-lg transition-shadow p-6 text-center group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {option.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--color-text)]">
                  {option.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {option.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Sección de ayuda */}
          <div className="mt-12 card p-6">
            <div className="flex items-start gap-5">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--color-text)]">
                  ¿Necesitás ayuda?
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-4">
                  Si tenés dudas sobre cómo usar Mi Nido, no dudes en contactarnos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="btn btn-secondary">
                    📖 Guía de uso
                  </button>
                  <button className="btn btn-secondary">
                    📞 Contactar soporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
