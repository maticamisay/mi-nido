import AppLayout from '@/components/layout/AppLayout'

export default function PagosPage() {
  return (
    <AppLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
            💰 Gestión de Pagos
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Control de cuotas y pagos de las familias.
          </p>
        </div>

        {/* Resumen de pagos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center p-6">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-2xl font-bold text-[var(--color-text)]">$1,250,000</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Pagos del mes</p>
          </div>
          
          <div className="card text-center p-6">
            <div className="text-3xl mb-2">⏰</div>
            <p className="text-2xl font-bold text-[var(--color-warning-text)]">7</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Cuotas pendientes</p>
          </div>
          
          <div className="card text-center p-6">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-2xl font-bold text-[var(--color-text)]">92%</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Tasa de cobranza</p>
          </div>
        </div>

        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold mb-2">En construcción</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            El sistema de gestión de pagos estará disponible próximamente.
          </p>
          <button className="btn btn-primary">
            Notificarme cuando esté listo
          </button>
        </div>
      </div>
    </AppLayout>
  )
}