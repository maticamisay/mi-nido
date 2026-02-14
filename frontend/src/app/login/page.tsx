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
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Ups, algo salió mal. Intentá de nuevo 🤔')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-pattern">
      {/* Left decorative panel — desktop only */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-nido-300) 0%, var(--color-nido-500) 100%)' }}>
        {/* Floating decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[10%] w-32 h-32 rounded-full bg-white/10 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[60%] right-[15%] w-24 h-24 rounded-full bg-white/10 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-[15%] left-[25%] w-20 h-20 rounded-full bg-white/10 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[30%] right-[30%] w-16 h-16 rounded-full bg-white/10 animate-float" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10 text-center px-12 animate-fade-in-up">
          <div className="text-8xl mb-8 animate-float">🐣</div>
          <h1 className="text-4xl font-bold text-white mb-4 font-[var(--font-display)]" style={{ fontFamily: 'var(--font-display)' }}>
            Mi Nido
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            Todo tu jardín maternal en un solo lugar. Gestión simple, cálida y profesional.
          </p>
          
          <div className="mt-12 flex items-center justify-center gap-7">
            {['📒', '✅', '💰', '📢'].map((emoji, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl backdrop-blur-sm"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-[420px] w-full">
          {/* Mobile logo */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="lg:hidden inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6" style={{ background: 'linear-gradient(135deg, var(--color-nido-300), var(--color-nido-400))' }}>
              <span className="text-4xl">🐣</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              ¡Bienvenido/a!
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Ingresá a tu cuenta para continuar
            </p>
          </div>

          {/* Form card */}
          <div className="card p-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-[var(--color-nido-50)] border border-[var(--color-nido-200)] animate-scale-in">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">😕</span>
                    <p className="text-[var(--color-error-text)] text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
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
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-[var(--color-warm-300)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors">
                    Recordarme
                  </span>
                </label>

                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[var(--color-nido-500)] hover:text-[var(--color-nido-600)] font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`btn btn-primary w-full text-base py-3.5 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ingresando...
                  </div>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>

          {/* Register link */}
          <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm text-[var(--color-text-secondary)]">
              ¿No tenés cuenta?{' '}
              <Link href="/register" className="text-[var(--color-nido-500)] font-bold hover:text-[var(--color-nido-600)] transition-colors">
                Registrá tu jardín
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
