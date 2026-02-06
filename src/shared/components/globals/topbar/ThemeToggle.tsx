import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/providers'
import { cn } from '@/shared/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'p-2 rounded-md transition-colors',
          theme === 'light' ? 'bg-secondary' : 'hover:bg-secondary/50',
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
          theme === 'dark' ? 'bg-secondary' : 'hover:bg-secondary/50',
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
          theme === 'system' ? 'bg-secondary' : 'hover:bg-secondary/50',
        )}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  )
}
