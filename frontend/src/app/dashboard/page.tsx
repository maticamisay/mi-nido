'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

interface GardenStats {
  classrooms: number
  children: { total: number; active: number }
  dailyEntries: { lastMonth: number }
  payments: { pending: number; monthlyIncome: number; monthlyPaidCount: number }
}

interface AttendanceSummary {
  gardenSummary: { totalChildren: number; present: number; attendanceRate: number }
  classrooms: Array<{
    classroom: { id: string; name: string; emoji: string; color: string }
    totalChildren: number
    attendance: { present: number; total: number; attendanceRate: number }
  }>
}

export default function DashboardPage() {
  const { user, token, gardenId } = useAuth()
  const firstName = user?.profile.firstName || 'María'
  const [stats, setStats] = useState<GardenStats | null>(null)
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null)

  useEffect(() => {
    if (token && gardenId) {
      fetchDashboardData()
    }
  }, [token, gardenId])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, attendanceRes] = await Promise.all([
        apiFetch(`/gardens/${gardenId}/stats`, { token, gardenId }),
        apiFetch('/attendance/summary', { token, gardenId })
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }

      if (attendanceRes.ok) {
        const data = await attendanceRes.json()
        setAttendance(data)
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '¡Buen día'
    if (hour < 18) return '¡Buenas tardes'
    return '¡Buenas noches'
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {getGreeting()}, {firstName}! 👋
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Acá tenés un resumen de lo que pasa hoy en el jardín.
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
            {[
              { icon: '👶', label: 'Nenes presentes', value: attendance ? `${attendance.gardenSummary.present} / ${attendance.gardenSummary.totalChildren}` : '—', color: 'var(--color-menta-100)', accent: 'var(--color-menta-300)' },
              { icon: '📒', label: 'Cuadernos (mes)', value: stats ? `${stats.dailyEntries.lastMonth}` : '—', color: 'var(--color-pollito-100)', accent: 'var(--color-pollito-300)' },
              { icon: '💰', label: 'Pagos pendientes', value: stats ? `${stats.payments.pending}` : '—', color: 'var(--color-celeste-100)', accent: 'var(--color-celeste-300)' },
              { icon: '🏫', label: 'Salas / Nenes', value: stats ? `${stats.classrooms} / ${stats.children.active}` : '—', color: 'var(--color-lila-100)', accent: 'var(--color-lila-300)' },
            ].map((stat) => (
              <div key={stat.label} className="card animate-fade-in-up group cursor-default">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-0.5 truncate" style={{ fontFamily: 'var(--font-display)' }}>
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Attendance */}
            <div className="card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Asistencia de Hoy
                </h3>
                <span className="badge success">{attendance ? `${attendance.gardenSummary.attendanceRate}%` : '—'}</span>
              </div>
              
              <div className="space-y-3">
                {(attendance?.classrooms || []).map((sala) => (
                  <div key={sala.classroom.id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-[var(--color-warm-50)]" style={{ backgroundColor: (sala.classroom.color || 'var(--color-pollito-100)') + '60' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{sala.classroom.emoji}</span>
                      <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{sala.classroom.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{sala.attendance.present} / {sala.totalChildren}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">presentes</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link href="/asistencia" className="btn btn-secondary w-full mt-5 text-sm">
                Ver toda la asistencia
              </Link>
            </div>

            {/* Recent activity */}
            <div className="card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Actividad Reciente
                </h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { initials: 'VL', name: 'Valentina López', action: 'Cuaderno actualizado — Sala Pollitos', time: 'Hace 15 min', bg: 'var(--color-pollito-300)' },
                  { initials: 'SF', name: 'Santiago Fernández', action: 'Asistencia marcada — Sala Ositos', time: 'Hace 1 hora', bg: 'var(--color-menta-300)' },
                  { initials: '📢', name: 'Nuevo comunicado', action: 'Reunión de padres — Sala Pollitos', time: 'Hace 2 horas', bg: 'var(--color-nido-300)', isEmoji: true },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 group">
                    <div className="avatar size-sm shrink-0" style={{ background: item.bg }}>
                      {item.isEmoji ? item.initials : <span className="text-[11px]">{item.initials}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.action}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Acciones Rápidas
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {[
                { emoji: '📒', label: 'Escribir cuaderno', href: '/cuaderno' },
                { emoji: '✅', label: 'Tomar asistencia', href: '/asistencia' },
                { emoji: '📢', label: 'Nuevo comunicado', href: '/comunicados' },
                { emoji: '👶', label: 'Agregar nene', href: '/niños' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="card text-center p-5 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {action.emoji}
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {action.label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
