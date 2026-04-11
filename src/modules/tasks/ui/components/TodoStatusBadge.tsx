import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { getStatusLabels, STATUS_BADGE_VARIANTS } from '../../model/constants'

interface TodoStatusBadgeProps {
  status: string
  className?: string
}

export function TodoStatusBadge({ status, className }: TodoStatusBadgeProps) {
  const { t } = useTranslation()
  const labels = getStatusLabels(t)

  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize px-3 py-1 rounded-full border font-medium',
        STATUS_BADGE_VARIANTS[status],
        className,
      )}
    >
      {labels[status] || status}
    </Badge>
  )
}
