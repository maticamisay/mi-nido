import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
            ¡Buen día, María! 🌅
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Aquí tienes un resumen de lo que está pasando en el jardín hoy.
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-menta-100)]">
                <span className="text-xl">👶</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Niños presentes
                </p>
                <p className="text-2xl font-bold text-[var(--color-text)]">
                  28 / 35
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-pollito-100)]">
                <span className="text-xl">📒</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Cuadernos completados
                </p>
                <p className="text-2xl font-bold text-[var(--color-text)]">
                  12 / 28
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-celeste-100)]">
                <span className="text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Pagos pendientes
                </p>
                <p className="text-2xl font-bold text-[var(--color-text)]">
                  7
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-lila-100)]">
                <span className="text-xl">📢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Comunicados nuevos
                </p>
                <p className="text-2xl font-bold text-[var(--color-text)]">
                  2
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secciones principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asistencia de hoy */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                Asistencia de Hoy
              </h3>
              <span className="badge success">80%</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-nido-50)]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🐥</span>
                  <span className="font-medium">Pollitos</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">8 / 10</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">presentes</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-nido-50)]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🐻</span>
                  <span className="font-medium">Ositos</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">12 / 15</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">presentes</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-nido-50)]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⭐</span>
                  <span className="font-medium">Estrellitas</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">8 / 10</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">presentes</p>
                </div>
              </div>
            </div>
            
            <button className="btn btn-secondary w-full mt-4">
              Ver asistencia completa
            </button>
          </div>

          {/* Actividades recientes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                Actividades Recientes
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="avatar size-sm bg-[var(--color-pollito-300)]">
                  VA
                </div>
                <div>
                  <p className="text-sm font-medium">Valentina López</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Cuaderno actualizado - Sala Pollitos
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Hace 15 minutos
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="avatar size-sm bg-[var(--color-menta-300)]">
                  SA
                </div>
                <div>
                  <p className="text-sm font-medium">Santiago Fernández</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Asistencia marcada - Sala Ositos
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Hace 1 hora
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="avatar size-sm bg-[var(--color-primary)]">
                  📢
                </div>
                <div>
                  <p className="text-sm font-medium">Nuevo comunicado</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Reunión de padres - Sala Pollitos
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Hace 2 horas
                  </p>
                </div>
              </div>
            </div>
            
            <button className="btn btn-secondary w-full mt-4">
              Ver todas las actividades
            </button>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Acciones Rápidas
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="card hover:shadow-lg transition-shadow text-center p-6">
              <div className="text-2xl mb-2">📒</div>
              <p className="text-sm font-medium">Crear entrada de cuaderno</p>
            </button>
            
            <button className="card hover:shadow-lg transition-shadow text-center p-6">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm font-medium">Marcar asistencia</p>
            </button>
            
            <button className="card hover:shadow-lg transition-shadow text-center p-6">
              <div className="text-2xl mb-2">📢</div>
              <p className="text-sm font-medium">Nuevo comunicado</p>
            </button>
            
            <button className="card hover:shadow-lg transition-shadow text-center p-6">
              <div className="text-2xl mb-2">👶</div>
              <p className="text-sm font-medium">Agregar niño</p>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
    </ProtectedRoute>
  )
}