import { Toaster as SileoToaster } from 'sileo'
import 'sileo/styles.css'

export function Toaster() {
  return (
    <SileoToaster
      position="top-right"
      options={{
        fill: 'var(--card)',
        styles: {
          title: 'text-foreground font-semibold',
          description: 'text-muted-foreground text-sm',
          button:
            'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-medium px-2 py-1',
          // Use CSS variables for badge to ensure theme adaptability
          badge: 'bg-primary/10 text-primary',
        },
      }}
    />
  )
}
