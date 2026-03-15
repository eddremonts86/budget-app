import { Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/shared/utils/index'
import type { ActionVerb } from '../ActionConfirmationCard.utils'

interface ActionCardHeaderProps {
  verb: ActionVerb
  label: string
  visualConfig: {
    color: string
  }
  EntityIcon: React.ElementType
}

export function ActionCardHeader({ verb, label, visualConfig, EntityIcon }: ActionCardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 text-white bg-gradient-to-r',
        visualConfig.color,
      )}
    >
      {verb === 'delete' ? (
        <Trash2 size={16} />
      ) : verb === 'update' ? (
        <Pencil size={16} />
      ) : (
        <EntityIcon size={16} />
      )}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
  )
}
