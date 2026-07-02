'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { createBacktest, updateBacktest, type Backtest } from '@/lib/backtest'
import { getStrategies, type Strategy } from '@/lib/strategies'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BacktestScreenshotSection } from '@/components/backtest/backtest-screenshot-section'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type FormState = {
  date: string
  symbol: string
  strategy_id: string | null
  hypothesis: string
  market_context: string
  setup_description: string
  entry_criteria: string
  exit_criteria: string
  rr: string
  what_worked: string
  what_didnt: string
  observations: string
  conclusion: string
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function backtestToFormState(backtest: Backtest): FormState {
  return {
    date: backtest.date,
    symbol: backtest.symbol,
    strategy_id: backtest.strategy_id,
    hypothesis: backtest.hypothesis ?? '',
    market_context: backtest.market_context ?? '',
    setup_description: backtest.setup_description ?? '',
    entry_criteria: backtest.entry_criteria ?? '',
    exit_criteria: backtest.exit_criteria ?? '',
    rr: backtest.rr !== null ? String(backtest.rr) : '',
    what_worked: backtest.what_worked ?? '',
    what_didnt: backtest.what_didnt ?? '',
    observations: backtest.observations ?? '',
    conclusion: backtest.conclusion ?? '',
  }
}

function emptyFormState(): FormState {
  return {
    date: todayIso(),
    symbol: '',
    strategy_id: null,
    hypothesis: '',
    market_context: '',
    setup_description: '',
    entry_criteria: '',
    exit_criteria: '',
    rr: '',
    what_worked: '',
    what_didnt: '',
    observations: '',
    conclusion: '',
  }
}

function isFormValid(form: FormState) {
  return Boolean(form.date && form.symbol)
}

export function BacktestForm({ backtest }: { backtest?: Backtest }) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const [form, setForm] = React.useState<FormState>(() =>
    backtest ? backtestToFormState(backtest) : emptyFormState()
  )
  const [backtestId, setBacktestId] = React.useState<string | null>(backtest?.id ?? null)
  const [strategies, setStrategies] = React.useState<Strategy[]>([])
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

      const strategiesData = await getStrategies(supabase, user.id)
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

        const payload = {
          date: form.date,
          symbol: form.symbol,
          strategy_id: form.strategy_id,
          hypothesis: form.hypothesis || null,
          market_context: form.market_context || null,
          setup_description: form.setup_description || null,
          entry_criteria: form.entry_criteria || null,
          exit_criteria: form.exit_criteria || null,
          rr: form.rr ? Number(form.rr) : null,
          what_worked: form.what_worked || null,
          what_didnt: form.what_didnt || null,
          observations: form.observations || null,
          conclusion: form.conclusion || null,
        }

        if (backtestId) {
          await updateBacktest(supabase, backtestId, payload)
        } else {
          const created = await createBacktest(supabase, user.id, payload)
          setBacktestId(created.id)
          router.replace(`/research/backtest/${created.id}/edit`)
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="hypothesis">Hypothese</Label>
        <Textarea
          id="hypothesis"
          value={form.hypothesis}
          onChange={(e) => update('hypothesis', e.target.value)}
          placeholder="Wat wil ik testen of onderzoeken met deze backtest?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="market_context">Marktcontext</Label>
        <Textarea
          id="market_context"
          value={form.market_context}
          onChange={(e) => update('market_context', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="setup_description">Setup omschrijving</Label>
        <Textarea
          id="setup_description"
          value={form.setup_description}
          onChange={(e) => update('setup_description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="entry_criteria">Entry criteria</Label>
          <Textarea
            id="entry_criteria"
            value={form.entry_criteria}
            onChange={(e) => update('entry_criteria', e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exit_criteria">Exit criteria</Label>
          <Textarea
            id="exit_criteria"
            value={form.exit_criteria}
            onChange={(e) => update('exit_criteria', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="what_worked">Wat werkte</Label>
          <Textarea
            id="what_worked"
            value={form.what_worked}
            onChange={(e) => update('what_worked', e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="what_didnt">Wat werkte niet</Label>
          <Textarea
            id="what_didnt"
            value={form.what_didnt}
            onChange={(e) => update('what_didnt', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observaties</Label>
        <Textarea
          id="observations"
          value={form.observations}
          onChange={(e) => update('observations', e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="conclusion">Conclusie</Label>
        <Textarea
          id="conclusion"
          value={form.conclusion}
          onChange={(e) => update('conclusion', e.target.value)}
          rows={4}
        />
      </div>

      {backtestId && <BacktestScreenshotSection backtestId={backtestId} />}

      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Deze backtest wordt automatisch opgeslagen. Er is geen opslaanknop nodig.
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
