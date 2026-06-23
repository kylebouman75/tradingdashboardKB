'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import {
  createTrade,
  ensureSeedData,
  getCustomFieldDefinitions,
  getEmotions,
  getTradeById,
  getTradingSessions,
  updateTrade,
  type CustomFieldDefinition,
  type Emotion,
  type Trade,
  type TradingSession,
} from '@/lib/trades'
import { getStrategies, type Strategy } from '@/lib/strategies'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomFieldsForm } from '@/components/trades/custom-fields-form'
import { ScreenshotSection } from '@/components/trades/screenshot-section'
import type { Json } from '@/types/supabase'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type FormState = {
  date: string
  time: string
  session_id: string | null
  symbol: string
  strategy_id: string | null
  direction: 'long' | 'short' | null
  outcome: 'win' | 'loss' | 'breakeven' | null
  rr: string
  technical_analysis: string
  trade_management_notes: string
  emotion_id: string | null
  custom_field_values: Record<string, unknown>
}

function parseCustomFieldValues(value: Trade['custom_field_values']): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5)
}

function tradeToFormState(trade: Trade): FormState {
  return {
    date: trade.date,
    time: trade.time?.slice(0, 5) ?? '',
    session_id: trade.session_id,
    symbol: trade.symbol,
    strategy_id: trade.strategy_id,
    direction: trade.direction,
    outcome: trade.outcome,
    rr: trade.rr !== null ? String(trade.rr) : '',
    technical_analysis: trade.technical_analysis ?? '',
    trade_management_notes: trade.trade_management_notes ?? '',
    emotion_id: trade.emotion_id,
    custom_field_values: parseCustomFieldValues(trade.custom_field_values),
  }
}

function emptyFormState(): FormState {
  return {
    date: todayIso(),
    time: nowTime(),
    session_id: null,
    symbol: '',
    strategy_id: null,
    direction: null,
    outcome: null,
    rr: '',
    technical_analysis: '',
    trade_management_notes: '',
    emotion_id: null,
    custom_field_values: {},
  }
}

function isFormValid(form: FormState) {
  return Boolean(form.date && form.time && form.symbol && form.direction && form.outcome)
}

