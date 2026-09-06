import { cn } from '@/lib/utils'
import { Platform, ContentStatus, IdeaStatus, SponsorStatus, Priority } from '@/lib/types'
import { platformColor, statusColor, priorityColor, statusLabel, platformLabel } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'platform' | 'status' | 'priority'
  platform?: Platform
  status?: ContentStatus | IdeaStatus | SponsorStatus
  priority?: Priority
  children?: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', platform, status, priority, children, className }: BadgeProps) {
  const base = 'inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-1 rounded-md'

  if (variant === 'platform' && platform) {
    return (
      <span
        className={cn(base, 'border')}
        style={{ borderColor: `${platformColor(platform)}30`, color: platformColor(platform) }}
      >
        {platformLabel(platform)}
      </span>
    )
  }

  if (variant === 'status' && status) {
    return (
      <span
        className={cn(base, 'border')}
        style={{ borderColor: `${statusColor(status)}30`, color: statusColor(status) }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor(status) }} />
        {statusLabel(status)}
      </span>
    )
  }

  if (variant === 'priority' && priority) {
    return (
      <span
        className={cn(base, 'border')}
        style={{ borderColor: `${priorityColor(priority)}30`, color: priorityColor(priority) }}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  return (
    <span className={cn(base, 'bg-white/5 text-white/50 border border-white/10', className)}>
      {children}
    </span>
  )
}
