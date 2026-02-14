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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

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
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Registrá tu jardín
            </h1>
            <p className="text-muted-foreground text-sm">
              Creá tu cuenta y empezá a gestionar
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center mb-8 px-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= 1 ? 'bg-[var(--color-nido-300)] text-white shadow-md' : 'bg-muted text-muted-foreground'
              }`} style={{ fontFamily: 'var(--font-display)' }}>1</div>
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline" style={{ fontFamily: 'var(--font-display)' }}>Tus datos</span>
            </div>
            <div className={`h-0.5 flex-1 mx-3 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[var(--color-nido-300)]' : 'bg-border'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= 2 ? 'bg-[var(--color-nido-300)] text-white shadow-md' : 'bg-muted text-muted-foreground'
              }`} style={{ fontFamily: 'var(--font-display)' }}>2</div>
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline" style={{ fontFamily: 'var(--font-display)' }}>Tu jardín</span>
            </div>
          </div>

          {/* Form card */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-8 sm:p-10">
              {error && (
                <Alert className="bg-[var(--color-nido-50)] border-[var(--color-nido-200)] mb-6 animate-scale-in">
                  <AlertDescription className="flex items-center gap-3">
                    <span className="text-lg">😕</span>
                    <p className="text-[var(--color-error-text)] text-sm font-medium">{error}</p>
                  </AlertDescription>
                </Alert>
              )}

              {step === 1 ? (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      Tus datos personales
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Como directora/propietaria del jardín
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ fontFamily: 'var(--font-display)' }}>Nombre *</Label>
                      <Input name="firstName" type="text" required value={formData.firstName} onChange={handleInputChange} placeholder="María" />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontFamily: 'var(--font-display)' }}>Apellido *</Label>
                      <Input name="lastName" type="text" required value={formData.lastName} onChange={handleInputChange} placeholder="González" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label style={{ fontFamily: 'var(--font-display)' }}>Email *</Label>
                    <Input name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="maria@mijardin.com" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ fontFamily: 'var(--font-display)' }}>Teléfono</Label>
                      <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="2644123456" />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontFamily: 'var(--font-display)' }}>DNI</Label>
                      <Input name="dni" type="text" value={formData.dni} onChange={handleInputChange} placeholder="30123456" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label style={{ fontFamily: 'var(--font-display)' }}>Contraseña *</Label>
                    <Input name="password" type="password" required value={formData.password} onChange={handleInputChange} placeholder="Mínimo 6 caracteres" />
                  </div>

                  <div className="space-y-2">
                    <Label style={{ fontFamily: 'var(--font-display)' }}>Confirmar contraseña *</Label>
                    <Input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange} placeholder="Repetí tu contraseña" />
                  </div>

                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-6 bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] hover:from-[var(--color-nido-400)] hover:to-[var(--color-nido-500)] text-white"
                  >
                    Siguiente →
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      Datos del jardín
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Información de tu institución
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label style={{ fontFamily: 'var(--font-display)' }}>Nombre del jardín *</Label>
                    <Input name="gardenName" type="text" required value={formData.gardenName} onChange={handleInputChange} placeholder="Ej: Jardín Rayito de Sol 🌟" />
                  </div>

                  <div className="space-y-2">
                    <Label style={{ fontFamily: 'var(--font-display)' }}>Dirección</Label>
                    <Input name="gardenAddress.street" type="text" value={formData.gardenAddress.street} onChange={handleInputChange} placeholder="Av. San Martín 1234" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ fontFamily: 'var(--font-display)' }}>Ciudad</Label>
                      <Input name="gardenAddress.city" type="text" value={formData.gardenAddress.city} onChange={handleInputChange} placeholder="San Juan" />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontFamily: 'var(--font-display)' }}>Provincia</Label>
                      <Select value={formData.gardenAddress.province} onValueChange={(value) => setFormData(prev => ({ ...prev, gardenAddress: { ...prev.gardenAddress, province: value } }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                    <input id="acceptTerms" name="acceptTerms" type="checkbox" checked={formData.acceptTerms} onChange={handleInputChange} className="mt-0.5 h-4 w-4 rounded border-border" />
                    <label htmlFor="acceptTerms" className="text-sm text-muted-foreground leading-relaxed">
                      Acepto los{' '}
                      <Link href="/terminos" className="text-[var(--color-nido-500)] hover:underline font-medium">términos y condiciones</Link>{' '}
                      y la{' '}
                      <Link href="/privacidad" className="text-[var(--color-nido-500)] hover:underline font-medium">política de privacidad</Link>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 py-6">
                      ← Atrás
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-6 bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] hover:from-[var(--color-nido-400)] hover:to-[var(--color-nido-500)] text-white"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" variant="white" />
                          Creando...
                        </div>
                      ) : (
                        '¡Crear mi jardín! 🎉'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Login link */}
          <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm text-muted-foreground">
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
