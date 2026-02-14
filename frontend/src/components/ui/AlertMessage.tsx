'use client'

import { cn } from '@/lib/utils'

interface AlertMessageProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
  className?: string
}

const styles = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: '✅', iconColor: 'text-green-600' },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '⚠️', iconColor: 'text-red-600' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: '⚠️', iconColor: 'text-yellow-600' },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: 'ℹ️', iconColor: 'text-blue-600' },
}

export default function AlertMessage({ type, message, onClose, className }: AlertMessageProps) {
  const s = styles[type]
  return (
    <div className={cn('mb-6 p-4 rounded-lg border', s.bg, className)}>
      <div className="flex items-center gap-2">
        <span className={s.iconColor}>{s.icon}</span>
        <p className={cn('text-sm font-medium flex-1', s.text)}>{message}</p>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">✕</button>
        )}
      </div>
    </div>
  )
}
