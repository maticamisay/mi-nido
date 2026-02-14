'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'
import DataRow from '@/components/ui/DataRow'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AlertMessage from '@/components/ui/AlertMessage'
import { formatCurrency } from '@/lib/utils'

interface Classroom {
  _id: string
  name: string
  emoji: string
  color: string
  ageRange: {
    from: number
    to: number
  }
  shift: string
  capacity: number
  teacherIds: string[]
  fee: {
    amount: number
    dueDay: number
    lateFeePercent: number
  }
  createdAt: string
  updatedAt: string
}

interface CreateClassroomData {
  name: string
  emoji: string
  color: string
  ageRange: {
    from: number
    to: number
  }
  shift: string
  capacity: number
  fee: {
    amount: number
    dueDay: number
    lateFeePercent: number
  }
}

export default function SalasPage() {
  const { token, gardenId } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  
  const [formData, setFormData] = useState<CreateClassroomData>({
    name: '',
    emoji: '🐥',
    color: '#FDE8A0',
    ageRange: {
      from: 1,
      to: 2
    },
    shift: 'mañana',
    capacity: 20,
    fee: {
      amount: 45000,
      dueDay: 10,
      lateFeePercent: 10
    }
  })

  const colorOptions = [
    { name: 'Amarillo Pollito', value: '#FDE8A0', preview: 'bg-[#FDE8A0]' },
    { name: 'Verde Menta', value: '#B8E0D2', preview: 'bg-[#B8E0D2]' },
    { name: 'Celeste Bebé', value: '#B5D5E8', preview: 'bg-[#B5D5E8]' },
    { name: 'Lila Pastel', value: '#D4B5D6', preview: 'bg-[#D4B5D6]' },
    { name: 'Melocotón', value: '#FADBC8', preview: 'bg-[#FADBC8]' },
  ]

  const emojiOptions = ['🐥', '🐻', '⭐', '🦋', '🌈', '🌸', '🐰', '🦊', '🐼', '🌞']
  const shiftOptions = ['mañana', 'tarde', 'jornada completa']

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const fetchClassrooms = async () => {
    try {
      const response = await apiFetch('/classrooms', { token, gardenId })

      if (!response.ok) {
        throw new Error('Ups, no pudimos cargar las salas. Intentá de nuevo 🤔')
      }

      const result = await response.json()
      setClassrooms(result.classrooms || result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingClassroom 
        ? `/classrooms/${editingClassroom._id}`
        : '/classrooms'
      
      const method = editingClassroom ? 'PUT' : 'POST'

      const response = await apiFetch(url, {
        method,
        token,
        gardenId,
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Ups, no pudimos guardar la sala. Intentá de nuevo 🤔')
      }

      const classroom = await response.json()
      
      if (editingClassroom) {
        setClassrooms(prev => prev.map(c => c._id === classroom._id ? classroom : c))
      } else {
        setClassrooms(prev => [...prev, classroom])
      }

      handleCloseModal()
      
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom)
    setFormData({
      name: classroom.name,
      emoji: classroom.emoji,
      color: classroom.color,
      ageRange: classroom.ageRange,
      shift: classroom.shift,
      capacity: classroom.capacity,
      fee: classroom.fee
    })
    setShowModal(true)
  }

  const handleDelete = async (classroom: Classroom) => {
    if (!window.confirm(`¿Estás segura que querés eliminar la sala "${classroom.name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await apiFetch(`/classrooms/${classroom._id}`, {
        method: 'DELETE',
        token,
        gardenId
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Ups, no pudimos eliminar la sala. Intentá de nuevo 🤔')
      }

      setClassrooms(prev => prev.filter(c => c._id !== classroom._id))
      
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClassroom(null)
    setFormData({
      name: '',
      emoji: '🐥',
      color: '#FDE8A0',
      ageRange: { from: 1, to: 2 },
      shift: 'mañana',
      capacity: 20,
      fee: { amount: 45000, dueDay: 10, lateFeePercent: 10 }
    })
    setError('')
  }

  if (loading) {
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
          <div className="page-header">
            <div className="flex items-center justify-between">
              <div>
                <h1>🏫 Gestión de Salas</h1>
                <p>Administrá las salas del jardín, sus seños y configuraciones.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                <span className="text-lg">+</span>
                Nueva Sala
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <AlertMessage type="error" message={error} />
          )}

          {/* Lista de salas */}
          <div className="grid-cards">
            {classrooms.map((classroom) => (
              <div key={classroom._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: classroom.color }}
                    >
                      {classroom.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                        {classroom.shift}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(classroom)}
                      className="text-[var(--color-primary)] hover:bg-[var(--color-nido-50)] p-2 rounded-lg transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(classroom)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <DataRow label="Edades:" value={`${classroom.ageRange.from} - ${classroom.ageRange.to} años`} />
                  <DataRow label="Capacidad:" value={`${classroom.capacity} nenes`} />
                  <DataRow label="Cuota:" value={formatCurrency(classroom.fee.amount)} />
                  <DataRow label="Vence el:" value={`${classroom.fee.dueDay} de cada mes`} />
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--color-warm-100)]">
                  <DataRow label="Seños asignadas:" value={classroom.teacherIds.length || 0} />
                </div>
              </div>
            ))}
            
            {/* Empty state */}
            {classrooms.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏫</div>
                  <h3 className="text-xl font-semibold mb-2">Todavía no hay salas 🏫</h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    ¡Creá la primera sala de tu jardín para empezar!
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                  >
                    <span className="text-lg">+</span>
                    Crear Primera Sala
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal para crear/editar sala */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="card-spacious">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    {editingClassroom ? 'Editar Sala' : 'Nueva Sala'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="form-group">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Nombre de la sala
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input"
                      placeholder="Ej: Sala Pollitos 🐥"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Emoji
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                            className={`p-2 rounded-lg border-2 text-xl ${
                              formData.emoji === emoji 
                                ? 'border-[var(--color-primary)] bg-[var(--color-nido-50)]' 
                                : 'border-[var(--color-warm-100)] hover:border-[var(--color-warm-300)]'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Color
                      </label>
                      <div className="space-y-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 ${
                              formData.color === color.value 
                                ? 'border-[var(--color-primary)]' 
                                : 'border-[var(--color-warm-100)] hover:border-[var(--color-warm-300)]'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg ${color.preview}`} />
                            <span className="text-xs">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Turno
                    </label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                      className="input"
                    >
                      {shiftOptions.map((shift) => (
                        <option key={shift} value={shift} className="capitalize">
                          {shift}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Edad desde
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        required
                        value={formData.ageRange.from}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          ageRange: { ...prev.ageRange, from: Number(e.target.value) }
                        }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Edad hasta
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        required
                        value={formData.ageRange.to}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          ageRange: { ...prev.ageRange, to: Number(e.target.value) }
                        }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Capacidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Cuota mensual ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={formData.fee.amount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          fee: { ...prev.fee, amount: Number(e.target.value) }
                        }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Vence el día
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={formData.fee.dueDay}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          fee: { ...prev.fee, dueDay: Number(e.target.value) }
                        }))}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Recargo por mora (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      required
                      value={formData.fee.lateFeePercent}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        fee: { ...prev.fee, lateFeePercent: Number(e.target.value) }
                      }))}
                      className="input"
                    />
                  </div>

                  <div className="form-actions pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                    >
                      {editingClassroom ? 'Actualizar' : 'Crear'} Sala
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  )
}