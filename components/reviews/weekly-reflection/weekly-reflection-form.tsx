'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import {
  completeWeeklyReflection,
  getPitfalls,
  getWeeklyReflection,
  upsertWeeklyReflection,
  DEFAULT_WEEK_FEELINGS,
  type WeeklyReflection,
} from '@/lib/weekly-reflection'
import { seedPitfalls, type Pitfall } from '@/lib/post-market'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { WeekFeelingsSelector } from '@/components/reviews/weekly-reflection/week-feelings-selector'
import { PitfallSelector } from '@/components/post-market/pitfall-selector'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type FormState = {
  week_feelings: string[]
  structural_good: string
  energy_cost: string
  recurring_pitfalls: string[]
  proud_of: string
  improve_next_week: string
  free_reflection: string
}

const EMPTY_FORM: FormState = {
  week_feelings: [],
  structural_good: '',
  energy_cost: '',
  recurring_pitfalls: [],
  proud_of: '',
  improve_next_week: '',
  free_reflection: '',
}

function reflectionToFormState(r: WeeklyReflection): FormState {
  return {
    week_feelings: Array.isArray(r.week_feelings)
      ? r.week_feelings.filter((v): v is string => typeof v === 'string')
      : [],
    structural_good: r.structural_good ?? '',
    energy_cost: r.energy_cost ?? '',
    recurring_pitfalls: Array.isArray(r.recurring_pitfalls)
      ? r.recurring_pitfalls.filter((v): v is string => typeof v === 'string')
      : [],
    proud_of: r.proud_of ?? '',
    improve_next_week: r.improve_next_week ?? '',
    free_reflection: r.free_reflection ?? '',
  }
}

export function WeeklyReflectionForm({ weekStartDate }: { weekStartDate: string }) {
  const supabase = React.useMemo(() => createClient(), [])

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [pitfalls, setPitfalls] = React.useState<Pitfall[]>([])
  const [reflection, setReflection] = React.useState<WeeklyReflection | null>(null)
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

      await seedPitfalls(supabase, user.id)

      const [pitfallsData, existingReflection] = await Promise.all([
        getPitfalls(supabase, user.id),
        getWeeklyReflection(supabase, user.id, weekStartDate),
      ])

      setPitfalls(pitfallsData)
      if (existingReflection) {
        setReflection(existingReflection)
        setForm(reflectionToFormState(existingReflection))
      }
      setIsLoaded(true)
    }

    load()
  }, [supabase, weekStartDate])

  React.useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (reflection?.completed_at) return

    setSaveStatus('saving')

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Geen gebruiker gevonden')

        const saved = await upsertWeeklyReflection(supabase, user.id, weekStartDate, {
          week_feelings: form.week_feelings,
          structural_good: form.structural_good || null,
          energy_cost: form.energy_cost || null,
          recurring_pitfalls: form.recurring_pitfalls,
          proud_of: form.proud_of || null,
          improve_next_week: form.improve_next_week || null,
          free_reflection: form.free_reflection || null,
        })
        setReflection(saved)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 1000)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  async function handleComplete() {
    if (!reflection) return
    setIsCompleting(true)
    try {
      const completed = await completeWeeklyReflection(supabase, reflection.id)
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
        <h2 className="font-semibold">Hoe voelde deze week aan?</h2>
        <div className="space-y-2">
          <Label>Selecteer alle gevoelens die van toepassing zijn</Label>
          {isReadOnly ? (
            <div className="flex flex-wrap gap-2">
              {form.week_feelings.length > 0 ? (
                form.week_feelings.map((feeling) => (
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
            <WeekFeelingsSelector
              options={DEFAULT_WEEK_FEELINGS}
              selectedValues={form.week_feelings}
              onChange={(values) => update('week_feelings', values)}
            />
          )}
        </div>
      </div>

      <div className="space-y-6 rounded-lg border p-4">
        <h2 className="font-semibold">Weekreflectie</h2>

        <div className="space-y-2">
          <Label htmlFor="structural_good">Wat ging structureel goed deze week?</Label>
          <Textarea
            id="structural_good"
            value={form.structural_good}
            onChange={(e) => update('structural_good', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Patronen of gedragingen die consequent goed waren..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="energy_cost">Wat kostte de meeste energie of performance?</Label>
          <Textarea
            id="energy_cost"
            value={form.energy_cost}
            onChange={(e) => update('energy_cost', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Situaties, gedachten of patronen die energie wegnames..."
          />
        </div>

        <div className="space-y-2">
          <Label>Welke valkuilen kwamen terug deze week?</Label>
          {isReadOnly ? (
            <div className="flex flex-wrap gap-2">
              {form.recurring_pitfalls.length > 0 ? (
                pitfalls
                  .filter((p) => form.recurring_pitfalls.includes(p.id))
                  .map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full border border-blue-500 bg-blue-500/20 px-3 py-1.5 text-sm text-blue-400"
                    >
                      {p.name}
                    </span>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">Geen geselecteerd</p>
              )}
            </div>
          ) : (
            <PitfallSelector
              pitfalls={pitfalls}
              selectedIds={form.recurring_pitfalls}
              onChange={(ids) => update('recurring_pitfalls', ids)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proud_of">Waar ben ik trots op deze week?</Label>
          <Textarea
            id="proud_of"
            value={form.proud_of}
            onChange={(e) => update('proud_of', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Momenten van discipline, geduld of correcte uitvoering..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="improve_next_week">Wat wil ik verbeteren volgende week?</Label>
          <Textarea
            id="improve_next_week"
            value={form.improve_next_week}
            onChange={(e) => update('improve_next_week', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Concreet en gedragsmatig — geen vage intenties..."
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
          <Button
            onClick={handleComplete}
            disabled={isCompleting || !reflection}
            variant="default"
          >
            {isCompleting ? 'Bezig...' : 'Reflectie voltooien'}
          </Button>
        </div>
      )}
    </div>
  )
}
