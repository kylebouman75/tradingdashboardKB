'use client'

import type { CustomFieldDefinition } from '@/lib/trades'
import { Label } from '@/components/ui/label'
import { CustomFieldInput } from '@/components/trades/custom-field-input'

export function CustomFieldsForm({
  definitions,
  values,
  onChange,
}: {
  definitions: CustomFieldDefinition[]
  values: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
}) {
  const visibleDefinitions = definitions.filter((definition) => !definition.is_hidden)

  if (visibleDefinitions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Eigen velden</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {visibleDefinitions.map((definition) => (
          <div key={definition.id} className="space-y-2">
            <Label>{definition.name}</Label>
            <CustomFieldInput
              definition={definition}
              value={values[definition.id]}
              onChange={(value) => onChange(definition.id, value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
