'use client'

import { Alert, AlertDescription } from './alert'
import { cn } from '@/lib/utils'

interface AlertMessageProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
  className?: string
}

const styles = {
  success: { bg: 'bg-green-50 border-green-200 text-green-700', icon: '✅' },
  error: { bg: 'bg-red-50 border-red-200 text-red-700', icon: '⚠️' },
  warning: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: '⚠️' },
  info: { bg: 'bg-blue-50 border-blue-200 text-blue-700', icon: 'ℹ️' },
}

export default function AlertMessage({ type, message, onClose, className }: AlertMessageProps) {
  const s = styles[type]
  return (
    <Alert className={cn('mb-6', s.bg, className)}>
      <AlertDescription className="flex items-center gap-2">
        <span>{s.icon}</span>
        <span className="flex-1 text-sm font-medium">{message}</span>
        {onClose && (
          <button onClick={onClose} className="text-current/40 hover:text-current/60 ml-2">✕</button>
        )}
      </AlertDescription>
    </Alert>
  )
}
