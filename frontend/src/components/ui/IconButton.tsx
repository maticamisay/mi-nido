'use client'

import { ReactNode } from 'react'
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

const variantStyles = {
  ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
  outline: 'border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700',
  danger: 'text-red-400 hover:bg-red-50 hover:text-red-600',
}

const sizeStyles = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
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
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon}
    </button>
  )
}
