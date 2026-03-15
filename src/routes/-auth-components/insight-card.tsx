import type { ComponentType } from 'react'

interface InsightCardProps {
  icon: ComponentType<{ className?: string }>
  text: string
}

export function InsightCard({ icon: Icon, text }: InsightCardProps): React.JSX.Element {
  return (
    <div className="rounded-[1.5rem] border border-border/50 bg-background/70 p-5 transition-transform duration-300 hover:-translate-y-1">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  )
}
