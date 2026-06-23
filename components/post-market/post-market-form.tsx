'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import {
  getPitfalls,
  getPostMarketEntry,
  seedPitfalls,
  upsertPostMarketEntry,
  type Pitfall,
  type PostMarketEntry,
} from '@/lib/post-market'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PitfallSelector } from '@/components/post-market/pitfall-selector'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DAY_START_OPTIONS = ['Rustig', 'Gefocust', 'Twijfelend', 'Onrustig']
const DAY_END_OPTIONS = ['Rustig', 'Tevreden', 'Gehaast', 'Gefrustreerd']

type FollowedPlan = 'yes' | 'partially' | 'no'

type FormState = {
  day_start_feeling: string | null
  day_end_feeling: string | null
  followed_plan: FollowedPlan | null
  what_went_well: string
  what_went_less_well: string
  mental_shifts: string
  pitfalls_present: string[]
  take_forward: string
  free_reflection: string
}

const EMPTY_FORM: FormState = {
  day_start_feeling: null,
  day_end_feeling: null,
  followed_plan: null,
  what_went_well: '',
  what_went_less_well: '',
  mental_shifts: '',
  pitfalls_present: [],
  take_forward: '',
  free_reflection: '',
}

function parsePitfallIds(value: PostMarketEntry['pitfalls_present']): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function entryToFormState(entry: PostMarketEntry): FormState {
  return {
    day_start_feeling: entry.day_start_feeling,
    day_end_feeling: entry.day_end_feeling,
    followed_plan: entry.followed_plan,
    what_went_well: entry.what_went_well ?? '',
    what_went_less_well: entry.what_went_less_well ?? '',
    mental_shifts: entry.mental_shifts ?? '',
    pitfalls_present: parsePitfallIds(entry.pitfalls_present),
    take_forward: entry.take_forward ?? '',
    free_reflection: entry.free_reflection ?? '',
  }
}

const FOLLOWED_PLAN_LABELS: Record<FollowedPlan, string> = {
  yes: 'Ja',
  partially: 'Gedeeltelijk',
  no: 'Nee',
}

export function PostMarketForm({ date }: { date: string }) {
  const supabase = React.useMemo(() => createClient(), [])

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [pitfalls, setPitfalls] = React.useState<Pitfall[]>([])
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

      await seedPitfalls(supabase, user.id)

      const [pitfallsData, entry] = await Promise.all([
        getPitfalls(supabase, user.id),
        getPostMarketEntry(supabase, user.id, date),
      ])

      setPitfalls(pitfallsData)
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

        await upsertPostMarketEntry(supabase, user.id, date, form)
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
    <div className="space-y-8">
      <div className="space-y-6 rounded-lg border p-4">
        <h2 className="font-semibold">Gestructureerde reflectie</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="day_start_feeling">Hoe begon mijn tradingdag?</Label>
            <Select
              value={form.day_start_feeling ?? undefined}
              onValueChange={(value) => update('day_start_feeling', value)}
            >
              <SelectTrigger id="day_start_feeling">
                <SelectValue placeholder="Selecteer..." />
              </SelectTrigger>
              <SelectContent>
                {DAY_START_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="day_end_feeling">Hoe eindigde mijn tradingdag?</Label>
            <Select
              value={form.day_end_feeling ?? undefined}
              onValueChange={(value) => update('day_end_feeling', value)}
            >
              <SelectTrigger id="day_end_feeling">
                <SelectValue placeholder="Selecteer..." />
              </SelectTrigger>
              <SelectContent>
                {DAY_END_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="followed_plan">Heb ik mijn tradingplan gevolgd?</Label>
            <Select
              value={form.followed_plan ?? undefined}
              onValueChange={(value) => update('followed_plan', value as FollowedPlan)}
            >
              <SelectTrigger id="followed_plan" className="max-w-sm">
                <SelectValue placeholder="Selecteer..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(FOLLOWED_PLAN_LABELS) as [FollowedPlan, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="what_went_well">Wat ging goed vandaag?</Label>
          <Textarea
            id="what_went_well"
            value={form.what_went_well}
            onChange={(e) => update('what_went_well', e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="what_went_less_well">Wat ging minder goed vandaag?</Label>
          <Textarea
            id="what_went_less_well"
            value={form.what_went_less_well}
            onChange={(e) => update('what_went_less_well', e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mental_shifts">Welke mentale verschuivingen voelde ik?</Label>
          <Textarea
            id="mental_shifts"
            value={form.mental_shifts}
            onChange={(e) => update('mental_shifts', e.target.value)}
            placeholder='Bijv. "Na verlies bleef ik te lang kijken"'
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Welke valkuilen waren aanwezig?</Label>
          <PitfallSelector
            pitfalls={pitfalls}
            selectedIds={form.pitfalls_present}
            onChange={(ids) => update('pitfalls_present', ids)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="take_forward">Wat neem ik mee naar morgen?</Label>
          <Textarea
            id="take_forward"
            value={form.take_forward}
            onChange={(e) => update('take_forward', e.target.value)}
            rows={3}
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
          placeholder="Extra observaties die niet in deel 1 passen"
          rows={8}
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
