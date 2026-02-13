'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

interface Child {
  _id: string
  firstName: string
  lastName: string
  nickname?: string
  birthDate: string
  gender: 'F' | 'M' | 'X'
  dni?: string
  photo?: string
  shift: string
  enrollmentDate: string
  status: 'active' | 'withdrawn' | 'graduated'
  classroomId: string
  classroom?: {
    name: string
    emoji: string
    color: string
  }
  medical: {
    bloodType?: string
    allergies: string[]
    conditions: string[]
    medications: Array<{
      name: string
      dosage: string
      notes?: string
    }>
    healthInsurance?: {
      provider: string
      planNumber: string
      memberId: string
    }
    pediatrician?: {
      name: string
      phone: string
    }
    notes?: string
  }
  authorizedPickups: Array<{
    name: string
    relationship: string
    dni: string
    phone: string
    photo?: string
  }>
  emergencyContacts: Array<{
    name: string
    relationship: string
    phone: string
    isPrimary: boolean
  }>
  createdAt: string
  updatedAt: string
}

interface Classroom {
  _id: string
  name: string
  emoji: string
  color: string
  shift: string
}

interface CreateChildData {
  firstName: string
  lastName: string
  nickname: string
  birthDate: string
  gender: 'F' | 'M' | 'X'
  dni: string
  classroomId: string
  shift: string
  enrollmentDate: string
  medical: {
    bloodType: string
    allergies: string[]
    conditions: string[]
    medications: Array<{
      name: string
      dosage: string
      notes: string
    }>
    healthInsurance: {
      provider: string
      planNumber: string
      memberId: string
    }
    pediatrician: {
      name: string
      phone: string
    }
    notes: string
  }
  emergencyContacts: Array<{
    name: string
    relationship: string
    phone: string
    isPrimary: boolean
  }>
  authorizedPickups: Array<{
    name: string
    relationship: string
    dni: string
    phone: string
  }>
}

