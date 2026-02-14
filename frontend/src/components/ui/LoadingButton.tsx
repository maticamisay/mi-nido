'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import LoadingSpinner from './LoadingSpinner'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  children: ReactNode
}

export default function LoadingButton({
  loading,
  variant = 'default',
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      disabled={loading || disabled}
      className={cn('gap-2', className)}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" variant="white" />}
      {children}
    </Button>
  )
}
