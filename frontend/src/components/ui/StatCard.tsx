'use client'

import { cn } from '@/lib/utils'
import EmojiIconBox from './EmojiIconBox'

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  bgColor?: string
  className?: string
}

export default function StatCard({ icon, label, value, bgColor, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <EmojiIconBox emoji={icon} size="sm" bgColor={bgColor} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 mb-1">
            {label}
          </p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
