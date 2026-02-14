'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
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
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              ¡Bienvenido/a!
            </h1>
            <p className="text-muted-foreground text-sm">
              Ingresá a tu cuenta para continuar
            </p>
          </div>

          {/* Form card */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-8 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="bg-[var(--color-nido-50)] border-[var(--color-nido-200)] animate-scale-in">
                    <AlertDescription className="flex items-center gap-3">
                      <span className="text-lg">😕</span>
                      <p className="text-[var(--color-error-text)] text-sm font-medium">{error}</p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" style={{ fontFamily: 'var(--font-display)' }}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" style={{ fontFamily: 'var(--font-display)' }}>
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
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
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-base py-6 bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] hover:from-[var(--color-nido-400)] hover:to-[var(--color-nido-500)] text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" variant="white" />
                      Ingresando...
                    </div>
                  ) : (
                    'Ingresar'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Register link */}
          <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm text-muted-foreground">
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
