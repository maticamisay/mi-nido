'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  variant?: 'primary' | 'white'
}

export default function LoadingSpinner({ size = 'md', className, text, variant = 'primary' }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-12 h-12 border-b-2',
    lg: 'w-16 h-16 border-b-2',
  }

  const colorMap = {
    primary: size === 'sm' ? 'border-[var(--color-primary)] border-t-transparent' : 'border-[var(--color-primary)]',
    white: 'border-white border-t-transparent',
  }

  const spinner = (
    <div className={cn('animate-spin rounded-full', sizeMap[size], colorMap[variant])} />
  )

  if (size === 'sm') {
    return text ? (
      <div className="flex items-center gap-2">
        {spinner}
        <span>{text}</span>
      </div>
    ) : spinner
  }

  return (
    <div className={cn('flex flex-col items-center justify-center h-64', className)}>
      {spinner}
      {text && <span className="mt-4 text-sm text-[var(--color-text-secondary)]">{text}</span>}
    </div>
  )
}
