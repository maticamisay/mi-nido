'use client'

import { cn } from '@/lib/utils'

interface EmojiIconBoxProps {
  emoji: string
  size?: 'sm' | 'md' | 'lg'
  bgColor?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10 text-lg rounded-xl',
  md: 'w-12 h-12 text-2xl rounded-xl',
  lg: 'w-16 h-16 text-3xl rounded-xl',
}

export default function EmojiIconBox({ emoji, size = 'md', bgColor, className }: EmojiIconBoxProps) {
  return (
    <div
      className={cn('flex items-center justify-center', sizeClasses[size], className)}
      style={{ backgroundColor: bgColor || '#f3f4f6' }}
    >
      {emoji}
    </div>
  )
}
