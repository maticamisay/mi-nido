'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ActionCardProps {
  emoji: string
  label: string
  href: string
  className?: string
}

export default function ActionCard({ emoji, label, href, className }: ActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm text-center p-5',
        'group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300',
        className
      )}
    >
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
        {emoji}
      </div>
      <p className="text-sm font-semibold text-gray-900">
        {label}
      </p>
    </Link>
  )
}
