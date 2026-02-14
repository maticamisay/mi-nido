'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AlertMessage from '@/components/ui/AlertMessage'
import { getInitials } from '@/lib/utils'

interface Child {
  _id: string
  firstName: string
  lastName: string
  nickname?: string
  photo?: string
  classroomId: string
  shift: string
  classroom?: {
    name: string
    emoji: string
    color: string
  }
}

interface Classroom {
  _id: string
  name: string
  emoji: string
  color: string
  shift: string
}

interface DailyEntry {
  _id?: string
  childId: string
  child?: Child
  date: string
  classroomId: string
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
  authorId: string
  seenBy: Array<{
    userId: string
    seenAt: string
  }>
  createdAt: string
  updatedAt: string
}

interface CreateDailyEntryData {
  childId: string
  date: string
  meals: Array<{
    type: 'desayuno' | 'almuerzo' | 'merienda' | 'colación'
    description: string
    ate: 'bien' | 'poco' | 'nada' | 'no aplica'
    notes: string
  }>
  nap: {
    slept: boolean
    from: string
    to: string
    quality: 'bien' | 'inquieto' | 'no durmió'
    notes: string
  }
  hygiene: {
    diaperChanges: number
    bathroomVisits: number
    notes: string
  }
  activities: Array<{
    type: 'pedagógica' | 'artística' | 'motriz' | 'musical' | 'libre' | 'paseo'
    description: string
    notes: string
  }>
  mood: 'contento' | 'tranquilo' | 'inquieto' | 'llorón' | 'cansado'
  observations: string
  status: 'draft' | 'published'
}

