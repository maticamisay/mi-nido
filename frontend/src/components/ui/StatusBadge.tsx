import { cn } from '@/lib/utils'
import { Badge } from './badge'

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusBadgeProps {
  status: string
  variant?: Variant
  className?: string
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-green-100 text-green-800 hover:bg-green-100',
  warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  error: 'bg-red-100 text-red-800 hover:bg-red-100',
  info: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  neutral: 'bg-muted text-muted-foreground hover:bg-muted',
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
    <Badge
      variant="secondary"
      className={cn(variantClasses[resolvedVariant], className)}
    >
      {status}
    </Badge>
  )
}
