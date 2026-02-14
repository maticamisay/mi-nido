'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from './card'
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
    <Card className={cn('shadow-sm border-border/50', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
          <EmojiIconBox emoji={icon} size="sm" bgColor={bgColor} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1.5">
              {label}
            </p>
            <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
