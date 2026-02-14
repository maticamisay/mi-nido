'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './card'

interface ActionCardProps {
  emoji: string
  label: string
  href: string
  className?: string
}

export default function ActionCard({ emoji, label, href, className }: ActionCardProps) {
  return (
    <Link href={href} className={cn('block', className)}>
      <Card className="text-center group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
        <CardContent className="p-5">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
            {emoji}
          </div>
          <p className="text-sm font-semibold text-foreground">
            {label}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
