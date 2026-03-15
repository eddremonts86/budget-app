import { Input, Label } from '@/components/ui'

interface AuthFieldProps {
  autoComplete?: string
  id: string
  label: string
  minLength?: number
  name?: string
  onChange: (value: string) => void
  pattern?: string
  placeholder: string
  testId?: string
  type?: string
  value: string
}

export function AuthField({
  autoComplete,
  id,
  label,
  minLength,
  name,
  onChange,
  pattern,
  placeholder,
  testId,
  type = 'text',
  value,
}: AuthFieldProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        data-testid={testId}
        autoComplete={autoComplete}
        minLength={minLength}
        name={name}
        pattern={pattern}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl"
        required
      />
    </div>
  )
}
