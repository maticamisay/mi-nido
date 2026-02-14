import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataRowProps {
  label: string
  value: ReactNode
  className?: string
}

export default function DataRow({ label, value, className }: DataRowProps) {
  return (
    <div className={cn('flex justify-between items-center py-1', className)}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
