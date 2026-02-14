'use client'

import { cn } from '@/lib/utils'

type Status = 'present' | 'absent' | 'late' | 'excused'

interface AttendanceStatusButtonProps {
  status: Status
  selected: boolean
  onClick: () => void
  compact?: boolean
  className?: string
}

const statusConfig: Record<Status, { emoji: string; label: string; selectedClass: string; hoverClass: string }> = {
  present: {
    emoji: '✅',
    label: 'Presente',
    selectedClass: 'bg-green-100 border-green-300 text-green-800',
    hoverClass: 'hover:border-green-300 hover:bg-green-50',
  },
  absent: {
    emoji: '❌',
    label: 'Ausente',
    selectedClass: 'bg-red-100 border-red-300 text-red-800',
    hoverClass: 'hover:border-red-300 hover:bg-red-50',
  },
  late: {
    emoji: '⏰',
    label: 'Tardanza',
    selectedClass: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    hoverClass: 'hover:border-yellow-300 hover:bg-yellow-50',
  },
  excused: {
    emoji: '📄',
    label: 'Justificado',
    selectedClass: 'bg-blue-100 border-blue-300 text-blue-800',
    hoverClass: 'hover:border-blue-300 hover:bg-blue-50',
  },
}

export default function AttendanceStatusButton({ status, selected, onClick, compact, className }: AttendanceStatusButtonProps) {
  const config = statusConfig[status]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 transition-colors',
        compact ? 'p-2 text-sm' : 'p-3',
        selected
          ? cn(config.selectedClass, 'ring-2 ring-offset-1 ring-current/20')
          : cn('border-gray-200', config.hoverClass),
        className
      )}
    >
      {config.emoji} {!compact && config.label}
    </button>
  )
}
