import { format } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/shared/utils'
import { Button } from './button'
import { Calendar as CalendarComponent } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabledDates?: (date: Date) => boolean
  className?: string
  /** Allow clearing the date (sets value to empty string) */
  optional?: boolean
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabledDates,
  className,
  optional = false,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  // Parse date safely: avoid timezone offset shifting the date back a day
  const date = React.useMemo(() => {
    if (!value) return undefined
    const [year, month, day] = value.split('T')[0].split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const y = selectedDate.getFullYear()
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const d = String(selectedDate.getDate()).padStart(2, '0')
      onChange(`${y}-${m}-${d}`)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <Calendar className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{date ? format(date, 'PPP') : placeholder}</span>
          {optional && date && (
            <X
              className="ml-2 h-3.5 w-3.5 shrink-0 opacity-60 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
