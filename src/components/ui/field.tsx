import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/shared/lib/utils'

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('space-y-4', className)} {...props} />
  },
)
FieldGroup.displayName = 'FieldGroup'

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('space-y-2', className)} {...props} />
  },
)
Field.displayName = 'Field'

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className,
    )}
    {...props}
  />
))
FieldLabel.displayName = 'FieldLabel'

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
FieldDescription.displayName = 'FieldDescription'

const FieldError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { errors?: string[] }
>(({ className, errors, children, ...props }, ref) => {
  const error = errors?.[0] || children

  if (!error) {
    return null
  }

  return (
    <p ref={ref} className={cn('text-sm font-medium text-destructive', className)} {...props}>
      {error}
    </p>
  )
})
FieldError.displayName = 'FieldError'

export { Field, FieldGroup, FieldLabel, FieldDescription, FieldError }
