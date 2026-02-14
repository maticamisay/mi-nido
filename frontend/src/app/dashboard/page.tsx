'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import StatCard from '@/components/ui/StatCard'
import ActionCard from '@/components/ui/ActionCard'
import ActivityItem from '@/components/ui/ActivityItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
        <div className="py-6 sm:py-10">
          {/* Header */}
          <div className="page-header animate-fade-in-up">
            <h1>
              {getGreeting()}, {firstName}! 👋
            </h1>
            <p>
              Acá tenés un resumen de lo que pasa hoy en el jardín.
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid-stats page-section stagger-children">
            <StatCard icon="👶" label="Nenes presentes" value={attendance ? `${attendance.gardenSummary.present} / ${attendance.gardenSummary.totalChildren}` : '—'} bgColor="var(--color-menta-100)" className="animate-fade-in-up" />
            <StatCard icon="📒" label="Cuadernos (mes)" value={stats ? `${stats.dailyEntries.lastMonth}` : '—'} bgColor="var(--color-pollito-100)" className="animate-fade-in-up" />
            <StatCard icon="💰" label="Pagos pendientes" value={stats ? `${stats.payments.pending}` : '—'} bgColor="var(--color-celeste-100)" className="animate-fade-in-up" />
            <StatCard icon="🏫" label="Salas / Nenes" value={stats ? `${stats.classrooms} / ${stats.children.active}` : '—'} bgColor="var(--color-lila-100)" className="animate-fade-in-up" />
          </div>

          {/* Main content grid */}
          <div className="grid-cards page-section">
            {/* Attendance */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    Asistencia de Hoy
                  </CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                    {attendance ? `${attendance.gardenSummary.attendanceRate}%` : '—'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(attendance?.classrooms || []).map((sala) => (
                    <div key={sala.classroom.id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-warm-50" style={{ backgroundColor: (sala.classroom.color || 'var(--color-pollito-100)') + '60' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{sala.classroom.emoji}</span>
                        <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{sala.classroom.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{sala.attendance.present} / {sala.totalChildren}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">presentes</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-5" asChild>
                  <Link href="/asistencia">
                    Ver toda la asistencia
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <ActivityItem initials="VL" name="Valentina López" description="Cuaderno actualizado — Sala Pollitos" time="Hace 15 min" color="var(--color-pollito-300)" />
                  <ActivityItem initials="SF" name="Santiago Fernández" description="Asistencia marcada — Sala Ositos" time="Hace 1 hora" color="var(--color-menta-300)" />
                  <ActivityItem emoji="📢" name="Nuevo comunicado" description="Reunión de padres — Sala Pollitos" time="Hace 2 horas" color="var(--color-nido-300)" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="page-section-title">
              Acciones Rápidas
            </h3>
            
            <div className="grid-actions stagger-children">
              <ActionCard emoji="📒" label="Escribir cuaderno" href="/cuaderno" className="animate-fade-in-up" />
              <ActionCard emoji="✅" label="Tomar asistencia" href="/asistencia" className="animate-fade-in-up" />
              <ActionCard emoji="📢" label="Nuevo comunicado" href="/comunicados" className="animate-fade-in-up" />
              <ActionCard emoji="👶" label="Agregar nene" href="/ninos" className="animate-fade-in-up" />
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
