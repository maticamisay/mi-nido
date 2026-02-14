import { cn } from '@/lib/utils'
import Avatar from './Avatar'

interface ActivityItemProps {
  initials?: string
  emoji?: string
  name: string
  description: string
  time: string
  color?: string
  className?: string
}

export default function ActivityItem({ initials, emoji, name, description, time, color, className }: ActivityItemProps) {
  return (
    <div className={cn('flex gap-3 group', className)}>
      {emoji ? (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: color || '#f3f4f6' }}
        >
          {emoji}
        </div>
      ) : (
        <Avatar
          name={initials || '??'}
          size="sm"
          color={color}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{time}</p>
      </div>
    </div>
  )
}
