'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dni: '',
    password: '',
    confirmPassword: '',
    gardenName: '',
    gardenAddress: { street: '', city: '', province: '', zip: '' },
    acceptTerms: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name.startsWith('gardenAddress.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        gardenAddress: { ...prev.gardenAddress, [field]: value }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
    if (error) setError('')
  }

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return 'El nombre es requerido'
    if (!formData.lastName.trim()) return 'El apellido es requerido'
    if (!formData.email.trim()) return 'El email es requerido'
    if (!formData.password) return 'La contraseña es requerida'
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }

  const validateStep2 = () => {
    if (!formData.gardenName.trim()) return 'El nombre del jardín es requerido'
    if (!formData.acceptTerms) return 'Debes aceptar los términos y condiciones'
    return null
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateStep2()
    if (err) { setError(err); return }
    
    setError('')
    setIsLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dni: formData.dni,
        gardenName: formData.gardenName,
        gardenAddress: formData.gardenAddress
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Ups, algo salió mal. Intentá de nuevo 🤔')
    } finally {
      setIsLoading(false)
    }
  }

  const provinces = ['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán']

  return (
    <div className="min-h-screen flex bg-pattern">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-nido-400) 0%, var(--color-lila-600) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[15%] left-[15%] w-28 h-28 rounded-full bg-white/10 animate-float" />
          <div className="absolute top-[55%] right-[10%] w-20 h-20 rounded-full bg-white/10 animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-[20%] left-[30%] w-16 h-16 rounded-full bg-white/10 animate-float" style={{ animationDelay: '0.8s' }} />
        </div>

        <div className="relative z-10 text-center px-12 animate-fade-in-up">
          <div className="text-8xl mb-8 animate-float">🏡</div>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Creá tu Nido
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            En minutos vas a tener todo listo para gestionar tu jardín maternal de forma digital.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-[480px] w-full">
          {/* Mobile header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="lg:hidden inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6" style={{ background: 'linear-gradient(135deg, var(--color-nido-300), var(--color-lila-600))' }}>
              <span className="text-4xl">🏡</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Registrá tu jardín
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Creá tu cuenta y empezá a gestionar
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center mb-8 px-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= 1 ? 'bg-[var(--color-nido-300)] text-white shadow-md' : 'bg-[var(--color-warm-100)] text-[var(--color-text-muted)]'
              }`} style={{ fontFamily: 'var(--font-display)' }}>1</div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] hidden sm:inline" style={{ fontFamily: 'var(--font-display)' }}>Tus datos</span>
            </div>
            <div className={`h-0.5 flex-1 mx-3 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[var(--color-nido-300)]' : 'bg-[var(--color-warm-200)]'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= 2 ? 'bg-[var(--color-nido-300)] text-white shadow-md' : 'bg-[var(--color-warm-100)] text-[var(--color-text-muted)]'
              }`} style={{ fontFamily: 'var(--font-display)' }}>2</div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] hidden sm:inline" style={{ fontFamily: 'var(--font-display)' }}>Tu jardín</span>
            </div>
          </div>

          {/* Form card */}
          <div className="card p-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {error && (
              <div className="p-4 rounded-xl bg-[var(--color-nido-50)] border border-[var(--color-nido-200)] mb-6 animate-scale-in">
                <div className="flex items-center gap-3">
                  <span className="text-lg">😕</span>
                  <p className="text-[var(--color-error-text)] text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                    Tus datos personales
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Como directora/propietaria del jardín
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Nombre *</label>
                    <input name="firstName" type="text" required value={formData.firstName} onChange={handleInputChange} className="input" placeholder="María" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Apellido *</label>
                    <input name="lastName" type="text" required value={formData.lastName} onChange={handleInputChange} className="input" placeholder="González" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Email *</label>
                  <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="input" placeholder="maria@mijardin.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Teléfono</label>
                    <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="input" placeholder="2644123456" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>DNI</label>
                    <input name="dni" type="text" value={formData.dni} onChange={handleInputChange} className="input" placeholder="30123456" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Contraseña *</label>
                  <input name="password" type="password" required value={formData.password} onChange={handleInputChange} className="input" placeholder="Mínimo 6 caracteres" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Confirmar contraseña *</label>
                  <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange} className="input" placeholder="Repetí tu contraseña" />
                </div>

                <button type="button" onClick={handleNext} className="btn btn-primary w-full text-base py-3.5">
                  Siguiente →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                    Datos del jardín
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Información de tu institución
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Nombre del jardín *</label>
                  <input name="gardenName" type="text" required value={formData.gardenName} onChange={handleInputChange} className="input" placeholder="Ej: Jardín Rayito de Sol 🌟" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Dirección</label>
                  <input name="gardenAddress.street" type="text" value={formData.gardenAddress.street} onChange={handleInputChange} className="input" placeholder="Av. San Martín 1234" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Ciudad</label>
                    <input name="gardenAddress.city" type="text" value={formData.gardenAddress.city} onChange={handleInputChange} className="input" placeholder="San Juan" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Provincia</label>
                    <select name="gardenAddress.province" value={formData.gardenAddress.province} onChange={handleInputChange} className="input">
                      <option value="">Seleccionar...</option>
                      {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-warm-50)]">
                  <input id="acceptTerms" name="acceptTerms" type="checkbox" checked={formData.acceptTerms} onChange={handleInputChange} className="mt-0.5 h-4 w-4 rounded border-[var(--color-warm-300)]" />
                  <label htmlFor="acceptTerms" className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Acepto los{' '}
                    <Link href="/terminos" className="text-[var(--color-nido-500)] hover:underline font-medium">términos y condiciones</Link>{' '}
                    y la{' '}
                    <Link href="/privacidad" className="text-[var(--color-nido-500)] hover:underline font-medium">política de privacidad</Link>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary flex-1 py-3.5">
                    ← Atrás
                  </button>
                  <button type="submit" disabled={isLoading} className={`btn btn-primary flex-1 py-3.5 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" variant="white" />
                        Creando...
                      </div>
                    ) : (
                      '¡Crear mi jardín! 🎉'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Login link */}
          <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm text-[var(--color-text-secondary)]">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="text-[var(--color-nido-500)] font-bold hover:text-[var(--color-nido-600)] transition-colors">
                Ingresar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
