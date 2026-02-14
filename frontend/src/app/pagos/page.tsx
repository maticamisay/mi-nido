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
import StatCard from '@/components/ui/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AlertMessage from '@/components/ui/AlertMessage'
import { getInitials, formatCurrency, formatDate } from '@/lib/utils'

interface Child {
  _id: string
  firstName: string
  lastName: string
  nickname?: string
  photo?: string
  classroom: {
    _id: string
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
  fee: {
    amount: number
    dueDay: number
    lateFeePercent: number
  }
}

interface Payment {
  _id: string
  childId: string
  child?: Child
  classroomId: string
  period: string // "2026-03"
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
  paymentNotes?: string
  recordedBy?: string
  createdAt: string
  updatedAt: string
}

interface CreatePaymentData {
  childId: string
  period: string
  concept: string
  description: string
  amount: number
  lateFee: number
  discount: number
  dueDate: string
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived'
  paidAmount?: number
  paymentMethod?: string
  paymentReference?: string
  paymentNotes?: string
}

interface PaymentStats {
  totalPaidThisMonth: number
  pendingPayments: number
  overduePayments: number
  totalExpected: number
  collectionRate: number
}

export default function PagosPage() {
  const { token, gardenId } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [paymentToRecord, setPaymentToRecord] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [filterPeriod, setFilterPeriod] = useState(getCurrentPeriod())
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [filterClassroom, setFilterClassroom] = useState<string>('')

  const [formData, setFormData] = useState<CreatePaymentData>({
    childId: '',
    period: getCurrentPeriod(),
    concept: 'cuota',
    description: '',
    amount: 0,
    lateFee: 0,
    discount: 0,
    dueDate: '',
    status: 'pending',
    paidAmount: 0,
    paymentMethod: '',
    paymentReference: '',
    paymentNotes: ''
  })

  const [paymentFormData, setPaymentFormData] = useState({
    paidAmount: 0,
    paymentMethod: 'efectivo',
    paymentReference: '',
    paymentNotes: ''
  })

  function getCurrentPeriod() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  useEffect(() => {
    if (token && gardenId) fetchData()
  }, [token, gardenId])

  useEffect(() => {
    if (token && gardenId) { fetchPayments(); fetchStats() }
  }, [filterPeriod, filterStatus, filterClassroom])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Obtener niños, salas y pagos en paralelo
      const [childrenRes, classroomsRes] = await Promise.all([
        apiFetch('/children', { token, gardenId }),
        apiFetch('/classrooms', { token, gardenId })
      ])

      if (childrenRes.ok) {
        const result = await childrenRes.json()
        setChildren(result.children || result)
      }

      if (classroomsRes.ok) {
        const result = await classroomsRes.json()
        setClassrooms(result.classrooms || result)
      }

      await fetchPayments()
      await fetchStats()

    } catch (err: any) {
      setError('Error al cargar los datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      let url = `/payments?period=${filterPeriod}`
      
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`
      }
      
      if (filterClassroom) {
        url += `&classroomId=${filterClassroom}`
      }

      const response = await apiFetch(url, { token, gardenId })

      if (response.ok) {
        const result = await response.json()
        setPayments(result.payments || result)
      }

    } catch (err: any) {
      setError('Error al cargar los pagos: ' + err.message)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiFetch(`/payments/stats?period=${filterPeriod}`, { token, gardenId })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }

    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err.message)
    }
  }

  const handleCreate = () => {
    setEditingPayment(null)
    setFormData({
      childId: '',
      period: getCurrentPeriod(),
      concept: 'cuota',
      description: '',
      amount: 0,
      lateFee: 0,
      discount: 0,
      dueDate: '',
      status: 'pending',
      paidAmount: 0,
      paymentMethod: '',
      paymentReference: '',
      paymentNotes: ''
    })
    setShowModal(true)
    setError('')
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      childId: payment.childId,
      period: payment.period,
      concept: payment.concept,
      description: payment.description,
      amount: payment.amount,
      lateFee: payment.lateFee,
      discount: payment.discount,
      dueDate: payment.dueDate.split('T')[0],
      status: payment.status,
      paidAmount: payment.paidAmount || 0,
      paymentMethod: payment.paymentMethod || '',
      paymentReference: payment.paymentReference || '',
      paymentNotes: payment.paymentNotes || ''
    })
    setShowModal(true)
    setError('')
  }

  const handleRecordPayment = (payment: Payment) => {
    setPaymentToRecord(payment)
    setPaymentFormData({
      paidAmount: payment.total - (payment.paidAmount || 0),
      paymentMethod: 'efectivo',
      paymentReference: '',
      paymentNotes: ''
    })
    setShowPaymentModal(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!formData.childId || !formData.description || formData.amount <= 0) {
        throw new Error('Completá todos los campos obligatorios')
      }

      // Calcular total
      const total = formData.amount + formData.lateFee - formData.discount

      // For new payments, use create-monthly; for existing, no update route exists yet
      const url = editingPayment 
        ? `/payments/${editingPayment._id}`
        : '/payments/create-monthly'
      
      const method = 'POST'

      const response = await apiFetch(url, {
        method,
        token,
        gardenId,
        body: { ...formData, total }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar el pago')
      }

      const dataCreate = await response.json()
      const savedPayment = dataCreate.payment || dataCreate
      
      if (editingPayment) {
        setPayments(prev => prev.map(p => p._id === savedPayment._id ? savedPayment : p))
      } else {
        setPayments(prev => [savedPayment, ...prev])
      }

      handleCloseModal()
      setSuccessMessage(`Pago ${editingPayment ? 'actualizado' : 'registrado'} correctamente ✅`)
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchStats()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!paymentToRecord || paymentFormData.paidAmount <= 0) {
        throw new Error('El monto pagado debe ser mayor a 0')
      }

      const response = await apiFetch(`/payments/${paymentToRecord._id}/record`, {
        method: 'POST',
        token,
        gardenId,
        body: {
          amount: paymentFormData.paidAmount,
          method: paymentFormData.paymentMethod,
          reference: paymentFormData.paymentReference,
          notes: paymentFormData.paymentNotes
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al registrar el pago')
      }

      const dataUpdate = await response.json()
      const updatedPayment = dataUpdate.payment || dataUpdate
      setPayments(prev => prev.map(p => p._id === updatedPayment._id ? updatedPayment : p))

      handleClosePaymentModal()
      setSuccessMessage('Pago registrado correctamente ✅')
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchStats()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar este registro de pago?')) {
      return
    }

    try {
      const response = await apiFetch(`/payments/${paymentId}`, {
        method: 'DELETE',
        token,
        gardenId
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el pago')
      }

      setPayments(prev => prev.filter(p => p._id !== paymentId))
      setSuccessMessage('Pago eliminado correctamente ✅')
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchStats()

    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPayment(null)
    setError('')
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setPaymentToRecord(null)
    setError('')
  }

  const handleChildChange = (childId: string) => {
    const child = children.find(c => c._id === childId)
    if (child) {
      const classroom = classrooms.find(c => c._id === child.classroom._id)
      if (classroom) {
        // Auto-completar datos basados en la sala
        const dueDay = classroom.fee.dueDay
        const [year, month] = formData.period.split('-')
        const dueDate = new Date(parseInt(year), parseInt(month) - 1, dueDay)
        
        setFormData(prev => ({
          ...prev,
          childId,
          description: `Cuota ${getMonthName(parseInt(month))} ${year} - Sala ${classroom.name}`,
          amount: classroom.fee.amount,
          dueDate: dueDate.toISOString().split('T')[0]
        }))
      }
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return months[month - 1]
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
            title="💰 Gestión de Pagos"
            description="Controlá las cuotas y pagos de las familias."
            actions={
              <button
                onClick={handleCreate}
                className="btn btn-primary"
              >
                + Nuevo pago
              </button>
            }
          >
            {/* Estadísticas */}
            {stats && (
              <div className="grid-stats mb-8">
                <StatCard icon="💚" label="Pagos del mes" value={formatCurrency(stats.totalPaidThisMonth)} bgColor="var(--color-menta-100)" />
                <StatCard icon="⏰" label="Cuotas pendientes" value={stats.pendingPayments} bgColor="var(--color-pollito-100)" />
                <StatCard icon="🔴" label="Cuotas vencidas" value={stats.overduePayments} bgColor="#fee2e2" />
                <StatCard icon="📊" label="Tasa de cobranza" value={`${Math.round(stats.collectionRate)}%`} bgColor="var(--color-celeste-100)" />
              </div>
            )}

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row gap-5 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Período
                </label>
                <input
                  type="month"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="input"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="paid">Pagadas</option>
                  <option value="overdue">Vencidas</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                  Sala
                </label>
                <select
                  value={filterClassroom}
                  onChange={(e) => setFilterClassroom(e.target.value)}
                  className="input"
                >
                  <option value="">Todas las salas</option>
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

          {/* Lista de pagos */}
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💸</div>
              <h3 className="text-xl font-semibold mb-2">No hay pagos registrados</h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Registrá el primer pago para comenzar a gestionar las cuotas
              </p>
              <button
                onClick={handleCreate}
                className="btn btn-primary"
              >
                + Registrar pago
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {payments.map((payment) => (
                <div key={payment._id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar del niño */}
                      <div className="avatar size-md bg-[var(--color-primary)]">
                        {payment.child?.photo ? (
                          <img src={payment.child.photo} alt="Foto" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          getInitials(payment.child?.firstName || '', payment.child?.lastName || '')
                        )}
                      </div>
                      
                      {/* Información del pago */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            {payment.child?.firstName} {payment.child?.lastName}
                          </h3>
                          {getStatusBadge(payment.status, payment.dueDate)}
                        </div>
                        
                        <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                          {payment.description}
                        </p>
                        
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

                    {/* Acciones */}
                    <div className="flex items-center gap-2 ml-4">
                      {payment.status !== 'paid' && payment.status !== 'waived' && (
                        <button
                          onClick={() => handleRecordPayment(payment)}
                          className="btn btn-primary text-sm"
                          title="Registrar pago"
                        >
                          💰 Pagar
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEdit(payment)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-2"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      
                      <button
                        onClick={() => handleDelete(payment._id)}
                        className="text-[var(--color-text-muted)] hover:text-red-600 p-2"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
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

                  {/* Notas del pago */}
                  {payment.paymentNotes && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-warm-100)]">
                      <p className="text-sm text-[var(--color-text-secondary)] italic">
                        💬 {payment.paymentNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal para crear/editar pago */}
        <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
          <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingPayment ? 'Editar pago' : 'Nuevo pago'}
              </DialogTitle>
            </DialogHeader>

                <form onSubmit={handleSubmit} className="form-group">
                  {/* Niño */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Niño/a
                    </label>
                    <select
                      value={formData.childId}
                      onChange={(e) => handleChildChange(e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">Seleccionar niño/a</option>
                      {children.map((child) => (
                        <option key={child._id} value={child._id}>
                          {child.firstName} {child.lastName} - Sala {child.classroom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                    {/* Período */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Período
                      </label>
                      <input
                        type="month"
                        value={formData.period}
                        onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>

                    {/* Concepto */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Concepto
                      </label>
                      <select
                        value={formData.concept}
                        onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
                        className="input"
                        required
                      >
                        <option value="cuota">Cuota</option>
                        <option value="inscripción">Inscripción</option>
                        <option value="material">Material didáctico</option>
                        <option value="evento">Evento especial</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="input"
                      placeholder="Ej: Cuota Marzo 2026 - Sala Patitos"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
                    {/* Monto base */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Monto base
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        className="input"
                        required
                      />
                    </div>

                    {/* Recargo */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Recargo por mora
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.lateFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, lateFee: Number(e.target.value) }))}
                        className="input"
                      />
                    </div>

                    {/* Descuento */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Descuento
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Total calculado */}
                  <div className="bg-[var(--color-warm-50)] p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total a pagar:</span>
                      <span className="text-xl font-bold text-[var(--color-primary)]">
                        {formatCurrency(formData.amount + formData.lateFee - formData.discount)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                    {/* Fecha de vencimiento */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Fecha de vencimiento
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Estado
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="input"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagada</option>
                        <option value="partial">Pago parcial</option>
                        <option value="waived">Exonerada</option>
                      </select>
                    </div>
                  </div>

                  {/* Campos de pago (si está marcado como pagado) */}
                  {(formData.status === 'paid' || formData.status === 'partial') && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                        <div>
                          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                            Monto pagado
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.paidAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                            Método de pago
                          </label>
                          <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="input"
                          >
                            <option value="">Seleccionar método</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="mercadopago">Mercado Pago</option>
                            <option value="débito">Débito</option>
                            <option value="crédito">Crédito</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Referencia/Comprobante
                        </label>
                        <input
                          type="text"
                          value={formData.paymentReference}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
                          className="input"
                          placeholder="Nº de transf., comprobante, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                          Notas del pago
                        </label>
                        <textarea
                          rows={3}
                          value={formData.paymentNotes}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentNotes: e.target.value }))}
                          className="input"
                          placeholder="Observaciones sobre el pago..."
                        />
                      </div>
                    </>
                  )}

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
                        editingPayment ? 'Actualizar pago' : 'Guardar pago'
                      )}
                    </button>
                  </div>
                </form>
          </DialogContent>
        </Dialog>

        {/* Modal para registrar pago */}
        <Dialog open={showPaymentModal && !!paymentToRecord} onOpenChange={(open) => { if (!open) handleClosePaymentModal() }}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">💰 Registrar Pago</DialogTitle>
            </DialogHeader>
            {paymentToRecord && (
              <>
                {/* Información del pago */}
                <div className="bg-[var(--color-warm-50)] p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="avatar size-sm bg-[var(--color-primary)]">
                      {paymentToRecord.child?.photo ? (
                        <img src={paymentToRecord.child.photo} alt="Foto" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getInitials(paymentToRecord.child?.firstName || '', paymentToRecord.child?.lastName || '')
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {paymentToRecord.child?.firstName} {paymentToRecord.child?.lastName}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {paymentToRecord.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[var(--color-text-secondary)] mb-1">Total:</p>
                      <p className="font-semibold">{formatCurrency(paymentToRecord.total)}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-text-secondary)] mb-1">Ya pagado:</p>
                      <p className="font-semibold">{formatCurrency(paymentToRecord.paidAmount || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-[var(--color-warm-300)]">
                    <p className="text-[var(--color-text-secondary)] text-sm">Saldo pendiente:</p>
                    <p className="font-bold text-[var(--color-primary)]">
                      {formatCurrency(paymentToRecord.total - (paymentToRecord.paidAmount || 0))}
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                  {/* Monto pagado */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Monto que paga ahora
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={paymentToRecord.total - (paymentToRecord.paidAmount || 0)}
                      step="0.01"
                      value={paymentFormData.paidAmount}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                      className="input"
                      required
                    />
                  </div>

                  {/* Método de pago */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Método de pago
                    </label>
                    <select
                      value={paymentFormData.paymentMethod}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="input"
                      required
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="transferencia">🏦 Transferencia</option>
                      <option value="mercadopago">💳 Mercado Pago</option>
                      <option value="débito">💳 Débito</option>
                      <option value="crédito">💳 Crédito</option>
                      <option value="otro">❓ Otro</option>
                    </select>
                  </div>

                  {/* Referencia */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Referencia/Comprobante
                    </label>
                    <input
                      type="text"
                      value={paymentFormData.paymentReference}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
                      className="input"
                      placeholder="Nº de transf., comprobante, etc."
                    />
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Notas (opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={paymentFormData.paymentNotes}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentNotes: e.target.value }))}
                      className="input"
                      placeholder="Observaciones sobre el pago..."
                    />
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
                      onClick={handleClosePaymentModal}
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
                        '💰 Registrar pago'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}