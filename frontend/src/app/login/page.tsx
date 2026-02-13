'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      
      // Redireccionar al dashboard
      router.push('/dashboard')
      
    } catch (err: any) {
      setError(err.message || 'Ups, algo salió mal. Intentá de nuevo 🤔')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-primary)] mb-6">
            <span className="text-4xl">🐣</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] font-display mb-2">
            ¡Buen día! Te damos la bienvenida a Mi Nido 🐣
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Ingresá a tu cuenta para seguir
          </p>
        </div>

        {/* Formulario */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                placeholder="Ej: directora@rayitodesol.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="input"
                placeholder="Ingresá tu contraseña"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[var(--color-primary)] border-[var(--color-warm-300)] rounded focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-[var(--color-text)]">
                  Recordarme
                </label>
              </div>

              <Link 
                href="/forgot-password" 
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                ¿Te olvidaste la contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`btn btn-primary w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Ingresando...
                </div>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        {/* Link a registro */}
        <div className="text-center mt-6">
          <p className="text-sm text-[var(--color-text-secondary)]">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
              Registrá tu jardín
            </Link>
          </p>
        </div>

        {/* Credenciales de prueba */}
        <div className="card mt-6 p-4 bg-[var(--color-warm-50)] border-dashed">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">
            👨‍💻 Credenciales de prueba:
          </h3>
          <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <p><strong>Directora:</strong> directora@rayitodesol.com / 123456</p>
            <p><strong>Docente:</strong> seño.ana@rayitodesol.com / 123456</p>
            <p><strong>Familia:</strong> mama.sofia@gmail.com / 123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}