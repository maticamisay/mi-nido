import AppLayout from '@/components/layout/AppLayout'

export default function ComunicadosPage() {
  return (
    <AppLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
            📢 Comunicados
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Enviá comunicados y noticias a las familias.
          </p>
        </div>

        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold mb-2">¡Próximamente! 📬</h2>
          <p className="text-[var(--color-text-secondary)]">
            Estamos preparando esta sección con mucho cariño.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}