export default function NiñosPage() {
  const { token } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState<CreateChildData>({
    firstName: '',
    lastName: '',
    nickname: '',
    birthDate: '',
    gender: 'F',
    dni: '',
    classroomId: '',
    shift: 'mañana',
    enrollmentDate: new Date().toISOString().split('T')[0],
    medical: {
      bloodType: '',
      allergies: [],
      conditions: [],
      medications: [],
      healthInsurance: {
        provider: '',
        planNumber: '',
        memberId: ''
      },
      pediatrician: {
        name: '',
        phone: ''
      },
      notes: ''
    },
    emergencyContacts: [
      { name: '', relationship: 'madre', phone: '', isPrimary: true },
      { name: '', relationship: 'padre', phone: '', isPrimary: false }
    ],
    authorizedPickups: []
  })

  // Estados para el formulario
  const [newAllergy, setNewAllergy] = useState('')
  const [newCondition, setNewCondition] = useState('')

  useEffect(() => {
    Promise.all([fetchChildren(), fetchClassrooms()])
  }, [])

  const fetchChildren = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/children', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Ups, no pudimos cargar los nenes. Intentá de nuevo 🤔')
      }

      const data = await response.json()
      setChildren(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Ups, no pudimos cargar las salas. Intentá de nuevo 🤔')
      }

      const data = await response.json()
      setClassrooms(data)
    } catch (err: any) {
      console.error('Error al cargar salas:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingChild 
        ? `http://localhost:3001/api/children/${editingChild._id}`
        : 'http://localhost:3001/api/children'
      
      const method = editingChild ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Ups, no pudimos guardar los datos del nene. Intentá de nuevo 🤔')
      }

      const child = await response.json()
      
      if (editingChild) {
        setChildren(prev => prev.map(c => c._id === child._id ? child : c))
      } else {
        setChildren(prev => [...prev, child])
      }

      handleCloseModal()
      
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (child: Child) => {
    setEditingChild(child)
    setFormData({
      firstName: child.firstName,
      lastName: child.lastName,
      nickname: child.nickname || '',
      birthDate: child.birthDate.split('T')[0],
      gender: child.gender,
      dni: child.dni || '',
      classroomId: child.classroomId,
      shift: child.shift,
      enrollmentDate: child.enrollmentDate.split('T')[0],
      medical: {
        bloodType: child.medical.bloodType || '',
        allergies: child.medical.allergies || [],
        conditions: child.medical.conditions || [],
        medications: child.medical.medications || [],
        healthInsurance: child.medical.healthInsurance || {
          provider: '',
          planNumber: '',
          memberId: ''
        },
        pediatrician: child.medical.pediatrician || {
          name: '',
          phone: ''
        },
        notes: child.medical.notes || ''
      },
      emergencyContacts: child.emergencyContacts || [
        { name: '', relationship: 'madre', phone: '', isPrimary: true },
        { name: '', relationship: 'padre', phone: '', isPrimary: false }
      ],
      authorizedPickups: child.authorizedPickups || []
    })
    setShowModal(true)
  }

  const handleDelete = async (child: Child) => {
    if (!window.confirm(`¿Estás segura que querés eliminar a ${child.firstName} ${child.lastName}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/children/${child._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Ups, no pudimos eliminar al nene. Intentá de nuevo 🤔')
      }

      setChildren(prev => prev.filter(c => c._id !== child._id))
      
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingChild(null)
    setFormData({
      firstName: '',
      lastName: '',
      nickname: '',
      birthDate: '',
      gender: 'F',
      dni: '',
      classroomId: '',
      shift: 'mañana',
      enrollmentDate: new Date().toISOString().split('T')[0],
      medical: {
        bloodType: '',
        allergies: [],
        conditions: [],
        medications: [],
        healthInsurance: { provider: '', planNumber: '', memberId: '' },
        pediatrician: { name: '', phone: '' },
        notes: ''
      },
      emergencyContacts: [
        { name: '', relationship: 'madre', phone: '', isPrimary: true },
        { name: '', relationship: 'padre', phone: '', isPrimary: false }
      ],
      authorizedPickups: []
    })
    setError('')
    setNewAllergy('')
    setNewCondition('')
  }

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        medical: {
          ...prev.medical,
          allergies: [...prev.medical.allergies, newAllergy.trim()]
        }
      }))
      setNewAllergy('')
    }
  }

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medical: {
        ...prev.medical,
        allergies: prev.medical.allergies.filter((_, i) => i !== index)
      }
    }))
  }

  const addCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medical: {
          ...prev.medical,
          conditions: [...prev.medical.conditions, newCondition.trim()]
        }
      }))
      setNewCondition('')
    }
  }

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medical: {
        ...prev.medical,
        conditions: prev.medical.conditions.filter((_, i) => i !== index)
      }
    }))
  }

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: '', relationship: 'otro', phone: '', isPrimary: false }
      ]
    }))
  }

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }))
  }

  const addAuthorizedPickup = () => {
    setFormData(prev => ({
      ...prev,
      authorizedPickups: [
        ...prev.authorizedPickups,
        { name: '', relationship: '', dni: '', phone: '' }
      ]
    }))
  }

  const removeAuthorizedPickup = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authorizedPickups: prev.authorizedPickups.filter((_, i) => i !== index)
    }))
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Filtrar niños
  const filteredChildren = children.filter(child => {
    const matchesSearch = 
      child.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (child.nickname && child.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesClassroom = 
      selectedClassroom === 'all' || child.classroomId === selectedClassroom
    
    return matchesSearch && matchesClassroom
  })

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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
                  👶 Administración de Nenes
                </h1>
                <p className="text-[var(--color-text-secondary)]">
                  Administrá los nenes del jardín con sus fichas médicas y datos de contacto.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                <span className="text-lg">+</span>
                Agregar nene
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscá por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="input"
                >
                  <option value="all">Todas las salas</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.emoji} {classroom.name}
                    </option>
                  ))}
                </select>
              </div>
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

          {/* Lista de niños */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChildren.map((child) => (
              <div key={child._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar size-md bg-[var(--color-primary)]">
                      {child.photo ? (
                        <img src={child.photo} alt="Foto" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getInitials(child.firstName, child.lastName)
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        {child.firstName} {child.lastName}
                      </h3>
                      {child.nickname && (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          "{child.nickname}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {child.classroom && (
                          <span 
                            className="badge text-xs"
                            style={{ 
                              backgroundColor: child.classroom.color + '40',
                              color: '#666'
                            }}
                          >
                            {child.classroom.emoji} {child.classroom.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(child)}
                      className="text-[var(--color-primary)] hover:bg-[var(--color-nido-50)] p-2 rounded-lg transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(child)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Edad:</span>
                    <span className="text-sm font-medium">
                      {calculateAge(child.birthDate)} años
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Turno:</span>
                    <span className="text-sm font-medium capitalize">
                      {child.shift}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Sexo:</span>
                    <span className="text-sm font-medium">
                      {child.gender === 'F' ? 'Femenino' : child.gender === 'M' ? 'Masculino' : 'Otro'}
                    </span>
                  </div>
                  
                  {child.medical.allergies.length > 0 && (
                    <div>
                      <span className="text-sm text-[var(--color-text-secondary)]">Alergias:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {child.medical.allergies.slice(0, 3).map((allergy, index) => (
                          <span
                            key={index}
                            className="badge warning text-xs"
                          >
                            {allergy}
                          </span>
                        ))}
                        {child.medical.allergies.length > 3 && (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            +{child.medical.allergies.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--color-warm-100)]">
                  <div className="text-sm text-[var(--color-text-secondary)] mb-2">
                    Contactos de emergencia:
                  </div>
                  {child.emergencyContacts.slice(0, 2).map((contact, index) => (
                    <div key={index} className="text-xs text-[var(--color-text-muted)] mb-1">
                      <strong>{contact.name}</strong> ({contact.relationship}): {contact.phone}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Empty state */}
            {filteredChildren.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👶</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {children.length === 0 ? 'Todavía no hay nenes registrados 👶' : 'No hay nenes que coincidan'}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    {children.length === 0 
                      ? '¡Comenzá registrando el primer nene del jardín!'
                      : 'Intentá cambiar los filtros de búsqueda'
                    }
                  </p>
                  {children.length === 0 && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="btn btn-primary"
                    >
                      <span className="text-lg">+</span>
                      Registrar primer nene
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal para crear/editar niño */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    {editingChild ? 'Editar nene' : 'Nuevo nene'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Datos personales */}
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                      Datos Personales
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="input"
                          placeholder="Ej: Valentina"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="input"
                          placeholder="Ej: López"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Apodo
                        </label>
                        <input
                          type="text"
                          value={formData.nickname}
                          onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                          className="input"
                          placeholder="Ej: Vale"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          DNI
                        </label>
                        <input
                          type="text"
                          value={formData.dni}
                          onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                          className="input"
                          placeholder="Ej: 60123456"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Fecha de nacimiento *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.birthDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                          className="input"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Sexo *
                        </label>
                        <select
                          required
                          value={formData.gender}
                          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'F' | 'M' | 'X' }))}
                          className="input"
                        >
                          <option value="F">Femenino</option>
                          <option value="M">Masculino</option>
                          <option value="X">Otro</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Sala *
                        </label>
                        <select
                          required
                          value={formData.classroomId}
                          onChange={(e) => {
                            const classroom = classrooms.find(c => c._id === e.target.value)
                            setFormData(prev => ({ 
                              ...prev, 
                              classroomId: e.target.value,
                              shift: classroom?.shift || 'mañana'
                            }))
                          }}
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
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Fecha de inscripción *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.enrollmentDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, enrollmentDate: e.target.value }))}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información médica */}
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                      Información Médica
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Grupo sanguíneo
                        </label>
                        <input
                          type="text"
                          value={formData.medical.bloodType}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            medical: { ...prev.medical, bloodType: e.target.value }
                          }))}
                          className="input"
                          placeholder="Ej: A+"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Obra social
                        </label>
                        <input
                          type="text"
                          value={formData.medical.healthInsurance.provider}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            medical: { 
                              ...prev.medical, 
                              healthInsurance: { 
                                ...prev.medical.healthInsurance, 
                                provider: e.target.value 
                              }
                            }
                          }))}
                          className="input"
                          placeholder="Ej: OSDE"
                        />
                      </div>
                    </div>

                    {/* Alergias */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Alergias
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          className="input flex-1"
                          placeholder="Ej: maní, látex, etc."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                        />
                        <button
                          type="button"
                          onClick={addAllergy}
                          className="btn btn-secondary"
                        >
                          Agregar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.medical.allergies.map((allergy, index) => (
                          <span
                            key={index}
                            className="badge warning flex items-center gap-2"
                          >
                            {allergy}
                            <button
                              type="button"
                              onClick={() => removeAllergy(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Condiciones médicas */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Condiciones médicas
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                          className="input flex-1"
                          placeholder="Ej: asma, diabetes, etc."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                        />
                        <button
                          type="button"
                          onClick={addCondition}
                          className="btn btn-secondary"
                        >
                          Agregar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.medical.conditions.map((condition, index) => (
                          <span
                            key={index}
                            className="badge error flex items-center gap-2"
                          >
                            {condition}
                            <button
                              type="button"
                              onClick={() => removeCondition(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Observaciones médicas
                      </label>
                      <textarea
                        rows={3}
                        value={formData.medical.notes}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          medical: { ...prev.medical, notes: e.target.value }
                        }))}
                        className="input"
                        placeholder="Cualquier información médica importante para las seños..."
                      />
                    </div>
                  </div>

                  {/* Contactos de emergencia */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        Contactos de Emergencia
                      </h3>
                      <button
                        type="button"
                        onClick={addEmergencyContact}
                        className="btn btn-secondary text-sm"
                      >
                        + Agregar contacto
                      </button>
                    </div>
                    
                    {formData.emergencyContacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-[var(--color-warm-100)] rounded-lg">
                        <div>
                          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            required
                            value={contact.name}
                            onChange={(e) => {
                              const newContacts = [...formData.emergencyContacts]
                              newContacts[index].name = e.target.value
                              setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                            }}
                            className="input"
                            placeholder="Ej: Laura López"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                            Parentesco *
                          </label>
                          <select
                            required
                            value={contact.relationship}
                            onChange={(e) => {
                              const newContacts = [...formData.emergencyContacts]
                              newContacts[index].relationship = e.target.value
                              setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                            }}
                            className="input"
                          >
                            <option value="">Seleccionar</option>
                            <option value="madre">Madre</option>
                            <option value="padre">Padre</option>
                            <option value="abuelo">Abuelo</option>
                            <option value="abuela">Abuela</option>
                            <option value="tio">Tío</option>
                            <option value="tia">Tía</option>
                            <option value="hermano">Hermano</option>
                            <option value="hermana">Hermana</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                            Teléfono *
                          </label>
                          <input
                            type="tel"
                            required
                            value={contact.phone}
                            onChange={(e) => {
                              const newContacts = [...formData.emergencyContacts]
                              newContacts[index].phone = e.target.value
                              setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                            }}
                            className="input"
                            placeholder="Ej: 2644567890"
                          />
                        </div>
                        
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={contact.isPrimary}
                              onChange={(e) => {
                                const newContacts = [...formData.emergencyContacts]
                                newContacts[index].isPrimary = e.target.checked
                                setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                              }}
                            />
                            <span className="text-sm">Primario</span>
                          </label>
                          {formData.emergencyContacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEmergencyContact(index)}
                              className="btn text-red-500 hover:bg-red-50 p-2"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4 border-t border-[var(--color-warm-100)]">
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
                      {editingChild ? 'Actualizar' : 'Guardar'} nene
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