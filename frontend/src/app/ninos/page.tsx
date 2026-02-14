'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import SearchInput from '@/components/ui/SearchInput'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AlertMessage from '@/components/ui/AlertMessage'
import EmptyState from '@/components/ui/EmptyState'
import NidoAvatar from '@/components/ui/NidoAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'
import DataRow from '@/components/ui/DataRow'

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
      notes?: string
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
  const { token, gardenId } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [childToDelete, setChildToDelete] = useState<Child | null>(null)
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

  const [newAllergy, setNewAllergy] = useState('')
  const [newCondition, setNewCondition] = useState('')

  useEffect(() => {
    if (token && gardenId) Promise.all([fetchChildren(), fetchClassrooms()])
  }, [token, gardenId])

  const fetchChildren = async () => {
    try {
      const response = await apiFetch('/children', { token, gardenId })
      if (!response.ok) throw new Error('Ups, no pudimos cargar los nenes. Intentá de nuevo 🤔')
      const result = await response.json()
      setChildren(result.children || result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const response = await apiFetch('/classrooms', { token, gardenId })
      if (!response.ok) throw new Error('Ups, no pudimos cargar las salas. Intentá de nuevo 🤔')
      const result = await response.json()
      setClassrooms(result.classrooms || result)
    } catch (err: any) {
      console.error('Error al cargar salas:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const url = editingChild ? `/children/${editingChild._id}` : '/children'
      const method = editingChild ? 'PUT' : 'POST'
      const response = await apiFetch(url, { method, token, gardenId, body: formData })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Ups, no pudimos guardar los datos del nene. Intentá de nuevo 🤔')
      }
      const data = await response.json()
      const child = data.child || data
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
        healthInsurance: child.medical.healthInsurance || { provider: '', planNumber: '', memberId: '' },
        pediatrician: child.medical.pediatrician || { name: '', phone: '' },
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
    try {
      const response = await apiFetch(`/children/${child._id}`, { method: 'DELETE', token, gardenId })
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
      firstName: '', lastName: '', nickname: '', birthDate: '', gender: 'F', dni: '',
      classroomId: '', shift: 'mañana', enrollmentDate: new Date().toISOString().split('T')[0],
      medical: {
        bloodType: '', allergies: [], conditions: [], medications: [],
        healthInsurance: { provider: '', planNumber: '', memberId: '' },
        pediatrician: { name: '', phone: '' }, notes: ''
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
        medical: { ...prev.medical, allergies: [...prev.medical.allergies, newAllergy.trim()] }
      }))
      setNewAllergy('')
    }
  }

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medical: { ...prev.medical, allergies: prev.medical.allergies.filter((_, i) => i !== index) }
    }))
  }

  const addCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medical: { ...prev.medical, conditions: [...prev.medical.conditions, newCondition.trim()] }
      }))
      setNewCondition('')
    }
  }

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medical: { ...prev.medical, conditions: prev.medical.conditions.filter((_, i) => i !== index) }
    }))
  }

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', relationship: 'otro', phone: '', isPrimary: false }]
    }))
  }

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }))
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const filteredChildren = children.filter(child => {
    const matchesSearch = 
      child.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (child.nickname && child.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesClassroom = selectedClassroom === 'all' || child.classroomId === selectedClassroom
    return matchesSearch && matchesClassroom
  })

  if (loading) {
    return (
      <ProtectedRoute><AppLayout><div><LoadingSpinner /></div></AppLayout></ProtectedRoute>
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
                <h1>👶 Administración de Nenes</h1>
                <p>Administrá los nenes del jardín con sus fichas médicas y datos de contacto.</p>
              </div>
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                <span className="text-lg">+</span>
                Agregar nene
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscá por nombre..."
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
          {error && <AlertMessage type="error" message={error} />}

          {/* Lista de niños */}
          <div className="grid-cards">
            {filteredChildren.map((child) => (
              <div key={child._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <NidoAvatar name={`${child.firstName} ${child.lastName}`} photo={child.photo} size="md" />
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        {child.firstName} {child.lastName}
                      </h3>
                      {child.nickname && (
                        <p className="text-sm text-[var(--color-text-secondary)]">"{child.nickname}"</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {child.classroom && (
                          <span 
                            className="badge text-xs"
                            style={{ backgroundColor: child.classroom.color + '40', color: '#666' }}
                          >
                            {child.classroom.emoji} {child.classroom.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(child)} className="text-[var(--color-primary)] hover:bg-[var(--color-nido-50)] p-2 rounded-lg transition-colors">✏️</button>
                    <button onClick={() => setChildToDelete(child)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">🗑️</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <DataRow label="Edad:" value={`${calculateAge(child.birthDate)} años`} />
                  <DataRow label="Turno:" value={<span className="capitalize">{child.shift}</span>} />
                  <DataRow label="Sexo:" value={child.gender === 'F' ? 'Femenino' : child.gender === 'M' ? 'Masculino' : 'Otro'} />
                  {child.medical.allergies.length > 0 && (
                    <div>
                      <span className="text-sm text-[var(--color-text-secondary)]">Alergias:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {child.medical.allergies.slice(0, 3).map((allergy, index) => (
                          <span key={index} className="badge warning text-xs">{allergy}</span>
                        ))}
                        {child.medical.allergies.length > 3 && (
                          <span className="text-xs text-[var(--color-text-muted)]">+{child.medical.allergies.length - 3} más</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--color-warm-100)]">
                  <div className="text-sm text-[var(--color-text-secondary)] mb-2">Contactos de emergencia:</div>
                  {child.emergencyContacts.slice(0, 2).map((contact, index) => (
                    <div key={index} className="text-xs text-[var(--color-text-muted)] mb-1">
                      <strong>{contact.name}</strong> ({contact.relationship}): {contact.phone}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {filteredChildren.length === 0 && !error && (
              <div className="col-span-full">
                <EmptyState
                  icon="👶"
                  title={children.length === 0 ? 'Todavía no hay nenes registrados 👶' : 'No hay nenes que coincidan'}
                  description={children.length === 0 ? '¡Comenzá registrando el primer nene del jardín!' : 'Intentá cambiar los filtros de búsqueda'}
                  action={children.length === 0 ? { label: 'Registrar primer nene', onClick: () => setShowModal(true) } : undefined}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal para crear/editar niño */}
        <Modal isOpen={showModal} onClose={handleCloseModal} title={editingChild ? 'Editar nene' : 'Nuevo nene'} size="lg">
          <form onSubmit={handleSubmit} className="form-group">
            {/* Datos personales */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Nombre" required>
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} className="input" placeholder="Ej: Valentina" />
                </FormField>
                <FormField label="Apellido" required>
                  <input type="text" required value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} className="input" placeholder="Ej: López" />
                </FormField>
                <FormField label="Apodo">
                  <input type="text" value={formData.nickname} onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))} className="input" placeholder="Ej: Vale" />
                </FormField>
                <FormField label="DNI">
                  <input type="text" value={formData.dni} onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))} className="input" placeholder="Ej: 60123456" />
                </FormField>
                <FormField label="Fecha de nacimiento" required>
                  <input type="date" required value={formData.birthDate} onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))} className="input" />
                </FormField>
                <FormField label="Sexo" required>
                  <select required value={formData.gender} onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'F' | 'M' | 'X' }))} className="input">
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="X">Otro</option>
                  </select>
                </FormField>
                <FormField label="Sala" required>
                  <select required value={formData.classroomId} onChange={(e) => {
                    const classroom = classrooms.find(c => c._id === e.target.value)
                    setFormData(prev => ({ ...prev, classroomId: e.target.value, shift: classroom?.shift || 'mañana' }))
                  }} className="input">
                    <option value="">Seleccionar sala</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom._id} value={classroom._id}>{classroom.emoji} {classroom.name} ({classroom.shift})</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Fecha de inscripción" required>
                  <input type="date" required value={formData.enrollmentDate} onChange={(e) => setFormData(prev => ({ ...prev, enrollmentDate: e.target.value }))} className="input" />
                </FormField>
              </div>
            </div>

            {/* Información médica */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Información Médica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <FormField label="Grupo sanguíneo">
                  <input type="text" value={formData.medical.bloodType} onChange={(e) => setFormData(prev => ({ ...prev, medical: { ...prev.medical, bloodType: e.target.value } }))} className="input" placeholder="Ej: A+" />
                </FormField>
                <FormField label="Obra social">
                  <input type="text" value={formData.medical.healthInsurance.provider} onChange={(e) => setFormData(prev => ({ ...prev, medical: { ...prev.medical, healthInsurance: { ...prev.medical.healthInsurance, provider: e.target.value } } }))} className="input" placeholder="Ej: OSDE" />
                </FormField>
              </div>

              {/* Alergias */}
              <div className="mb-4">
                <FormField label="Alergias">
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} className="input flex-1" placeholder="Ej: maní, látex, etc." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())} />
                    <button type="button" onClick={addAllergy} className="btn btn-secondary">Agregar</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.medical.allergies.map((allergy, index) => (
                      <span key={index} className="badge warning flex items-center gap-2">
                        {allergy}
                        <button type="button" onClick={() => removeAllergy(index)} className="text-red-500 hover:text-red-700">×</button>
                      </span>
                    ))}
                  </div>
                </FormField>
              </div>

              {/* Condiciones médicas */}
              <div className="mb-4">
                <FormField label="Condiciones médicas">
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} className="input flex-1" placeholder="Ej: asma, diabetes, etc." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())} />
                    <button type="button" onClick={addCondition} className="btn btn-secondary">Agregar</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.medical.conditions.map((condition, index) => (
                      <span key={index} className="badge error flex items-center gap-2">
                        {condition}
                        <button type="button" onClick={() => removeCondition(index)} className="text-red-500 hover:text-red-700">×</button>
                      </span>
                    ))}
                  </div>
                </FormField>
              </div>

              <FormField label="Observaciones médicas">
                <textarea rows={3} value={formData.medical.notes} onChange={(e) => setFormData(prev => ({ ...prev, medical: { ...prev.medical, notes: e.target.value } }))} className="input" placeholder="Cualquier información médica importante para las seños..." />
              </FormField>
            </div>

            {/* Contactos de emergencia */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Contactos de Emergencia</h3>
                <button type="button" onClick={addEmergencyContact} className="btn btn-secondary text-sm">+ Agregar contacto</button>
              </div>
              {formData.emergencyContacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-4 p-4 border border-[var(--color-warm-100)] rounded-lg">
                  <FormField label="Nombre" required>
                    <input type="text" required value={contact.name} onChange={(e) => {
                      const newContacts = [...formData.emergencyContacts]
                      newContacts[index].name = e.target.value
                      setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                    }} className="input" placeholder="Ej: Laura López" />
                  </FormField>
                  <FormField label="Parentesco" required>
                    <select required value={contact.relationship} onChange={(e) => {
                      const newContacts = [...formData.emergencyContacts]
                      newContacts[index].relationship = e.target.value
                      setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                    }} className="input">
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
                  </FormField>
                  <FormField label="Teléfono" required>
                    <input type="tel" required value={contact.phone} onChange={(e) => {
                      const newContacts = [...formData.emergencyContacts]
                      newContacts[index].phone = e.target.value
                      setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                    }} className="input" placeholder="Ej: 2644567890" />
                  </FormField>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={contact.isPrimary} onChange={(e) => {
                        const newContacts = [...formData.emergencyContacts]
                        newContacts[index].isPrimary = e.target.checked
                        setFormData(prev => ({ ...prev, emergencyContacts: newContacts }))
                      }} />
                      <span className="text-sm">Primario</span>
                    </label>
                    {formData.emergencyContacts.length > 1 && (
                      <button type="button" onClick={() => removeEmergencyContact(index)} className="btn text-red-500 hover:bg-red-50 p-2">🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions pt-4 border-t border-[var(--color-warm-100)]">
              <button type="button" onClick={handleCloseModal} className="btn btn-secondary flex-1">Cancelar</button>
              <button type="submit" className="btn btn-primary flex-1">{editingChild ? 'Actualizar' : 'Guardar'} nene</button>
            </div>
          </form>
        </Modal>

        {/* Confirm delete dialog */}
        <ConfirmDialog
          isOpen={!!childToDelete}
          onClose={() => setChildToDelete(null)}
          onConfirm={() => childToDelete && handleDelete(childToDelete)}
          title="Eliminar nene"
          message={`¿Estás segura que querés eliminar a ${childToDelete?.firstName} ${childToDelete?.lastName}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          variant="danger"
        />
      </AppLayout>
    </ProtectedRoute>
  )
}
