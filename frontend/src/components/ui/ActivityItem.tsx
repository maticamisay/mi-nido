import { cn } from '@/lib/utils'
import NidoAvatar from './NidoAvatar'

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
        <NidoAvatar
          name={initials || '??'}
          size="sm"
          color={color}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">{time}</p>
      </div>
    </div>
  )
}
