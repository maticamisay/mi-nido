import { cn } from '@/lib/utils'

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusBadgeProps {
  status: string
  variant?: Variant
  className?: string
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-700',
}

function autoDetectVariant(status: string): Variant {
  const s = status.toLowerCase()
  if (['paid', 'present', 'active', 'pagada', 'presente', 'activo', 'activa'].includes(s)) return 'success'
  if (['pending', 'pendiente', 'partial', 'parcial', 'late', 'tardanza'].includes(s)) return 'warning'
  if (['overdue', 'absent', 'ausente', 'vencida', 'error', 'withdrawn'].includes(s)) return 'error'
  if (['justified', 'justificado', 'info', 'excused'].includes(s)) return 'info'
  return 'neutral'
}

export default function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolvedVariant = variant || autoDetectVariant(status)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[resolvedVariant],
        className
      )}
    >
      {status}
    </span>
  )
}