export function TradeForm({ trade }: { trade?: Trade }) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const [form, setForm] = React.useState<FormState>(() =>
    trade ? tradeToFormState(trade) : emptyFormState()
  )
  const [tradeId, setTradeId] = React.useState<string | null>(trade?.id ?? null)
  const [sessions, setSessions] = React.useState<TradingSession[]>([])
  const [emotions, setEmotions] = React.useState<Emotion[]>([])
  const [strategies, setStrategies] = React.useState<Strategy[]>([])
  const [customFields, setCustomFields] = React.useState<CustomFieldDefinition[]>([])
  const [status, setStatus] = React.useState<SaveStatus>('idle')

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()
  const skipNextSave = React.useRef(true)
  const hasInitialized = React.useRef(false)

  React.useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function loadLists() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await ensureSeedData(supabase, user.id)

      const [sessionsData, emotionsData, customFieldsData, strategiesData] = await Promise.all([
        getTradingSessions(supabase, user.id),
        getEmotions(supabase, user.id),
        getCustomFieldDefinitions(supabase, user.id),
        getStrategies(supabase, user.id),
      ])
      setSessions(sessionsData)
      setEmotions(emotionsData)
      setCustomFields(customFieldsData)
      setStrategies(strategiesData)
    }

    loadLists()
  }, [supabase])

  React.useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (!isFormValid(form)) {
      return
    }

    setStatus('saving')

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Geen gebruiker gevonden')

        // Verborgen custom fields zijn niet bewerkbaar in dit formulier. Alleen de
        // zichtbare velden mogen de opgeslagen waarde overschrijven; de waarde van
        // verborgen velden wordt altijd opnieuw uit de database gehaald zodat een
        // verouderde lokale kopie deze nooit kan wissen.
        let customFieldValuesPayload: Json = form.custom_field_values as Json

        if (tradeId) {
          const latestTrade = await getTradeById(supabase, tradeId)
          const latestValues = parseCustomFieldValues(latestTrade?.custom_field_values ?? null)
          const visibleFieldIds = customFields
            .filter((field) => !field.is_hidden)
            .map((field) => field.id)

          const merged: Record<string, unknown> = { ...latestValues }
          for (const fieldId of visibleFieldIds) {
            if (fieldId in form.custom_field_values) {
              merged[fieldId] = form.custom_field_values[fieldId]
            }
          }
          customFieldValuesPayload = merged as Json
        }

        const payload = {
          date: form.date,
          time: form.time,
          session_id: form.session_id,
          symbol: form.symbol,
          strategy_id: form.strategy_id,
          direction: form.direction as 'long' | 'short',
          outcome: form.outcome as 'win' | 'loss' | 'breakeven',
          rr: form.rr ? Number(form.rr) : null,
          technical_analysis: form.technical_analysis || null,
          trade_management_notes: form.trade_management_notes || null,
          emotion_id: form.emotion_id,
          custom_field_values: customFieldValuesPayload,
        }

        if (tradeId) {
          await updateTrade(supabase, tradeId, payload)
        } else {
          const created = await createTrade(supabase, user.id, payload)
          setTradeId(created.id)
          router.replace(`/trading/trade-log/${created.id}/edit`)
        }

        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, 1000)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateCustomField(fieldId: string, value: unknown) {
    setForm((prev) => ({
      ...prev,
      custom_field_values: { ...prev.custom_field_values, [fieldId]: value },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Datum</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Tijd</Label>
          <Input
            id="time"
            type="time"
            value={form.time}
            onChange={(e) => update('time', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session">Trading sessie</Label>
          <Select
            value={form.session_id ?? undefined}
            onValueChange={(value) => update('session_id', value)}
          >
            <SelectTrigger id="session">
              <SelectValue placeholder="Selecteer sessie" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            value={form.symbol}
            onChange={(e) => update('symbol', e.target.value)}
            placeholder="bijv. ES, NQ, EURUSD"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="strategy">Strategie</Label>
          <Select
            value={form.strategy_id ?? 'none'}
            onValueChange={(value) => update('strategy_id', value === 'none' ? null : value)}
          >
            <SelectTrigger id="strategy">
              <SelectValue placeholder="Geen strategie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Geen strategie</SelectItem>
              {strategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Richting</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={form.direction ?? undefined}
            onValueChange={(value) => {
              if (value) update('direction', value as 'long' | 'short')
            }}
          >
            <ToggleGroupItem value="long">Long</ToggleGroupItem>
            <ToggleGroupItem value="short">Short</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label>Uitkomst</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={form.outcome ?? undefined}
            onValueChange={(value) => {
              if (value) update('outcome', value as 'win' | 'loss' | 'breakeven')
            }}
          >
            <ToggleGroupItem value="win">Win</ToggleGroupItem>
            <ToggleGroupItem value="loss">Loss</ToggleGroupItem>
            <ToggleGroupItem value="breakeven">Break-even</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rr">RR</Label>
          <Input
            id="rr"
            type="number"
            step="0.1"
            value={form.rr}
            onChange={(e) => update('rr', e.target.value)}
            placeholder="bijv. 1.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emotion">Emotie</Label>
          <Select
            value={form.emotion_id ?? undefined}
            onValueChange={(value) => update('emotion_id', value)}
          >
            <SelectTrigger id="emotion">
              <SelectValue placeholder="Selecteer emotie" />
            </SelectTrigger>
            <SelectContent>
              {emotions.map((emotion) => (
                <SelectItem key={emotion.id} value={emotion.id}>
                  {emotion.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="technical_analysis">Technische analyse</Label>
        <Textarea
          id="technical_analysis"
          value={form.technical_analysis}
          onChange={(e) => update('technical_analysis', e.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trade_management_notes">Trade management notes</Label>
        <Textarea
          id="trade_management_notes"
          value={form.trade_management_notes}
          onChange={(e) => update('trade_management_notes', e.target.value)}
          rows={5}
        />
      </div>

      <CustomFieldsForm
        definitions={customFields}
        values={form.custom_field_values}
        onChange={updateCustomField}
      />

      {tradeId && <ScreenshotSection tradeId={tradeId} />}

      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Deze trade wordt automatisch opgeslagen. Er is geen opslaanknop nodig.
        </span>
        <SaveIndicator status={status} />
      </div>
    </div>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  const text: Record<SaveStatus, string> = {
    idle: '',
    saving: 'Opslaan...',
    saved: 'Opgeslagen',
    error: 'Fout bij opslaan',
  }

  const color: Record<SaveStatus, string> = {
    idle: '',
    saving: 'text-muted-foreground',
    saved: 'text-green-400',
    error: 'text-red-400',
  }

  return <span className={`text-sm ${color[status]}`}>{text[status]}</span>
}
