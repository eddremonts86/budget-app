import { Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { getPriorityLabels, PRIORITY_BADGE_VARIANTS } from '../../model/constants'

interface TodoPriorityBadgeProps {
  priority: string
  className?: string
}

export function TodoPriorityBadge({ priority, className }: TodoPriorityBadgeProps) {
  const { t } = useTranslation()
  const labels = getPriorityLabels(t)

  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize px-3 py-1 rounded-full border font-medium',
        PRIORITY_BADGE_VARIANTS[priority],
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Flag className="w-3 h-3" />
        {labels[priority] || priority}
      </div>
    </Badge>
  )
}
