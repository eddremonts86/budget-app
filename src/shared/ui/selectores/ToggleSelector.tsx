import type { ComponentType } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export interface ToggleSelectorItem {
  id: string
  name: string
  icon?: ComponentType<{ className?: string }>
  flag?: string
}

interface ToggleSelectorProps {
  items: ToggleSelectorItem[]
  value: string
  onChange: (value: string) => void
}

export function ToggleSelector({ items, value, onChange }: ToggleSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v)
        }}
        className="justify-start"
      >
        {items.map(({ id, name, icon: Icon, flag }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={name}
            className="flex items-center gap-2 px-4"
          >
            {flag && <span aria-hidden="true">{flag}</span>}
            {Icon && !flag && <Icon className="size-4" />}
            <span>{name}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