export default function CuadernoPage() {
  const { token, gardenId } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [formData, setFormData] = useState<CreateDailyEntryData>({
    childId: '',
    date: new Date().toISOString().split('T')[0],
    meals: [],
    nap: {
      slept: false,
      from: '',
      to: '',
      quality: 'bien',
      notes: ''
    },
    hygiene: {
      diaperChanges: 0,
      bathroomVisits: 0,
      notes: ''
    },
    activities: [],
    mood: 'contento',
    observations: '',
    status: 'draft'
  })

  const moodEmojis = {
    contento: '😊',
    tranquilo: '😌',
    inquieto: '😰',
    llorón: '😢',
    cansado: '😴'
  }

  const activityTypes = [
    { value: 'pedagógica', label: 'Pedagógica', emoji: '📚' },
    { value: 'artística', label: 'Artística', emoji: '🎨' },
    { value: 'motriz', label: 'Motriz', emoji: '🏃' },
    { value: 'musical', label: 'Musical', emoji: '🎵' },
    { value: 'libre', label: 'Juego libre', emoji: '🧸' },
    { value: 'paseo', label: 'Paseo', emoji: '🚶' }
  ]

  const mealTypes = [
    { value: 'desayuno', label: 'Desayuno', emoji: '🥞' },
    { value: 'almuerzo', label: 'Almuerzo', emoji: '🍽️' },
    { value: 'merienda', label: 'Merienda', emoji: '🍪' },
    { value: 'colación', label: 'Colación', emoji: '🍌' }
  ]

  useEffect(() => {
    fetchClassrooms()
  }, [])

  useEffect(() => {
    if (selectedClassroom) {
      fetchChildrenAndEntries()
    }
  }, [selectedClassroom, selectedDate])

  const fetchClassrooms = async () => {
    try {
      const response = await apiFetch('/classrooms', { token, gardenId })

      if (!response.ok) {
        throw new Error('Error al cargar las salas')
      }

      const result = await response.json()
      const data = result.classrooms || result
      setClassrooms(data)
      
      // Seleccionar la primera sala por defecto
      if (data.length > 0 && !selectedClassroom) {
        setSelectedClassroom(data[0]._id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchChildrenAndEntries = async () => {
    if (!selectedClassroom) return

    setLoading(true)
    setError('')

    try {
      // Obtener niños de la sala
      const childrenResponse = await apiFetch(`/children?classroomId=${selectedClassroom}`, { token, gardenId })

      if (!childrenResponse.ok) {
        throw new Error('Error al cargar los niños')
      }

      const childrenResult = await childrenResponse.json()
      setChildren(childrenResult.children || childrenResult)

      // Obtener entradas del cuaderno para esta fecha y sala
      const entriesResponse = await apiFetch(
        `/daily-entries?classroomId=${selectedClassroom}&date=${selectedDate}`,
        { token, gardenId }
      )

      if (entriesResponse.ok) {
        const entriesResult = await entriesResponse.json()
        setDailyEntries(entriesResult.entries || entriesResult)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEntry = (child: Child) => {
    setSelectedChild(child)
    setEditingEntry(null)
    setFormData({
      childId: child._id,
      date: selectedDate,
      meals: [],
      nap: {
        slept: false,
        from: '',
        to: '',
        quality: 'bien',
        notes: ''
      },
      hygiene: {
        diaperChanges: 0,
        bathroomVisits: 0,
        notes: ''
      },
      activities: [],
      mood: 'contento',
      observations: '',
      status: 'draft'
    })
    setShowModal(true)
  }

  const handleEditEntry = (entry: DailyEntry) => {
    setSelectedChild(children.find(c => c._id === entry.childId) || null)
    setEditingEntry(entry)
    setFormData({
      childId: entry.childId,
      date: entry.date.split('T')[0],
      meals: entry.meals.map(m => ({ ...m, notes: m.notes || '' })),
      nap: {
        ...entry.nap,
        notes: entry.nap.notes || ''
      },
      hygiene: {
        ...entry.hygiene,
        bathroomVisits: entry.hygiene.bathroomVisits || 0,
        notes: entry.hygiene.notes || ''
      },
      activities: entry.activities.map(a => ({ ...a, notes: a.notes || '' })),
      mood: entry.mood,
      observations: entry.observations,
      status: entry.status
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Backend uses POST/PUT /api/daily-entries (createOrUpdate by childId+date)
      const method = editingEntry ? 'PUT' : 'POST'

      const response = await apiFetch('/daily-entries', {
        method,
        token,
        gardenId,
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar la entrada del cuaderno')
      }

      const savedEntry = await response.json()
      
      if (editingEntry) {
        setDailyEntries(prev => prev.map(e => e._id === savedEntry._id ? savedEntry : e))
      } else {
        setDailyEntries(prev => [...prev, savedEntry])
      }

      handleCloseModal()
      setSuccessMessage(`Cuaderno ${editingEntry ? 'actualizado' : 'guardado'} correctamente ✅`)
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedChild(null)
    setEditingEntry(null)
    setError('')
  }

  const addMeal = () => {
    setFormData(prev => ({
      ...prev,
      meals: [...prev.meals, { type: 'desayuno', description: '', ate: 'bien', notes: '' }]
    }))
  }

  const removeMeal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index)
    }))
  }

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, { type: 'pedagógica', description: '', notes: '' }]
    }))
  }

  const removeActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }))
  }

  const getEntryForChild = (childId: string) => {
    return dailyEntries.find(entry => entry.childId === childId)
  }

  const currentClassroom = classrooms.find(c => c._id === selectedClassroom)

  if (loading && !currentClassroom) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div>
            <LoadingSpinner />
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          {/* Header */}
          <PageHeader
            title="📒 Cuaderno Digital del Día ⭐"
            description="Registrá las actividades, comidas, descanso y estado de ánimo de cada niño."
          >
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-5 mb-6">
              <div className="sm:w-48">
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Sala
                </label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="input"
                >
                  <option value="">Seleccionar sala</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.emoji} {classroom.name} ({classroom.shift})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </PageHeader>

          {/* Mensajes */}
          {error && (
            <AlertMessage type="error" message={error} />
          )}

          {successMessage && (
            <AlertMessage type="success" message={successMessage} />
          )}

          {/* Contenido principal */}
          {selectedClassroom && currentClassroom && (
            <div>
              {/* Información de la sala */}
              <div className="card page-section">
                <div className="flex items-center gap-5 mb-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: currentClassroom.color }}
                  >
                    {currentClassroom.emoji}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                      Cuaderno - Sala {currentClassroom.name}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] capitalize">
                      {new Date(selectedDate).toLocaleDateString('es-AR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de niños */}
              {loading ? (
                <LoadingSpinner />
              ) : children.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👶</div>
                  <h3 className="text-xl font-semibold mb-2">No hay niños en esta sala</h3>
                  <p className="text-[var(--color-text-secondary)]">
                    Agregá niños a la sala para poder crear entradas del cuaderno
                  </p>
                </div>
              ) : (
                <div className="grid-cards">
                  {children.map((child) => {
                    const entry = getEntryForChild(child._id)

                    return (
                      <div key={child._id} className="card hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="avatar size-md bg-[var(--color-primary)]">
                            {child.photo ? (
                              <img src={child.photo} alt="Foto" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              getInitials(child.firstName, child.lastName)
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[var(--color-text)]">
                              {child.firstName} {child.lastName}
                            </h3>
                            {child.nickname && (
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                "{child.nickname}"
                              </p>
                            )}
                          </div>
                          {entry && (
                            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              entry.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status === 'published' ? 'Publicado' : 'Borrador'}
                            </div>
                          )}
                        </div>

                        {entry ? (
                          <div className="space-y-4">
                            {/* Resumen de la entrada */}
                            <div className="space-y-2">
                              {entry.mood && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-[var(--color-text-secondary)]">Estado:</span>
                                  <span className="text-lg">{moodEmojis[entry.mood]}</span>
                                  <span className="text-sm capitalize">{entry.mood}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--color-text-secondary)]">Comidas:</span>
                                <span className="text-sm">{entry.meals.length} registradas</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--color-text-secondary)]">Siesta:</span>
                                <span className="text-sm">{entry.nap.slept ? '😴 Durmió' : '👀 No durmió'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--color-text-secondary)]">Actividades:</span>
                                <span className="text-sm">{entry.activities.length} realizadas</span>
                              </div>
                            </div>

                            {entry.observations && (
                              <div>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-1">Observaciones:</p>
                                <p className="text-sm italic">"{entry.observations}"</p>
                              </div>
                            )}

                            <div className="flex gap-2 pt-3 border-t border-[var(--color-warm-100)]">
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="btn btn-secondary flex-1 text-sm"
                              >
                                ✏️ Editar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <div className="text-3xl mb-2">📝</div>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                              Sin entrada del día
                            </p>
                            <button
                              onClick={() => handleCreateEntry(child)}
                              className="btn btn-primary text-sm"
                            >
                              + Crear entrada
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Estado inicial */}
          {!selectedClassroom && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📒</div>
              <h3 className="text-xl font-semibold mb-2">Seleccioná una sala y fecha</h3>
              <p className="text-[var(--color-text-secondary)]">
                Elegí una sala y fecha para ver el cuaderno digital del día
              </p>
            </div>
          )}
        </div>

        {/* Modal para crear/editar entrada */}
        <Dialog open={showModal && !!selectedChild} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
          <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-3">
                <div className="avatar size-md bg-[var(--color-nido-primary)]">
                  {selectedChild?.photo ? (
                    <img src={selectedChild.photo} alt="Foto" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedChild ? getInitials(selectedChild.firstName, selectedChild.lastName) : ''
                  )}
                </div>
                <div>
                  <div>{selectedChild?.firstName} {selectedChild?.lastName}</div>
                  <p className="text-sm text-muted-foreground font-normal">
                    Cuaderno del {new Date(selectedDate).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selectedChild && (

                <form onSubmit={handleSubmit} className="form-group">
                  {/* Estado de ánimo */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                      Estado de ánimo
                    </label>
                    <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                      {Object.entries(moodEmojis).map(([mood, emoji]) => (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, mood: mood as any }))}
                          className={`p-3 rounded-lg border-2 text-center transition-colors ${
                            formData.mood === mood
                              ? 'border-[var(--color-primary)] bg-[var(--color-nido-50)]'
                              : 'border-[var(--color-warm-100)] hover:border-[var(--color-warm-300)]'
                          }`}
                        >
                          <div className="text-2xl mb-1">{emoji}</div>
                          <div className="text-xs capitalize">{mood}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comidas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-[var(--color-text)]">
                        Comidas
                      </label>
                      <button
                        type="button"
                        onClick={addMeal}
                        className="btn btn-secondary text-sm"
                      >
                        + Agregar comida
                      </button>
                    </div>
                    
                    {formData.meals.map((meal, index) => (
                      <div key={index} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 p-3 border border-[var(--color-warm-100)] rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                            Tipo
                          </label>
                          <select
                            value={meal.type}
                            onChange={(e) => {
                              const newMeals = [...formData.meals]
                              newMeals[index].type = e.target.value as any
                              setFormData(prev => ({ ...prev, meals: newMeals }))
                            }}
                            className="input text-sm"
                          >
                            {mealTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.emoji} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={meal.description}
                            onChange={(e) => {
                              const newMeals = [...formData.meals]
                              newMeals[index].description = e.target.value
                              setFormData(prev => ({ ...prev, meals: newMeals }))
                            }}
                            className="input text-sm"
                            placeholder="Ej: Sopa de verduras"
                          />
                        </div>
                        
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              Comió
                            </label>
                            <select
                              value={meal.ate}
                              onChange={(e) => {
                                const newMeals = [...formData.meals]
                                newMeals[index].ate = e.target.value as any
                                setFormData(prev => ({ ...prev, meals: newMeals }))
                              }}
                              className="input text-sm"
                            >
                              <option value="bien">Bien</option>
                              <option value="poco">Poco</option>
                              <option value="nada">Nada</option>
                              <option value="no aplica">No aplica</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMeal(index)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Siesta */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                      Siesta
                    </label>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={formData.nap.slept}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              nap: { ...prev.nap, slept: e.target.checked }
                            }))}
                          />
                          <span className="text-sm">Durmió</span>
                        </label>
                      </div>
                      
                      {formData.nap.slept && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              Desde
                            </label>
                            <input
                              type="time"
                              value={formData.nap.from}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                nap: { ...prev.nap, from: e.target.value }
                              }))}
                              className="input text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              Hasta
                            </label>
                            <input
                              type="time"
                              value={formData.nap.to}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                nap: { ...prev.nap, to: e.target.value }
                              }))}
                              className="input text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              Calidad
                            </label>
                            <select
                              value={formData.nap.quality}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                nap: { ...prev.nap, quality: e.target.value as any }
                              }))}
                              className="input text-sm"
                            >
                              <option value="bien">Bien</option>
                              <option value="inquieto">Inquieto</option>
                              <option value="no durmió">No durmió</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Higiene */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                      Higiene
                    </label>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                          Cambios de pañal
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.hygiene.diaperChanges}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            hygiene: { ...prev.hygiene, diaperChanges: Number(e.target.value) }
                          }))}
                          className="input text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                          Visitas al baño
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.hygiene.bathroomVisits}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            hygiene: { ...prev.hygiene, bathroomVisits: Number(e.target.value) }
                          }))}
                          className="input text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actividades */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-[var(--color-text)]">
                        Actividades
                      </label>
                      <button
                        type="button"
                        onClick={addActivity}
                        className="btn btn-secondary text-sm"
                      >
                        + Agregar actividad
                      </button>
                    </div>
                    
                    {formData.activities.map((activity, index) => (
                      <div key={index} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 p-3 border border-[var(--color-warm-100)] rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                            Tipo
                          </label>
                          <select
                            value={activity.type}
                            onChange={(e) => {
                              const newActivities = [...formData.activities]
                              newActivities[index].type = e.target.value as any
                              setFormData(prev => ({ ...prev, activities: newActivities }))
                            }}
                            className="input text-sm"
                          >
                            {activityTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.emoji} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={activity.description}
                            onChange={(e) => {
                              const newActivities = [...formData.activities]
                              newActivities[index].description = e.target.value
                              setFormData(prev => ({ ...prev, activities: newActivities }))
                            }}
                            className="input text-sm"
                            placeholder="Ej: Pintamos con témperas"
                          />
                        </div>
                        
                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            onClick={() => removeActivity(index)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Observaciones del día
                    </label>
                    <textarea
                      rows={4}
                      value={formData.observations}
                      onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                      className="input"
                      placeholder="Escribe aquí cómo estuvo el niño hoy, qué hizo, cómo se sintió..."
                    />
                  </div>

                  {/* Estado de publicación */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Estado
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={formData.status === 'draft'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        />
                        <span className="text-sm">📝 Borrador (solo visible para seños)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="status"
                          value="published"
                          checked={formData.status === 'published'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        />
                        <span className="text-sm">📤 Publicar (visible para la familia)</span>
                      </label>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="form-actions pt-4 border-t border-[var(--color-warm-100)]">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`btn btn-primary flex-1 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" variant="white" />
                          Guardando...
                        </div>
                      ) : (
                        editingEntry ? 'Actualizar entrada' : 'Guardar entrada'
                      )}
                    </button>
                  </div>
                </form>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}