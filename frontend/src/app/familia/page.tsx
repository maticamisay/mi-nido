'use client'
import API_BASE_URL from '@/config/api'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

interface Child {
  _id: string
  firstName: string
  lastName: string
  nickname?: string
  photo?: string
  classroomId: string
  shift: string
  classroom: {
    _id: string
    name: string
    emoji: string
    color: string
  }
}

interface DailyEntry {
  _id: string
  childId: string
  child?: Child
  date: string
  meals: Array<{
    type: 'desayuno' | 'almuerzo' | 'merienda' | 'colación'
    description: string
    ate: 'bien' | 'poco' | 'nada' | 'no aplica'
    notes?: string
  }>
  nap: {
    slept: boolean
    from: string
    to: string
    quality: 'bien' | 'inquieto' | 'no durmió'
    notes?: string
  }
  hygiene: {
    diaperChanges: number
    bathroomVisits?: number
    notes?: string
  }
  activities: Array<{
    type: 'pedagógica' | 'artística' | 'motriz' | 'musical' | 'libre' | 'paseo'
    description: string
    notes?: string
  }>
  mood: 'contento' | 'tranquilo' | 'inquieto' | 'llorón' | 'cansado'
  observations: string
  photos: Array<{
    url: string
    caption: string
    uploadedAt: string
  }>
  status: 'draft' | 'published'
  publishedAt?: string
  author: {
    firstName: string
    lastName: string
  }
  createdAt: string
  updatedAt: string
}

interface Announcement {
  _id: string
  title: string
  body: string
  scope: 'garden' | 'classroom'
  classroomIds: string[]
  attachments: Array<{
    name: string
    url: string
    type: string
  }>
  requiresAck: boolean
  acknowledgements: Array<{
    userId: string
    ackedAt: string
  }>
  status: 'published'
  publishedAt: string
  author: {
    firstName: string
    lastName: string
  }
  pinned: boolean
  urgent: boolean
  createdAt: string
}

interface Payment {
  _id: string
  childId: string
  child?: Child
  period: string
  concept: string
  description: string
  amount: number
  lateFee: number
  discount: number
  total: number
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived'
  dueDate: string
  paidAmount: number
  paidAt?: string
  paymentMethod?: string
  paymentReference?: string
  createdAt: string
}

