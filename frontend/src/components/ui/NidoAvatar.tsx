'use client'

import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'

interface NidoAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  photo?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export default function NidoAvatar({ name, size = 'md', color, className, photo }: NidoAvatarProps) {
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] || ''
  const lastName = parts[parts.length - 1] || ''
  const initials = getInitials(firstName, lastName)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {photo && <AvatarImage src={photo} alt={name} />}
      <AvatarFallback
        className="font-bold text-white"
        style={color ? { backgroundColor: color } : { background: 'linear-gradient(135deg, var(--color-nido-300), var(--color-nido-400))' }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
