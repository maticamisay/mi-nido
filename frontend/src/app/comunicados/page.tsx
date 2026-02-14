'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AlertMessage from '@/components/ui/AlertMessage'
import { formatDateLong } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Classroom {
  _id: string
  name: string
  emoji: string
  color: string
  shift: string
}

interface Announcement {
  _id: string
  title: string
  body: string
  scope: 'garden' | 'classroom'
  classroomIds: string[]
  classrooms?: Classroom[]
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
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  author: {
    firstName: string
    lastName: string
  }
  pinned: boolean
  urgent: boolean
  createdAt: string
  updatedAt: string
}

interface CreateAnnouncementData {
  title: string
  body: string
  scope: 'garden' | 'classroom'
  classroomIds: string[]
  requiresAck: boolean
  status: 'draft' | 'published' | 'archived'
  pinned: boolean
  urgent: boolean
}

export default function ComunicadosPage() {
  const { token, gardenId } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('published')

  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: '',
    body: '',
    scope: 'garden',
    classroomIds: [],
    requiresAck: false,
    status: 'published',
    pinned: false,
    urgent: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Obtener comunicados y salas en paralelo
      const [announcementsRes, classroomsRes] = await Promise.all([
        apiFetch('/announcements', { token, gardenId }),
        apiFetch('/classrooms', { token, gardenId })
      ])

      if (announcementsRes.ok) {
        const result = await announcementsRes.json()
        setAnnouncements(result.announcements || result)
      }

      if (classroomsRes.ok) {
        const result = await classroomsRes.json()
        setClassrooms(result.classrooms || result)
      }

    } catch (err: any) {
      setError('Error al cargar los datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      body: '',
      scope: 'garden',
      classroomIds: [],
      requiresAck: false,
      status: 'published',
      pinned: false,
      urgent: false
    })
    setShowModal(true)
    setError('')
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      body: announcement.body,
      scope: announcement.scope,
      classroomIds: announcement.classroomIds,
      requiresAck: announcement.requiresAck,
      status: announcement.status,
      pinned: announcement.pinned,
      urgent: announcement.urgent
    })
    setShowModal(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!formData.title.trim() || !formData.body.trim()) {
        throw new Error('El título y el contenido son obligatorios')
      }

      const url = editingAnnouncement 
        ? `/announcements/${editingAnnouncement._id}`
        : '/announcements'
      
      const method = editingAnnouncement ? 'PUT' : 'POST'

      const response = await apiFetch(url, {
        method,
        token,
        gardenId,
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar el comunicado')
      }

      const data = await response.json()
      const savedAnnouncement = data.announcement || data
      
      if (editingAnnouncement) {
        setAnnouncements(prev => prev.map(a => a._id === savedAnnouncement._id ? savedAnnouncement : a))
      } else {
        setAnnouncements(prev => [savedAnnouncement, ...prev])
      }

      handleCloseModal()
      setSuccessMessage(`Comunicado ${editingAnnouncement ? 'actualizado' : 'creado'} correctamente ✅`)
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (announcementId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar este comunicado?')) {
      return
    }

    try {
      const response = await apiFetch(`/announcements/${announcementId}`, {
        method: 'DELETE',
        token,
        gardenId
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el comunicado')
      }

      setAnnouncements(prev => prev.filter(a => a._id !== announcementId))
      setSuccessMessage('Comunicado eliminado correctamente ✅')
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAcknowledge = async (announcementId: string) => {
    try {
      const response = await apiFetch(`/announcements/${announcementId}/acknowledge`, {
        method: 'POST',
        token,
        gardenId,
        body: {}
      })

      if (!response.ok) {
        throw new Error('Error al marcar como leído')
      }

      const dataRead = await response.json()
      const updatedAnnouncement = dataRead.announcement || dataRead
      setAnnouncements(prev => prev.map(a => a._id === updatedAnnouncement._id ? updatedAnnouncement : a))
      setSuccessMessage('Marcado como leído ✅')
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAnnouncement(null)
    setError('')
  }

  const toggleClassroom = (classroomId: string) => {
    setFormData(prev => ({
      ...prev,
      classroomIds: prev.classroomIds.includes(classroomId)
        ? prev.classroomIds.filter(id => id !== classroomId)
        : [...prev.classroomIds, classroomId]
    }))
  }

  const getFilteredAnnouncements = () => {
    return announcements.filter(announcement => {
      if (filter === 'all') return true
      return announcement.status === filter
    }).sort((a, b) => {
      // Pinneados primero, luego urgentes, luego por fecha
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (a.urgent && !b.urgent) return -1
      if (!a.urgent && b.urgent) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }



  const filteredAnnouncements = getFilteredAnnouncements()

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
          <PageHeader
            title="📢 Comunicados"
            description="Enviá comunicados y noticias a las familias."
            actions={
              <button
                onClick={handleCreate}
                className="btn btn-primary"
              >
                + Nuevo comunicado
              </button>
            }
          >
            {/* Filtros */}
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white border border-[var(--color-warm-100)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                Todos ({announcements.length})
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'published'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white border border-[var(--color-warm-100)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                Publicados ({announcements.filter(a => a.status === 'published').length})
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'draft'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white border border-[var(--color-warm-100)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                Borradores ({announcements.filter(a => a.status === 'draft').length})
              </button>
            </div>
          </PageHeader>

          {/* Mensajes */}
          {error && (
            <AlertMessage type="error" message={error} />
          )}

          {successMessage && (
            <AlertMessage type="success" message={successMessage} />
          )}

          {/* Lista de comunicados */}
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold mb-2">
                {filter === 'all' ? 'No hay comunicados' : 
                 filter === 'published' ? 'No hay comunicados publicados' :
                 'No hay borradores'}
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                {filter === 'all' ? 'Creá tu primer comunicado para las familias' : 
                 filter === 'published' ? 'Los comunicados publicados aparecerán aquí' :
                 'Los borradores aparecerán aquí'}
              </p>
              {filter === 'all' && (
                <button
                  onClick={handleCreate}
                  className="btn btn-primary"
                >
                  + Crear comunicado
                </button>
              )}
            </div>
          ) : (
            <div className="form-group">
              {filteredAnnouncements.map((announcement) => (
                <div 
                  key={announcement._id} 
                  className={`card ${announcement.pinned ? 'border-l-4 border-l-[var(--color-primary)]' : ''}`}
                >
                  {/* Header del comunicado */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2.5">
                        {announcement.pinned && <span title="Fijado">📌</span>}
                        {announcement.urgent && <span title="Urgente">🚨</span>}
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                          {announcement.title}
                        </h2>
                        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          announcement.status === 'published' 
                            ? 'bg-green-100 text-green-800'
                            : announcement.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.status === 'published' ? 'Publicado' :
                           announcement.status === 'draft' ? 'Borrador' : 'Archivado'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                        <span>Por {announcement.author.firstName} {announcement.author.lastName}</span>
                        <span>•</span>
                        <span>{formatDateLong(announcement.createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {announcement.scope === 'garden' ? (
                            <>🏠 Todo el jardín</>
                          ) : (
                            <>
                              📚 {announcement.classrooms?.map(c => `${c.emoji} ${c.name}`).join(', ')}
                            </>
                          )}
                        </span>
                        {announcement.requiresAck && (
                          <>
                            <span>•</span>
                            <span>📋 Requiere confirmación</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-2"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className="text-[var(--color-text-muted)] hover:text-red-600 p-2"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="mb-5">
                    <p className="text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                      {announcement.body}
                    </p>
                  </div>

                  {/* Adjuntos */}
                  {announcement.attachments.length > 0 && (
                    <div className="mb-5">
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

                  {/* Confirmaciones */}
                  {announcement.requiresAck && announcement.status === 'published' && (
                    <div className="border-t border-[var(--color-warm-100)] pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            📋 Confirmaciones: {announcement.acknowledgements.length}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAcknowledge(announcement._id)}
                          className="btn btn-secondary text-sm"
                          disabled={announcement.acknowledgements.some(ack => ack.userId === 'current-user-id')}
                        >
                          {announcement.acknowledgements.some(ack => ack.userId === 'current-user-id') 
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

        {/* Modal para crear/editar comunicado */}
        <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
          <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingAnnouncement ? 'Editar comunicado' : 'Nuevo comunicado'}
              </DialogTitle>
            </DialogHeader>

                <form onSubmit={handleSubmit} className="form-group">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Título del comunicado
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="input"
                      placeholder="Ej: Reunión de padres - Sala Patitos"
                      required
                    />
                  </div>

                  {/* Contenido */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Contenido
                    </label>
                    <textarea
                      rows={6}
                      value={formData.body}
                      onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                      className="input"
                      placeholder="Escribe aquí el mensaje para las familias..."
                      required
                    />
                  </div>

                  {/* Destinatarios */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                      Destinatarios
                    </label>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="scope"
                          value="garden"
                          checked={formData.scope === 'garden'}
                          onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as any, classroomIds: [] }))}
                        />
                        <span className="text-sm">🏠 Todo el jardín</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="scope"
                          value="classroom"
                          checked={formData.scope === 'classroom'}
                          onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as any }))}
                        />
                        <span className="text-sm">📚 Salas específicas</span>
                      </label>
                    </div>

                    {/* Selector de salas */}
                    {formData.scope === 'classroom' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          Seleccioná las salas:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {classrooms.map((classroom) => (
                            <label key={classroom._id} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--color-warm-100)] hover:border-[var(--color-primary)]">
                              <input
                                type="checkbox"
                                checked={formData.classroomIds.includes(classroom._id)}
                                onChange={() => toggleClassroom(classroom._id)}
                              />
                              <span className="text-sm">
                                {classroom.emoji} {classroom.name} ({classroom.shift})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Opciones */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                      Opciones
                    </label>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.requiresAck}
                          onChange={(e) => setFormData(prev => ({ ...prev, requiresAck: e.target.checked }))}
                        />
                        <span className="text-sm">📋 Requiere confirmación de lectura</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.pinned}
                          onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                        />
                        <span className="text-sm">📌 Fijar en la parte superior</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.urgent}
                          onChange={(e) => setFormData(prev => ({ ...prev, urgent: e.target.checked }))}
                        />
                        <span className="text-sm">🚨 Marcar como urgente</span>
                      </label>
                    </div>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                      Estado
                    </label>
                    
                    <div className="flex gap-5">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={formData.status === 'draft'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        />
                        <span className="text-sm">📝 Guardar como borrador</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="status"
                          value="published"
                          checked={formData.status === 'published'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        />
                        <span className="text-sm">📤 Publicar inmediatamente</span>
                      </label>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600">⚠️</span>
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
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
                        editingAnnouncement ? 'Actualizar comunicado' : 'Guardar comunicado'
                      )}
                    </button>
                  </div>
                </form>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}