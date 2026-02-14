'use client'

import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  photo?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function Avatar({ name, size = 'md', color, className, photo }: AvatarProps) {
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] || ''
  const lastName = parts[parts.length - 1] || ''
  const initials = getInitials(firstName, lastName)

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white',
        sizeClasses[size],
        !color && 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]',
        className
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {initials}
    </div>
  )
}
