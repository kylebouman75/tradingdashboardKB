import Link from 'next/link'
import { Pencil } from 'lucide-react'

import type { CustomFieldDefinition, Emotion, Trade, TradingSession } from '@/lib/trades'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteTradeDialog } from '@/components/trades/delete-trade-dialog'
import { ScreenshotSection } from '@/components/trades/screenshot-section'

const OUTCOME_LABEL: Record<Trade['outcome'], string> = {
  win: 'Win',
  loss: 'Loss',
  breakeven: 'Break-even',
}

const OUTCOME_BADGE: Record<Trade['outcome'], string> = {
  win: 'bg-green-500/20 text-green-400 border-green-500/30',
  loss: 'bg-red-500/20 text-red-400 border-red-500/30',
  breakeven: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const DIRECTION_LABEL: Record<Trade['direction'], string> = {
  long: 'Long',
  short: 'Short',
}

const DIRECTION_BADGE: Record<Trade['direction'], string> = {
  long: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  short: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

function formatCustomFieldValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nee'
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : null
  return String(value)
}

export function TradeDetail({
  trade,
  session,
  emotion,
  customFields,
}: {
  trade: Trade
  session: TradingSession | null
  emotion: Emotion | null
  customFields: CustomFieldDefinition[]
}) {
  const customFieldValues =
    trade.custom_field_values &&
    typeof trade.custom_field_values === 'object' &&
    !Array.isArray(trade.custom_field_values)
      ? (trade.custom_field_values as Record<string, unknown>)
      : {}

  // Alleen velden die nog bestaan ÉN niet verborgen zijn mogen getoond worden.
  // Verwijderde fields staan niet meer in `customFields` (komt al uit de
  // database-query); verborgen fields filteren we hier alsnog expliciet weg.
  const activeFieldIds = new Set(
    customFields.filter((definition) => !definition.is_hidden).map((definition) => definition.id)
  )

  const definitionById = new Map(customFields.map((definition) => [definition.id, definition]))

  const visibleCustomValues = Object.entries(customFieldValues).filter(([fieldId]) =>
    activeFieldIds.has(fieldId)
  )

  const filledCustomFields = visibleCustomValues
    .map(([fieldId, value]) => ({
      definition: definitionById.get(fieldId)!,
      display: formatCustomFieldValue(value),
    }))
    .filter((entry) => entry.display !== null)
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{trade.symbol}</h1>
            <span className="text-muted-foreground">{formatDate(trade.date)}</span>
            <Badge variant="outline" className={DIRECTION_BADGE[trade.direction]}>
              {DIRECTION_LABEL[trade.direction]}
            </Badge>
            <Badge variant="outline" className={OUTCOME_BADGE[trade.outcome]}>
              {OUTCOME_LABEL[trade.outcome]}
            </Badge>
          </div>
          {trade.rr !== null && (
            <p className="text-3xl font-semibold text-foreground">RR {trade.rr}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/trading/trade-log/${trade.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Link>
          </Button>
          <DeleteTradeDialog tradeId={trade.id} redirectAfterDelete />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Trading sessie</CardTitle>
          </CardHeader>
          <CardContent>{session?.name ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Emotie</CardTitle>
          </CardHeader>
          <CardContent>{emotion?.name ?? '—'}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Technische analyse</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">
          {trade.technical_analysis || '—'}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trade management notes</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">
          {trade.trade_management_notes || '—'}
        </CardContent>
      </Card>

      {filledCustomFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eigen velden</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {filledCustomFields.map(({ definition, display }) => (
                <div key={definition.id}>
                  <dt className="text-sm text-muted-foreground">{definition.name}</dt>
                  <dd className="text-sm">{display}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <ScreenshotSection tradeId={trade.id} allowUpload={false} />
    </div>
  )
}
