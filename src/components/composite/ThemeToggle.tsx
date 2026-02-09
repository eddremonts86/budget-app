import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useEffect, useState, memo, useMemo, useCallback } from 'react'
import { useTheme } from '@/shared/providers/theme-context'
import { cn } from '@/shared/utils'

type Theme = 'light' | 'dark' | 'system'

interface ThemeOption {
  value: Theme
  icon: LucideIcon
  label: string
}

const ThemeButton = memo(
  ({
    option,
    isActive,
    onClick,
  }: {
    option: ThemeOption
    isActive: boolean
    onClick: (theme: Theme) => void
  }) => {
    const Icon = option.icon

    return (
      <button
        type="button"
        onClick={() => onClick(option.value)}
        className={cn(
          'p-2 rounded-md transition-colors',
          isActive ? 'bg-secondary text-primary' : 'hover:bg-secondary/50 text-muted-foreground',
        )}
        aria-label={option.label}
        aria-pressed={isActive}
      >
        <Icon className="h-4 w-4" />
      </button>
    )
  },
)

ThemeButton.displayName = 'ThemeButton'

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering theme-specific classes after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const themeOptions = useMemo<ThemeOption[]>(
    () => [
      { value: 'light', icon: Sun, label: 'Light theme' },
      { value: 'dark', icon: Moon, label: 'Dark theme' },
      { value: 'system', icon: Monitor, label: 'System theme' },
    ],
    [],
  )

  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme)
    },
    [setTheme],
  )

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1 bg-background/50">
      {themeOptions.map((option) => (
        <ThemeButton
          key={option.value}
          option={option}
          isActive={mounted && theme === option.value}
          onClick={handleThemeChange}
        />
      ))}
    </div>
  )
})
