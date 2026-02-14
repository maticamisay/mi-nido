'use client'

import { ReactNode } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface IconButtonProps {
  icon: ReactNode
  onClick: () => void
  variant?: 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md'
  label: string
  className?: string
  disabled?: boolean
}

const variantMap = {
  ghost: 'ghost' as const,
  outline: 'outline' as const,
  danger: 'ghost' as const,
}

export default function IconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  label,
  className,
  disabled,
}: IconButtonProps) {
  return (
    <Button
      type="button"
      variant={variantMap[variant]}
      size="icon"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        variant === 'danger' && 'text-destructive hover:text-destructive hover:bg-destructive/10',
        className
      )}
    >
      {icon}
    </Button>
  )
}
