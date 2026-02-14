'use client'

import { cn } from '@/lib/utils'

interface ClassroomInfoCardProps {
  classroom: {
    name: string
    emoji?: string
    color?: string
  }
  stats: {
    label: string
    value: string | number
  }[]
  onClick?: () => void
  className?: string
}

export default function ClassroomInfoCard({
  classroom,
  stats,
  onClick,
  className,
}: ClassroomInfoCardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.98]',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        {classroom.emoji && (
          <span className="text-2xl">{classroom.emoji}</span>
        )}
        <h3
          className="text-lg font-semibold text-gray-900"
          style={classroom.color ? { color: classroom.color } : undefined}
        >
          {classroom.name}
        </h3>
      </div>
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </Component>
  )
}