export default function FamiliaPage() {
  const { token, user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activeTab, setActiveTab] = useState<'cuaderno' | 'comunicados' | 'pagos'>('cuaderno')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const moodEmojis = {
    contento: '😊',
    tranquilo: '😌',
    inquieto: '😰',
    llorón: '😢',
    cansado: '😴'
  }

  const activityIcons = {
    pedagógica: '📚',
    artística: '🎨',
    motriz: '🏃',
    musical: '🎵',
    libre: '🧸',
    paseo: '🚶'
  }

  const mealIcons = {
    desayuno: '🥞',
    almuerzo: '🍽️',
    merienda: '🍪',
    colación: '🍌'
  }

  useEffect(() => {
    fetchMyChildren()
  }, [])

  useEffect(() => {
    if (selectedChild) {
      if (activeTab === 'cuaderno') {
        fetchDailyEntries()
      } else if (activeTab === 'pagos') {
        fetchPayments()
      }
    }
    
    if (activeTab === 'comunicados') {
      fetchAnnouncements()
    }
  }, [selectedChild, activeTab, selectedDate])

  const fetchMyChildren = async () => {
    setLoading(true)
    try {
      const response = await fetch(API_BASE_URL + '/families/my-children', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Error al cargar tus hijos')
      }

      const data = await response.json()
      setChildren(data)
      
      // Seleccionar el primer hijo por defecto
      if (data.length > 0 && !selectedChild) {
        setSelectedChild(data[0])
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyEntries = async () => {
    if (!selectedChild) return

    try {
      const response = await fetch(
        `/families/daily-entries?childId=${selectedChild._id}&date=${selectedDate}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setDailyEntries(data)
      }

    } catch (err: any) {
      console.error('Error al cargar el cuaderno:', err.message)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/families/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }

    } catch (err: any) {
      console.error('Error al cargar comunicados:', err.message)
    }
  }

  const fetchPayments = async () => {
    if (!selectedChild) return

    try {
      const response = await fetch(
        `/families/payments?childId=${selectedChild._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }

    } catch (err: any) {
      console.error('Error al cargar pagos:', err.message)
    }
  }

  const handleAcknowledge = async (announcementId: string) => {
    try {
      const response = await fetch(`/announcements/${announcementId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const updatedAnnouncement = await response.json()
        setAnnouncements(prev => prev.map(a => a._id === updatedAnnouncement._id ? updatedAnnouncement : a))
      }

    } catch (err: any) {
      console.error('Error al marcar como leído:', err.message)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'pending'
    
    if (isOverdue) {
      return <span className="badge error">⏰ Vencida</span>
    }
    
    switch (status) {
      case 'paid':
        return <span className="badge success">✅ Pagada</span>
      case 'partial':
        return <span className="badge warning">⚡ Parcial</span>
      case 'pending':
        return <span className="badge warning">⏰ Pendiente</span>
      case 'overdue':
        return <span className="badge error">🔴 Vencida</span>
      case 'waived':
        return <span className="badge">🎁 Exonerada</span>
      default:
        return <span className="badge">❓ {status}</span>
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="py-8">
          {/* Header familiar */}
          <div className="mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-nido-400)] flex items-center justify-center text-white text-2xl font-bold">
                  👨‍👩‍👧‍👦
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    ¡Hola, {user?.profile.firstName}! 👋
                  </h1>
                  <p className="text-[var(--color-text-secondary)]">
                    Bienvenido al portal de la familia. Aquí podés ver todo sobre tus niños en el jardín.
                  </p>
                </div>
              </div>

              {/* Selector de hijo */}
              {children.length > 1 && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                    Elegí a tu niño/a:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {children.map((child) => (
                      <button
                        key={child._id}
                        onClick={() => setSelectedChild(child)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                          selectedChild?._id === child._id
                            ? 'border-[var(--color-primary)] bg-[var(--color-nido-50)]'
                            : 'border-[var(--color-warm-100)] hover:border-[var(--color-primary)] bg-white'
                        }`}
                      >
                        <div className="avatar size-md bg-[var(--color-primary)]">
                          {child.photo ? (
                            <img src={child.photo} alt="Foto" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            getInitials(child.firstName, child.lastName)
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[var(--color-text)]">
                            {child.firstName} {child.lastName}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {child.classroom.emoji} Sala {child.classroom.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Contenido principal */}
          {selectedChild ? (
            <div>
              {/* Información del niño seleccionado */}
              <div className="card mb-6 p-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: selectedChild.classroom.color }}
                  >
                    {selectedChild.classroom.emoji}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                      {selectedChild.firstName} {selectedChild.lastName}
                      {selectedChild.nickname && <span className="text-[var(--color-text-secondary)] ml-2">"{selectedChild.nickname}"</span>}
                    </h2>
                    <p className="text-[var(--color-text-secondary)]">
                      Sala {selectedChild.classroom.name} • Turno {selectedChild.shift}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navegación por tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('cuaderno')}
                  className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'cuaderno'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-white border border-[var(--color-warm-100)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  📒 Cuaderno del día
                </button>
                <button
                  onClick={() => setActiveTab('comunicados')}
                  className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'comunicados'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-white border border-[var(--color-warm-100)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  📢 Comunicados
                </button>
                <button
                  onClick={() => setActiveTab('pagos')}
                  className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'pagos'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-white border border-[var(--color-warm-100)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  💰 Estado de cuenta
                </button>
              </div>

              {/* Contenido de los tabs */}
              {activeTab === 'cuaderno' && (
                <div>
                  {/* Selector de fecha */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Fecha del cuaderno:
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="input max-w-48"
                    />
                  </div>

                  {/* Entradas del cuaderno */}
                  {dailyEntries.length === 0 ? (
                    <div className="text-center py-12 card">
                      <div className="text-6xl mb-4">📖</div>
                      <h3 className="text-xl font-semibold mb-2">Sin entradas para esta fecha</h3>
                      <p className="text-[var(--color-text-secondary)]">
                        Las seños aún no registraron actividades para {formatDate(selectedDate)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {dailyEntries.map((entry) => (
                        <div key={entry._id} className="card p-6">
                          {/* Header de la entrada */}
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                                📒 Cuaderno del {formatDate(entry.date)}
                              </h3>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                Por {entry.author.firstName} {entry.author.lastName}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{moodEmojis[entry.mood]}</span>
                              <div className="text-right">
                                <p className="text-sm text-[var(--color-text-secondary)]">Estado de ánimo:</p>
                                <p className="font-medium capitalize">{entry.mood}</p>
                              </div>
                            </div>
                          </div>

                          {/* Comidas */}
                          {entry.meals.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                🍽️ Comidas del día
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {entry.meals.map((meal, index) => (
                                  <div key={index} className="bg-[var(--color-warm-50)] p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">{mealIcons[meal.type]}</span>
                                      <h5 className="font-medium capitalize">{meal.type}</h5>
                                      <span className={`ml-auto px-2 py-1 rounded-lg text-xs font-medium ${
                                        meal.ate === 'bien' ? 'bg-green-100 text-green-800' :
                                        meal.ate === 'poco' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {meal.ate}
                                      </span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                      {meal.description}
                                    </p>
                                    {meal.notes && (
                                      <p className="text-sm italic mt-1 text-[var(--color-text-muted)]">
                                        💬 {meal.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Siesta */}
                          <div className="mb-6">
                            <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                              😴 Descanso
                            </h4>
                            <div className="bg-[var(--color-warm-50)] p-4 rounded-lg">
                              {entry.nap.slept ? (
                                <div className="flex items-center gap-4">
                                  <span className="text-2xl">😴</span>
                                  <div>
                                    <p className="font-medium text-[var(--color-text)]">
                                      Durmió de {entry.nap.from} a {entry.nap.to}
                                    </p>
                                    <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                                      Calidad: {entry.nap.quality}
                                    </p>
                                    {entry.nap.notes && (
                                      <p className="text-sm italic mt-1 text-[var(--color-text-muted)]">
                                        💬 {entry.nap.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <span className="text-2xl">👀</span>
                                  <div>
                                    <p className="font-medium text-[var(--color-text)]">No durmió siesta</p>
                                    {entry.nap.notes && (
                                      <p className="text-sm italic text-[var(--color-text-muted)]">
                                        💬 {entry.nap.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Higiene */}
                          <div className="mb-6">
                            <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                              🧻 Higiene
                            </h4>
                            <div className="bg-[var(--color-warm-50)] p-4 rounded-lg">
                              <div className="flex items-center gap-6">
                                {entry.hygiene.diaperChanges > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">🧷</span>
                                    <span className="text-sm">
                                      {entry.hygiene.diaperChanges} cambio{entry.hygiene.diaperChanges !== 1 ? 's' : ''} de pañal
                                    </span>
                                  </div>
                                )}
                                {entry.hygiene.bathroomVisits && entry.hygiene.bathroomVisits > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">🚽</span>
                                    <span className="text-sm">
                                      {entry.hygiene.bathroomVisits} ida{entry.hygiene.bathroomVisits !== 1 ? 's' : ''} al baño
                                    </span>
                                  </div>
                                )}
                              </div>
                              {entry.hygiene.notes && (
                                <p className="text-sm italic mt-2 text-[var(--color-text-muted)]">
                                  💬 {entry.hygiene.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actividades */}
                          {entry.activities.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                🎨 Actividades
                              </h4>
                              <div className="space-y-3">
                                {entry.activities.map((activity, index) => (
                                  <div key={index} className="bg-[var(--color-warm-50)] p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">{activityIcons[activity.type]}</span>
                                      <h5 className="font-medium capitalize">{activity.type}</h5>
                                    </div>
                                    <p className="text-sm text-[var(--color-text)]">{activity.description}</p>
                                    {activity.notes && (
                                      <p className="text-sm italic mt-1 text-[var(--color-text-muted)]">
                                        💬 {activity.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Observaciones generales */}
                          {entry.observations && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                📝 Observaciones de la seño
                              </h4>
                              <div className="bg-[var(--color-nido-50)] p-4 rounded-lg border-l-4 border-l-[var(--color-primary)]">
                                <p className="text-[var(--color-text)] italic">"{entry.observations}"</p>
                              </div>
                            </div>
                          )}

                          {/* Fotos del día */}
                          {entry.photos.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                📸 Fotos del día
                              </h4>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {entry.photos.map((photo, index) => (
                                  <div key={index} className="bg-white p-2 rounded-lg shadow-sm">
                                    <img 
                                      src={photo.url} 
                                      alt={photo.caption}
                                      className="w-full h-32 object-cover rounded-lg mb-2"
                                    />
                                    {photo.caption && (
                                      <p className="text-sm text-[var(--color-text-secondary)] text-center">
                                        {photo.caption}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comunicados' && (
                <div>
                  {announcements.length === 0 ? (
                    <div className="text-center py-12 card">
                      <div className="text-6xl mb-4">📮</div>
                      <h3 className="text-xl font-semibold mb-2">No hay comunicados nuevos</h3>
                      <p className="text-[var(--color-text-secondary)]">
                        Los comunicados del jardín aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {announcements.map((announcement) => (
                        <div 
                          key={announcement._id} 
                          className={`card ${announcement.pinned ? 'border-l-4 border-l-[var(--color-primary)]' : ''}`}
                        >
                          {/* Header del comunicado */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {announcement.pinned && <span title="Fijado">📌</span>}
                                {announcement.urgent && <span title="Urgente">🚨</span>}
                                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                  {announcement.title}
                                </h2>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                                <span>Por {announcement.author.firstName} {announcement.author.lastName}</span>
                                <span>•</span>
                                <span>{formatDate(announcement.createdAt)}</span>
                                {announcement.requiresAck && (
                                  <>
                                    <span>•</span>
                                    <span>📋 Requiere confirmación</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contenido */}
                          <div className="mb-4">
                            <p className="text-[var(--color-text)] whitespace-pre-wrap">
                              {announcement.body}
                            </p>
                          </div>

                          {/* Adjuntos */}
                          {announcement.attachments.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-[var(--color-text)] mb-2">
                                Adjuntos:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {announcement.attachments.map((attachment, index) => (
                                  <a
                                    key={index}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-[var(--color-warm-50)] rounded-lg text-sm hover:bg-[var(--color-warm-100)]"
                                  >
                                    📎 {attachment.name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Confirmación de lectura */}
                          {announcement.requiresAck && (
                            <div className="border-t border-[var(--color-warm-100)] pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-[var(--color-text-secondary)]">
                                    📋 Este comunicado requiere confirmación de lectura
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAcknowledge(announcement._id)}
                                  className="btn btn-primary text-sm"
                                  disabled={announcement.acknowledgements.some(ack => ack.userId === user?.id)}
                                >
                                  {announcement.acknowledgements.some(ack => ack.userId === user?.id) 
                                    ? '✅ Leído' 
                                    : '📋 Marcar como leído'
                                  }
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pagos' && (
                <div>
                  {payments.length === 0 ? (
                    <div className="text-center py-12 card">
                      <div className="text-6xl mb-4">💰</div>
                      <h3 className="text-xl font-semibold mb-2">No hay registros de pago</h3>
                      <p className="text-[var(--color-text-secondary)]">
                        El estado de cuenta de {selectedChild.firstName} aparecerá aquí
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment._id} className="card">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                                  {payment.description}
                                </h3>
                                {getStatusBadge(payment.status, payment.dueDate)}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                                <span>💰 {formatCurrency(payment.total)}</span>
                                <span>📅 Vence: {formatDate(payment.dueDate)}</span>
                                {payment.paidAmount > 0 && (
                                  <span>✅ Pagado: {formatCurrency(payment.paidAmount)}</span>
                                )}
                                {payment.paidAt && (
                                  <span>📆 {formatDate(payment.paidAt)}</span>
                                )}
                              </div>
                              
                              {payment.paymentMethod && (
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                  Método: {payment.paymentMethod}
                                  {payment.paymentReference && ` • Ref: ${payment.paymentReference}`}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Detalles adicionales si está parcialmente pagado */}
                          {payment.status === 'partial' && (
                            <div className="mt-3 pt-3 border-t border-[var(--color-warm-100)]">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-secondary)]">
                                  Pagado: {formatCurrency(payment.paidAmount)} de {formatCurrency(payment.total)}
                                </span>
                                <span className="text-[var(--color-warning-text)] font-medium">
                                  Resta: {formatCurrency(payment.total - payment.paidAmount)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 card">
              <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-semibold mb-2">Sin niños registrados</h3>
              <p className="text-[var(--color-text-secondary)]">
                Contactá al jardín para agregar a tus hijos a tu cuenta
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}