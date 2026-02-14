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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Classroom {
  _id: string
  name: string
  emoji: string
  color: string
  ageRange: { from: number; to: number }
  shift: string
  capacity: number
  teacherIds: string[]
  fee: { amount: number; dueDay: number; lateFeePercent: number }
  createdAt: string
  updatedAt: string
}

interface CreateClassroomData {
  name: string
  emoji: string
  color: string
  ageRange: { from: number; to: number }
  shift: string
  capacity: number
  fee: { amount: number; dueDay: number; lateFeePercent: number }
}

export default function SalasPage() {
  const { token, gardenId } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  
  const [formData, setFormData] = useState<CreateClassroomData>({
    name: '', emoji: '🐥', color: '#FDE8A0',
    ageRange: { from: 1, to: 2 }, shift: 'mañana', capacity: 20,
    fee: { amount: 45000, dueDay: 10, lateFeePercent: 10 }
  })

  const colorOptions = [
    { name: 'Amarillo Pollito', value: '#FDE8A0' },
    { name: 'Verde Menta', value: '#B8E0D2' },
    { name: 'Celeste Bebé', value: '#B5D5E8' },
    { name: 'Lila Pastel', value: '#D4B5D6' },
    { name: 'Melocotón', value: '#FADBC8' },
  ]

  const emojiOptions = ['🐥', '🐻', '⭐', '🦋', '🌈', '🌸', '🐰', '🦊', '🐼', '🌞']

  useEffect(() => { if (token && gardenId) fetchClassrooms() }, [token, gardenId])

  const fetchClassrooms = async () => {
    try {
      const response = await apiFetch('/classrooms', { token, gardenId })
      if (!response.ok) throw new Error('Ups, no pudimos cargar las salas. Intentá de nuevo 🤔')
      const result = await response.json()
      setClassrooms(result.classrooms || result)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const url = editingClassroom ? `/classrooms/${editingClassroom._id}` : '/classrooms'
      const method = editingClassroom ? 'PUT' : 'POST'
      const response = await apiFetch(url, { method, token, gardenId, body: formData })
      if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Error al guardar') }
      const data = await response.json()
      const classroom = data.classroom || data
      if (editingClassroom) {
        setClassrooms(prev => prev.map(c => c._id === classroom._id ? classroom : c))
      } else {
        setClassrooms(prev => [...prev, classroom])
      }
      handleCloseModal()
    } catch (err: any) { setError(err.message) }
  }

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom)
    setFormData({ name: classroom.name, emoji: classroom.emoji, color: classroom.color, ageRange: classroom.ageRange, shift: classroom.shift, capacity: classroom.capacity, fee: classroom.fee })
    setShowModal(true)
  }

  const handleDelete = async (classroom: Classroom) => {
    if (!window.confirm(`¿Estás segura que querés eliminar la sala "${classroom.name}"?`)) return
    try {
      const response = await apiFetch(`/classrooms/${classroom._id}`, { method: 'DELETE', token, gardenId })
      if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Error al eliminar') }
      setClassrooms(prev => prev.filter(c => c._id !== classroom._id))
    } catch (err: any) { setError(err.message) }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClassroom(null)
    setFormData({ name: '', emoji: '🐥', color: '#FDE8A0', ageRange: { from: 1, to: 2 }, shift: 'mañana', capacity: 20, fee: { amount: 45000, dueDay: 10, lateFeePercent: 10 } })
    setError('')
  }

  if (loading) {
    return <ProtectedRoute><AppLayout><div><LoadingSpinner /></div></AppLayout></ProtectedRoute>
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <div className="page-header">
            <div className="flex items-center justify-between">
              <div>
                <h1>🏫 Gestión de Salas</h1>
                <p>Administrá las salas del jardín, sus seños y configuraciones.</p>
              </div>
              <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] hover:from-[var(--color-nido-400)] hover:to-[var(--color-nido-500)] text-white">
                <span className="text-lg">+</span> Nueva Sala
              </Button>
            </div>
          </div>

          {error && <AlertMessage type="error" message={error} />}

          <div className="grid-cards">
            {classrooms.map((classroom) => (
              <Card key={classroom._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: classroom.color }}>
                        {classroom.emoji}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{classroom.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{classroom.shift}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(classroom)}>✏️</Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(classroom)} className="text-destructive hover:text-destructive">🗑️</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <DataRow label="Edades:" value={`${classroom.ageRange.from} - ${classroom.ageRange.to} años`} />
                    <DataRow label="Capacidad:" value={`${classroom.capacity} nenes`} />
                    <DataRow label="Cuota:" value={formatCurrency(classroom.fee.amount)} />
                    <DataRow label="Vence el:" value={`${classroom.fee.dueDay} de cada mes`} />
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <DataRow label="Seños asignadas:" value={classroom.teacherIds.length || 0} />
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {classrooms.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🏫</div>
                <h3 className="text-xl font-semibold mb-2">Todavía no hay salas 🏫</h3>
                <p className="text-muted-foreground mb-6">¡Creá la primera sala de tu jardín para empezar!</p>
                <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] text-white">
                  <span className="text-lg">+</span> Crear Primera Sala
                </Button>
              </div>
            )}
          </div>
        </div>

        <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
          <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingClassroom ? 'Editar Sala' : 'Nueva Sala'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Nombre de la sala</Label>
                <Input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej: Sala Pollitos 🐥" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Emoji</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {emojiOptions.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                        className={`p-2 rounded-lg border-2 text-xl ${formData.emoji === emoji ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="space-y-2">
                    {colorOptions.map((color) => (
                      <button key={color.value} type="button" onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 ${formData.color === color.value ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}>
                        <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: color.value }} />
                        <span className="text-xs">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={formData.shift} onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mañana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="jornada completa">Jornada completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label>Edad desde</Label>
                  <Input type="number" min="0" max="5" required value={formData.ageRange.from} onChange={(e) => setFormData(prev => ({ ...prev, ageRange: { ...prev.ageRange, from: Number(e.target.value) } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Edad hasta</Label>
                  <Input type="number" min="0" max="5" required value={formData.ageRange.to} onChange={(e) => setFormData(prev => ({ ...prev, ageRange: { ...prev.ageRange, to: Number(e.target.value) } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input type="number" min="1" max="50" required value={formData.capacity} onChange={(e) => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Cuota mensual ($)</Label>
                  <Input type="number" min="0" step="100" required value={formData.fee.amount} onChange={(e) => setFormData(prev => ({ ...prev, fee: { ...prev.fee, amount: Number(e.target.value) } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Vence el día</Label>
                  <Input type="number" min="1" max="31" required value={formData.fee.dueDay} onChange={(e) => setFormData(prev => ({ ...prev, fee: { ...prev.fee, dueDay: Number(e.target.value) } }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recargo por mora (%)</Label>
                <Input type="number" min="0" max="50" required value={formData.fee.lateFeePercent} onChange={(e) => setFormData(prev => ({ ...prev, fee: { ...prev.fee, lateFeePercent: Number(e.target.value) } }))} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-[var(--color-nido-300)] to-[var(--color-nido-400)] text-white">
                  {editingClassroom ? 'Actualizar' : 'Crear'} Sala
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}
