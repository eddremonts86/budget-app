import { Calendar } from 'lucide-react'
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
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabledDates,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value) : undefined

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0])
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', className)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {date ? date.toLocaleDateString() : placeholder || 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent mode="single" selected={date} onSelect={handleSelect} disabled={disabledDates} />
      </PopoverContent>
    </Popover>
  )
}
