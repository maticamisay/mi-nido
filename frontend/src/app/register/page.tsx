'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Datos personales, 2: Datos del jardín
  
  const [formData, setFormData] = useState({
    // Datos personales
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dni: '',
    password: '',
    confirmPassword: '',
    
    // Datos del jardín
    gardenName: '',
    gardenAddress: {
      street: '',
      city: '',
      province: '',
      zip: ''
    },
    
    // Términos
    acceptTerms: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name.startsWith('gardenAddress.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        gardenAddress: {
          ...prev.gardenAddress,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
    
    // Limpiar error cuando el usuario empieza a escribir
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
    const error = validateStep1()
    if (error) {
      setError(error)
      return
    }
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const error = validateStep2()
    if (error) {
      setError(error)
      return
    }
    
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

      // Redireccionar al dashboard
      router.push('/dashboard')
      
    } catch (err: any) {
      setError(err.message || 'Ups, algo salió mal. Intentá de nuevo 🤔')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-primary)] mb-6">
            <span className="text-4xl">🐣</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] font-display mb-2">
            Registrá tu jardín
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Creá tu cuenta y empezá a gestionar tu jardín maternal
          </p>
        </div>

        {/* Indicador de progreso */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-warm-100)] text-[var(--color-text-muted)]'}`}>
            1
          </div>
          <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-warm-100)]'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-warm-100)] text-[var(--color-text-muted)]'}`}>
            2
          </div>
        </div>

        {/* Formulario */}
        <div className="card p-8">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {step === 1 ? (
            // Paso 1: Datos personales
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                  Tus datos personales
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Como directora/propietaria del jardín
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                    Nombre *
                  </label>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="María"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                    Apellido *
                  </label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="González"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Ej: maria@rayitodesol.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                    Teléfono
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Ej: 2644123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                    DNI
                  </label>
                  <input
                    name="dni"
                    type="text"
                    value={formData.dni}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Ej: 30123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Contraseña *
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Elegí una contraseña (min. 6 caracteres)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Confirmar contraseña *
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Repetí tu contraseña"
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary w-full"
              >
                Seguir →
              </button>
            </div>
          ) : (
            // Paso 2: Datos del jardín
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                  Datos del jardín
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Información de tu institución
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Nombre del jardín *
                </label>
                <input
                  name="gardenName"
                  type="text"
                  required
                  value={formData.gardenName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Ej: Jardín Rayito de Sol 🌟"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Dirección
                </label>
                <input
                  name="gardenAddress.street"
                  type="text"
                  value={formData.gardenAddress.street}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Ej: Av. San Martín 1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                    Ciudad
                  </label>
                  <input
                    name="gardenAddress.city"
                    type="text"
                    value={formData.gardenAddress.city}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="San Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                    Provincia
                  </label>
                  <select
                    name="gardenAddress.province"
                    value={formData.gardenAddress.province}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Elegí tu provincia...</option>
                    <option value="Buenos Aires">Buenos Aires</option>
                    <option value="Catamarca">Catamarca</option>
                    <option value="Chaco">Chaco</option>
                    <option value="Chubut">Chubut</option>
                    <option value="Córdoba">Córdoba</option>
                    <option value="Corrientes">Corrientes</option>
                    <option value="Entre Ríos">Entre Ríos</option>
                    <option value="Formosa">Formosa</option>
                    <option value="Jujuy">Jujuy</option>
                    <option value="La Pampa">La Pampa</option>
                    <option value="La Rioja">La Rioja</option>
                    <option value="Mendoza">Mendoza</option>
                    <option value="Misiones">Misiones</option>
                    <option value="Neuquén">Neuquén</option>
                    <option value="Río Negro">Río Negro</option>
                    <option value="Salta">Salta</option>
                    <option value="San Juan">San Juan</option>
                    <option value="San Luis">San Luis</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="Santa Fe">Santa Fe</option>
                    <option value="Santiago del Estero">Santiago del Estero</option>
                    <option value="Tierra del Fuego">Tierra del Fuego</option>
                    <option value="Tucumán">Tucumán</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-[var(--color-primary)] border-[var(--color-warm-300)] rounded focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="acceptTerms" className="text-sm text-[var(--color-text)]">
                  Acepto los{' '}
                  <Link href="/terminos" className="text-[var(--color-primary)] hover:underline">
                    términos y condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacidad" className="text-[var(--color-primary)] hover:underline">
                    política de privacidad
                  </Link>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary flex-1"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`btn btn-primary flex-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando tu jardín...
                    </div>
                  ) : (
                    '¡Crear mi jardín!'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Link a login */}
        <div className="text-center mt-6">
          <p className="text-sm text-[var(--color-text-secondary)]">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}