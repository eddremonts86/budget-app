import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function Combobox({ options, value, onChange, placeholder, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={cn('relative w-full', className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        type="button"
        onClick={() => setOpen(!open)}
      >
        {selectedOption?.label || placeholder || 'Select option...'}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:bg-accent focus:text-accent-foreground',
                'cursor-pointer',
                value === option.value && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {value === option.value && <Check className="h-4 w-4" />}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
