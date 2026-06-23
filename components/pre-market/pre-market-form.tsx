'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import { getTradingSessions, type TradingSession } from '@/lib/trades'
import { getPreMarketEntry, upsertPreMarketEntry, type PreMarketEntry } from '@/lib/pre-market'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScoreSelector } from '@/components/pre-market/score-selector'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type FormState = {
  session_id: string | null
  bias: string
  important_levels: string
  scenarios: string
  a_plus_criteria: string
  risk_plan: string
  mental_state: string
  focus_point: string
  avoid_today: string
  confidence_score: number | null
  stress_level: number | null
}

const EMPTY_FORM: FormState = {
  session_id: null,
  bias: '',
  important_levels: '',
  scenarios: '',
  a_plus_criteria: '',
  risk_plan: '',
  mental_state: '',
  focus_point: '',
  avoid_today: '',
  confidence_score: null,
  stress_level: null,
}

function entryToFormState(entry: PreMarketEntry): FormState {
  return {
    session_id: entry.session_id,
    bias: entry.bias ?? '',
    important_levels: entry.important_levels ?? '',
    scenarios: entry.scenarios ?? '',
    a_plus_criteria: entry.a_plus_criteria ?? '',
    risk_plan: entry.risk_plan ?? '',
    mental_state: entry.mental_state ?? '',
    focus_point: entry.focus_point ?? '',
    avoid_today: entry.avoid_today ?? '',
    confidence_score: entry.confidence_score,
    stress_level: entry.stress_level,
  }
}

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Zeer laag',
  2: 'Laag',
  3: 'Neutraal',
  4: 'Hoog',
  5: 'Zeer hoog',
}

const CONFIDENCE_DESCRIPTIONS: Record<number, string> = {
  1: 'Ik voel weinig vertrouwen in mijn plan en execution.',
  2: 'Ik heb merkbare twijfel.',
  3: 'Ik voel mij stabiel, maar niet uitgesproken zelfverzekerd.',
  4: 'Ik heb vertrouwen in mijn voorbereiding en proces.',
  5: 'Ik voel veel vertrouwen, zonder mezelf te overschatten.',
}

const STRESS_LABELS: Record<number, string> = {
  1: 'Zeer laag',
  2: 'Laag',
  3: 'Gemiddeld',
  4: 'Hoog',
  5: 'Zeer hoog',
}

const STRESS_DESCRIPTIONS: Record<number, string> = {
  1: 'Volledig rustig.',
  2: 'Lichte spanning, maar goed beheersbaar.',
  3: 'Merkbare spanning, zonder impact op mijn proces.',
  4: 'Spanning beïnvloedt mijn focus.',
  5: 'Stress beïnvloedt mijn beslissingen.',
}

export function PreMarketForm({ date }: { date: string }) {
  const supabase = React.useMemo(() => createClient(), [])

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [sessions, setSessions] = React.useState<TradingSession[]>([])
  const [status, setStatus] = React.useState<SaveStatus>('idle')
  const [isLoaded, setIsLoaded] = React.useState(false)

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()
  const skipNextSave = React.useRef(true)
  const hasInitialized = React.useRef(false)

  React.useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [sessionsData, entry] = await Promise.all([
        getTradingSessions(supabase, user.id),
        getPreMarketEntry(supabase, user.id, date),
      ])

      setSessions(sessionsData)
      setForm(entry ? entryToFormState(entry) : EMPTY_FORM)
      setIsLoaded(true)
    }

    load()
  }, [supabase, date])

  React.useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
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

        await upsertPreMarketEntry(supabase, user.id, date, form)
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

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Laden...</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="session">Trading sessie</Label>
        <Select
          value={form.session_id ?? undefined}
          onValueChange={(value) => update('session_id', value)}
        >
          <SelectTrigger id="session" className="max-w-sm">
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
        <Label htmlFor="bias">Bias</Label>
        <Textarea
          id="bias"
          value={form.bias}
          onChange={(e) => update('bias', e.target.value)}
          placeholder="Marktvisie voor de dag"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="important_levels">Belangrijke levels</Label>
        <Textarea
          id="important_levels"
          value={form.important_levels}
          onChange={(e) => update('important_levels', e.target.value)}
          placeholder="Relevante prijsniveaus"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scenarios">Scenario&apos;s</Label>
        <Textarea
          id="scenarios"
          value={form.scenarios}
          onChange={(e) => update('scenarios', e.target.value)}
          placeholder="Verwachte marktscenario's"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="a_plus_criteria">A+ setup criteria</Label>
        <Textarea
          id="a_plus_criteria"
          value={form.a_plus_criteria}
          onChange={(e) => update('a_plus_criteria', e.target.value)}
          placeholder="Criteria voor een ideale setup"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="risk_plan">Risk plan</Label>
        <Textarea
          id="risk_plan"
          value={form.risk_plan}
          onChange={(e) => update('risk_plan', e.target.value)}
          placeholder="Risicobeleid voor de dag"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mental_state">Mentale staat vóór de sessie</Label>
        <Textarea
          id="mental_state"
          value={form.mental_state}
          onChange={(e) => update('mental_state', e.target.value)}
          placeholder="Zelfobservatie van mentale toestand"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="focus_point">Focuspunt van de dag</Label>
        <Textarea
          id="focus_point"
          value={form.focus_point}
          onChange={(e) => update('focus_point', e.target.value)}
          placeholder="Één concreet aandachtspunt"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avoid_today">Wat wil ik vandaag vermijden?</Label>
        <Textarea
          id="avoid_today"
          value={form.avoid_today}
          onChange={(e) => update('avoid_today', e.target.value)}
          placeholder="Bewuste valkuilen benoemen"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Confidence score</Label>
        <ScoreSelector
          value={form.confidence_score}
          onChange={(value) => update('confidence_score', value)}
          labels={CONFIDENCE_LABELS}
          descriptions={CONFIDENCE_DESCRIPTIONS}
        />
      </div>

      <div className="space-y-2">
        <Label>Stressniveau</Label>
        <ScoreSelector
          value={form.stress_level}
          onChange={(value) => update('stress_level', value)}
          labels={STRESS_LABELS}
          descriptions={STRESS_DESCRIPTIONS}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Deze pagina wordt automatisch opgeslagen. Er is geen opslaanknop nodig.
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
