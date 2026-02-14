'use client'

import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
        <div>
          <div className="page-header">
            <h1>⋯ Más Opciones</h1>
            <p>Accedé a todas las funciones de Mi Nido.</p>
          </div>

          <div className="grid-cards">
            {moreOptions.map((option) => (
              <Link key={option.name} href={option.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{option.name}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="mt-12">
            <CardContent className="p-6">
              <div className="flex items-start gap-5">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">¿Necesitás ayuda?</h3>
                  <p className="text-muted-foreground mb-4">
                    Si tenés dudas sobre cómo usar Mi Nido, no dudes en contactarnos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline">📖 Guía de uso</Button>
                    <Button variant="outline">📞 Contactar soporte</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
