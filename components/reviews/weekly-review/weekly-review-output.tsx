import { Textarea } from '@/components/ui/textarea'

export function WeeklyReviewOutput({
  value,
  onChange,
  readOnly,
}: {
  value: string
  onChange?: (value: string) => void
  readOnly: boolean
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      rows={28}
      className="font-mono text-sm leading-relaxed"
    />
  )
}
