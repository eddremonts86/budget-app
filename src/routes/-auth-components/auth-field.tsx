import { Input, Label } from '@/components/ui'

interface AuthFieldProps {
  id: string
  label: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  value: string
}

export function AuthField({
  id,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: AuthFieldProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
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
