import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { useTheme } from '@/shared/providers'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering theme-specific classes after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'p-2 rounded-md transition-colors',
          mounted && theme === 'light' ? 'bg-secondary' : 'hover:bg-secondary/50',
        )}
        aria-label="Light theme"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'p-2 rounded-md transition-colors',
          mounted && theme === 'dark' ? 'bg-secondary' : 'hover:bg-secondary/50',
        )}
        aria-label="Dark theme"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={cn(
          'p-2 rounded-md transition-colors',
          mounted && theme === 'system' ? 'bg-secondary' : 'hover:bg-secondary/50',
        )}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  )
}
