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
}

interface Classroom {
  _id: string
  name: string
  emoji: string
  color: string
  shift: string
}

interface AttendanceRecord {
  childId: string
  status: 'present' | 'absent' | 'justified' | 'late'
  justification?: string
  arrivedAt?: string
  leftAt?: string
  retiredBy?: string
  notes?: string
}

interface Attendance {
  _id?: string
  date: string
  classroomId: string
  records: AttendanceRecord[]
  recordedBy: string
}

export default function AsistenciaPage() {
  const { token } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [selectedClassroom, setSelectedClassroom] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchClassrooms()
  }, [])

  useEffect(() => {
    if (selectedClassroom) {
      fetchChildrenAndAttendance()
    }
  }, [selectedClassroom, selectedDate])

  const fetchClassrooms = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar las salas')
      }

      const data = await response.json()
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

  const fetchChildrenAndAttendance = async () => {
    if (!selectedClassroom) return

    setLoading(true)
    setError('')

    try {
      // Obtener niños de la sala
      const childrenResponse = await fetch(`/children?classroomId=${selectedClassroom}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!childrenResponse.ok) {
        throw new Error('Error al cargar los niños')
      }

      const childrenData = await childrenResponse.json()
      setChildren(childrenData)

      // Obtener asistencia existente para esta fecha y sala
      const attendanceResponse = await fetch(
        `/attendance?classroomId=${selectedClassroom}&date=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        if (attendanceData) {
          setAttendance(attendanceData)
        } else {
          // Crear asistencia inicial con todos como ausentes
          initializeAttendance(childrenData)
        }
      } else {
        // Crear asistencia inicial
        initializeAttendance(childrenData)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const initializeAttendance = (childrenData: Child[]) => {
    const initialRecords: AttendanceRecord[] = childrenData.map(child => ({
      childId: child._id,
      status: 'absent' as const,
      arrivedAt: '',
      leftAt: '',
      retiredBy: '',
      notes: ''
    }))

    setAttendance({
      date: selectedDate,
      classroomId: selectedClassroom,
      records: initialRecords,
      recordedBy: '' // Se completa al guardar
    })
  }

  const updateAttendanceRecord = (childId: string, field: keyof AttendanceRecord, value: any) => {
    if (!attendance) return

    const updatedRecords = attendance.records.map(record => 
      record.childId === childId 
        ? { ...record, [field]: value }
        : record
    )

    setAttendance({
      ...attendance,
      records: updatedRecords
    })
  }

  const handleStatusChange = (childId: string, status: AttendanceRecord['status']) => {
    updateAttendanceRecord(childId, 'status', status)
    
    // Si marca como presente, agregar hora actual
    if (status === 'present' || status === 'late') {
      const now = new Date()
      const timeString = now.toTimeString().slice(0, 5) // HH:MM
      updateAttendanceRecord(childId, 'arrivedAt', timeString)
    } else {
      updateAttendanceRecord(childId, 'arrivedAt', '')
    }
  }

  const saveAttendance = async () => {
    if (!attendance) return

    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const method = attendance._id ? 'PUT' : 'POST'
      const url = attendance._id 
        ? `/attendance/${attendance._id}`
        : API_BASE_URL + '/attendance'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendance)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar la asistencia')
      }

      const savedAttendance = await response.json()
      setAttendance(savedAttendance)
      setSuccessMessage('Asistencia guardada correctamente ✅')
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'justified':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'Presente'
      case 'late':
        return 'Tardanza'
      case 'justified':
        return 'Justificado'
      case 'absent':
        return 'Ausente'
      default:
        return 'Sin marcar'
    }
  }

  const getAttendanceStats = () => {
    if (!attendance) return { present: 0, absent: 0, late: 0, justified: 0, total: 0 }

    const stats = attendance.records.reduce((acc, record) => {
      acc[record.status]++
      acc.total++
      return acc
    }, { present: 0, absent: 0, late: 0, justified: 0, total: 0 })

    return stats
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const currentClassroom = classrooms.find(c => c._id === selectedClassroom)
  const stats = getAttendanceStats()

  if (loading && !currentClassroom) {
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
                  ✅ Asistencia Diaria
                </h1>
                <p className="text-[var(--color-text-secondary)]">
                  Registrá la asistencia diaria de los niños por sala.
                </p>
              </div>
              
              {attendance && (
                <button
                  onClick={saveAttendance}
                  disabled={saving}
                  className={`btn btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : (
                    <>
                      💾 Guardar Asistencia
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          </div>

          {/* Mensajes */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <p className="text-green-700 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Contenido principal */}
          {selectedClassroom && currentClassroom && (
            <div>
              {/* Estadísticas */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-[var(--color-text)]">{stats.total}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Total niños</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Presentes</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Tardanzas</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.justified}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Justificados</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Ausentes</div>
                </div>
              </div>

              {/* Información de la sala */}
              <div className="card mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: currentClassroom.color }}
                  >
                    {currentClassroom.emoji}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                      Sala {currentClassroom.name}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] capitalize">
                      Turno {currentClassroom.shift} • {new Date(selectedDate).toLocaleDateString('es-AR', { 
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
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
                </div>
              ) : children.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👶</div>
                  <h3 className="text-xl font-semibold mb-2">No hay niños en esta sala</h3>
                  <p className="text-[var(--color-text-secondary)]">
                    Agregá niños a la sala para poder tomar asistencia
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {children.map((child) => {
                    const record = attendance?.records.find(r => r.childId === child._id)
                    if (!record) return null

                    return (
                      <div key={child._id} className="card">
                        <div className="flex items-center gap-4 mb-4">
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
                          <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${getStatusColor(record.status)}`}>
                            {getStatusText(record.status)}
                          </div>
                        </div>

                        {/* Botones de estado */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                          <button
                            onClick={() => handleStatusChange(child._id, 'present')}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              record.status === 'present'
                                ? 'bg-green-100 border-green-300 text-green-800'
                                : 'border-[var(--color-warm-100)] hover:border-green-300 hover:bg-green-50'
                            }`}
                          >
                            ✅ Presente
                          </button>
                          <button
                            onClick={() => handleStatusChange(child._id, 'late')}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              record.status === 'late'
                                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                                : 'border-[var(--color-warm-100)] hover:border-yellow-300 hover:bg-yellow-50'
                            }`}
                          >
                            ⏰ Tardanza
                          </button>
                          <button
                            onClick={() => handleStatusChange(child._id, 'justified')}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              record.status === 'justified'
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'border-[var(--color-warm-100)] hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            📄 Justificado
                          </button>
                          <button
                            onClick={() => handleStatusChange(child._id, 'absent')}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              record.status === 'absent'
                                ? 'bg-red-100 border-red-300 text-red-800'
                                : 'border-[var(--color-warm-100)] hover:border-red-300 hover:bg-red-50'
                            }`}
                          >
                            ❌ Ausente
                          </button>
                        </div>

                        {/* Campos adicionales */}
                        {(record.status === 'present' || record.status === 'late') && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                                Hora de llegada
                              </label>
                              <input
                                type="time"
                                value={record.arrivedAt || ''}
                                onChange={(e) => updateAttendanceRecord(child._id, 'arrivedAt', e.target.value)}
                                className="input"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                                Hora de retiro
                              </label>
                              <input
                                type="time"
                                value={record.leftAt || ''}
                                onChange={(e) => updateAttendanceRecord(child._id, 'leftAt', e.target.value)}
                                className="input"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                                Retirado por
                              </label>
                              <input
                                type="text"
                                value={record.retiredBy || ''}
                                onChange={(e) => updateAttendanceRecord(child._id, 'retiredBy', e.target.value)}
                                className="input"
                                placeholder="Ej: Mamá, Papá, Abuela..."
                              />
                            </div>
                          </div>
                        )}

                        {record.status === 'justified' && (
                          <div className="mb-4">
                            <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                              Motivo de justificación
                            </label>
                            <input
                              type="text"
                              value={record.justification || ''}
                              onChange={(e) => updateAttendanceRecord(child._id, 'justification', e.target.value)}
                              className="input"
                              placeholder="Ej: Enfermo, viaje, cita médica..."
                            />
                          </div>
                        )}

                        {/* Notas */}
                        <div>
                          <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                            Observaciones
                          </label>
                          <textarea
                            rows={2}
                            value={record.notes || ''}
                            onChange={(e) => updateAttendanceRecord(child._id, 'notes', e.target.value)}
                            className="input"
                            placeholder="Notas adicionales sobre el niño hoy..."
                          />
                        </div>
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
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">Seleccioná una sala</h3>
              <p className="text-[var(--color-text-secondary)]">
                Elegí una sala y fecha para comenzar a tomar asistencia
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}