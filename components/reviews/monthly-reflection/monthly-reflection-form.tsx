'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import {
  completeMonthlyReflection,
  getMonthlyReflection,
  upsertMonthlyReflection,
  DEFAULT_MONTH_FEELINGS,
  type MonthlyReflection,
} from '@/lib/monthly-reflection'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MonthFeelingsSelector } from '@/components/reviews/monthly-reflection/month-feelings-selector'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type FormState = {
  month_feelings: string[]
  visible_growth: string
  recurring_challenge: string
  lesson_learned: string
  improve_next_month: string
  personal_victory: string
  free_reflection: string
}

const EMPTY_FORM: FormState = {
  month_feelings: [],
  visible_growth: '',
  recurring_challenge: '',
  lesson_learned: '',
  improve_next_month: '',
  personal_victory: '',
  free_reflection: '',
}

function reflectionToFormState(r: MonthlyReflection): FormState {
  return {
    month_feelings: Array.isArray(r.month_feelings)
      ? r.month_feelings.filter((v): v is string => typeof v === 'string')
      : [],
    visible_growth: r.visible_growth ?? '',
    recurring_challenge: r.recurring_challenge ?? '',
    lesson_learned: r.lesson_learned ?? '',
    improve_next_month: r.improve_next_month ?? '',
    personal_victory: r.personal_victory ?? '',
    free_reflection: r.free_reflection ?? '',
  }
}

export function MonthlyReflectionForm({ monthYear }: { monthYear: string }) {
  const supabase = React.useMemo(() => createClient(), [])

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [reflection, setReflection] = React.useState<MonthlyReflection | null>(null)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle')
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isCompleting, setIsCompleting] = React.useState(false)

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

      const existingReflection = await getMonthlyReflection(supabase, user.id, monthYear)

      if (existingReflection) {
        setReflection(existingReflection)
        setForm(reflectionToFormState(existingReflection))
      }
      setIsLoaded(true)
    }

    load()
  }, [supabase, monthYear])

  React.useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (reflection?.completed_at) return

    setSaveStatus('saving')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Geen gebruiker gevonden')

        const saved = await upsertMonthlyReflection(supabase, user.id, monthYear, {
          month_feelings: form.month_feelings,
          visible_growth: form.visible_growth || null,
          recurring_challenge: form.recurring_challenge || null,
          lesson_learned: form.lesson_learned || null,
          improve_next_month: form.improve_next_month || null,
          personal_victory: form.personal_victory || null,
          free_reflection: form.free_reflection || null,
        })
        setReflection(saved)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  async function handleComplete() {
    if (!reflection) return
    setIsCompleting(true)
    try {
      const completed = await completeMonthlyReflection(supabase, reflection.id)
      setReflection(completed)
    } finally {
      setIsCompleting(false)
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Laden...</p>
  }

  const isCompleted = Boolean(reflection?.completed_at)
  const isReadOnly = isCompleted

  return (
    <div className="space-y-8">
      {isCompleted && (
        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
          Voltooid
        </Badge>
      )}

      <div className="space-y-6 rounded-lg border p-4">
        <h2 className="font-semibold">Hoe voelde deze maand aan?</h2>
        <div className="space-y-2">
          <Label>Selecteer alle gevoelens die van toepassing zijn</Label>
          {isReadOnly ? (
            <div className="flex flex-wrap gap-2">
              {form.month_feelings.length > 0 ? (
                form.month_feelings.map((feeling) => (
                  <span
                    key={feeling}
                    className="rounded-full border border-blue-500 bg-blue-500/20 px-3 py-1.5 text-sm text-blue-400"
                  >
                    {feeling}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Niet ingevuld</p>
              )}
            </div>
          ) : (
            <MonthFeelingsSelector
              options={DEFAULT_MONTH_FEELINGS}
              selectedValues={form.month_feelings}
              onChange={(values) => update('month_feelings', values)}
            />
          )}
        </div>
      </div>

      <div className="space-y-6 rounded-lg border p-4">
        <h2 className="font-semibold">Maandreflectie</h2>

        <div className="space-y-2">
          <Label htmlFor="visible_growth">Welke zichtbare groei zie ik in mezelf deze maand?</Label>
          <Textarea
            id="visible_growth"
            value={form.visible_growth}
            onChange={(e) => update('visible_growth', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Concrete gedragsveranderingen of mentale verschuivingen..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recurring_challenge">Welke uitdaging bleef terugkomen?</Label>
          <Textarea
            id="recurring_challenge"
            value={form.recurring_challenge}
            onChange={(e) => update('recurring_challenge', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Het patroon dat ondanks bewustzijn terugkwam..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lesson_learned">Wat is de grootste les van deze maand?</Label>
          <Textarea
            id="lesson_learned"
            value={form.lesson_learned}
            onChange={(e) => update('lesson_learned', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="De inzicht die de meeste impact heeft..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="improve_next_month">Wat wil ik verbeteren volgende maand?</Label>
          <Textarea
            id="improve_next_month"
            value={form.improve_next_month}
            onChange={(e) => update('improve_next_month', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Concreet en gedragsmatig — geen vage intenties..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="personal_victory">Wat is mijn persoonlijke overwinning van de maand?</Label>
          <Textarea
            id="personal_victory"
            value={form.personal_victory}
            onChange={(e) => update('personal_victory', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Nooit over geld — focus op discipline, mentale doorbraken, correcte uitvoering..."
          />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label htmlFor="free_reflection" className="font-semibold">
          Vrije reflectie
        </Label>
        <Textarea
          id="free_reflection"
          value={form.free_reflection}
          onChange={(e) => update('free_reflection', e.target.value)}
          readOnly={isReadOnly}
          placeholder="Alles wat niet in de bovenstaande vragen past..."
          rows={6}
        />
      </div>

      {!isCompleted && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {saveStatus === 'saving' && 'Opslaan...'}
            {saveStatus === 'saved' && 'Opgeslagen'}
            {saveStatus === 'error' && 'Fout bij opslaan'}
            {saveStatus === 'idle' && 'Wijzigingen worden automatisch opgeslagen.'}
          </span>
          <Button onClick={handleComplete} disabled={isCompleting || !reflection}>
            {isCompleting ? 'Bezig...' : 'Reflectie voltooien'}
          </Button>
        </div>
      )}
    </div>
  )
}
