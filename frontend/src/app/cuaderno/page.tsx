import AppLayout from '@/components/layout/AppLayout'

export default function CuadernoPage() {
  return (
    <AppLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
            📒 Cuaderno Digital del Día
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Registra las actividades, comidas y descanso de cada niño.
          </p>
        </div>

        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold mb-2">En construcción</h2>
          <p className="text-[var(--color-text-secondary)]">
            Esta página estará disponible próximamente.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}