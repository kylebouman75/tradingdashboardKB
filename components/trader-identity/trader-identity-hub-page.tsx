'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Plus, Check, Trash2, RotateCcw, Flame } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  getTraderIdentity,
  upsertTraderIdentity,
  getLatestApprovedWeeklyFocus,
  getChallenges,
  createChallenge,
  resolveChallenge,
  getStreaks,
  createStreak,
  updateStreakCount,
  deleteStreak,
  getGrowthTimeline,
  createGrowthEntry,
  resolveGrowthEntry,
  deleteGrowthEntry,
  type TraderIdentity,
  type IdentityItem,
  type IdentityChallenge,
  type ProcessStreak,
  type GrowthTimeline,
} from '@/lib/trader-identity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// ─── Types ─────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type IdentityFormState = {
  current_growth_phase: string
  a_game: IdentityItem[]
  b_game: IdentityItem[]
  c_game: IdentityItem[]
  strengths: IdentityItem[]
  mental_leaks: IdentityItem[]
  patterns: IdentityItem[]
}

const EMPTY_FORM: IdentityFormState = {
  current_growth_phase: '',
  a_game: [],
  b_game: [],
  c_game: [],
  strengths: [],
  mental_leaks: [],
  patterns: [],
}

function toItemArray(value: unknown): IdentityItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => {
      if (typeof v === 'string') return { text: v, addedAt: '' }
      if (v && typeof v === 'object' && 'text' in v) {
        return {
          text: String((v as Record<string, unknown>).text ?? ''),
          addedAt: String((v as Record<string, unknown>).addedAt ?? ''),
        }
      }
      return null
    })
    .filter((v): v is IdentityItem => v !== null)
}

function identityToFormState(identity: TraderIdentity): IdentityFormState {
  return {
    current_growth_phase: identity.current_growth_phase ?? '',
    a_game: toItemArray(identity.a_game),
    b_game: toItemArray(identity.b_game),
    c_game: toItemArray(identity.c_game),
    strengths: toItemArray(identity.strengths),
    mental_leaks: toItemArray(identity.mental_leaks),
    patterns: toItemArray(identity.patterns),
  }
}

function formatNlDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Main component ────────────────────────────────────────────────────────

export function TraderIdentityHubPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Identity form (week_focus is readonly, not part of editable state)
  const [form, setForm] = React.useState<IdentityFormState>(EMPTY_FORM)
  const [weekFocusValue, setWeekFocusValue] = React.useState<string>('')
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle')
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()
  const skipNextSave = React.useRef(true)
  const hasInitialized = React.useRef(false)

  // Sub-collections
  const [challenges, setChallenges] = React.useState<IdentityChallenge[]>([])
  const [streaks, setStreaks] = React.useState<ProcessStreak[]>([])
  const [timeline, setTimeline] = React.useState<GrowthTimeline[]>([])

  // Load all data
  React.useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const [identity, challengesData, streaksData, timelineData, latestFocus] = await Promise.all([
        getTraderIdentity(supabase, user.id),
        getChallenges(supabase, user.id),
        getStreaks(supabase, user.id),
        getGrowthTimeline(supabase, user.id),
        getLatestApprovedWeeklyFocus(supabase, user.id),
      ])

      if (identity) {
        setForm(identityToFormState(identity))
        setLastUpdatedAt(identity.last_updated_at)
      }

      // week_focus: meest recente goedgekeurde Weekly Review heeft prioriteit
      const focusToUse = latestFocus ?? identity?.week_focus ?? null
      setWeekFocusValue(focusToUse ?? '')

      // Persist als de focus veranderd is
      if (latestFocus && latestFocus !== identity?.week_focus) {
        await upsertTraderIdentity(supabase, user.id, { week_focus: latestFocus })
      }

      setChallenges(challengesData)
      setStreaks(streaksData)
      setTimeline(timelineData)
      setIsLoaded(true)
    }

    load()
  }, [supabase])

  // Autosave identity form (week_focus niet opgenomen — readonly)
  React.useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    if (!userId) return

    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const saved = await upsertTraderIdentity(supabase, userId, {
          current_growth_phase: form.current_growth_phase || null,
          a_game: form.a_game,
          b_game: form.b_game,
          c_game: form.c_game,
          strengths: form.strengths,
          mental_leaks: form.mental_leaks,
          patterns: form.patterns,
        })
        setLastUpdatedAt(saved.last_updated_at)
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

  function updateField<K extends keyof IdentityFormState>(key: K, value: IdentityFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Laden...</p>
  }

  return (
    <div className="space-y-8">
      {/* ── Trader Profiel (autosave) ───────────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Trader Profiel</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Week focus — readonly, gevuld vanuit Weekly Review */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Weekfocus</Label>
              <Badge variant="outline" className="text-xs">Vanuit Weekly Review</Badge>
            </div>
            <div className="text-sm text-foreground">
              {weekFocusValue || 'Nog geen weekfocus beschikbaar — voltooi eerst een Weekly Review'}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Vanuit Weekly Review — niet bewerkbaar
            </p>
          </div>

          {/* Huidige groeifase — bewerkbaar, toont last_updated_at */}
          <div className="space-y-2">
            <Label htmlFor="current_growth_phase">Huidige Groeifase</Label>
            <Textarea
              id="current_growth_phase"
              value={form.current_growth_phase}
              onChange={(e) => updateField('current_growth_phase', e.target.value)}
              placeholder="Waar zit ik nu in mijn ontwikkeling als trader?"
              rows={3}
            />
            {lastUpdatedAt && (
              <p className="text-xs text-muted-foreground">
                Bijgewerkt op {formatNlDate(lastUpdatedAt)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid gap-6 lg:grid-cols-3">
          <GameCard
            title="A-Game"
            description="Hoe ik eruit zie op mijn beste dag"
            color="green"
            items={form.a_game}
            onChange={(items) => updateField('a_game', items)}
            placeholder="A-game eigenschap..."
          />
          <GameCard
            title="B-Game"
            description="Mijn gemiddelde dag — functioneel maar niet top"
            color="yellow"
            items={form.b_game}
            onChange={(items) => updateField('b_game', items)}
            placeholder="B-game eigenschap..."
          />
          <GameCard
            title="C-Game"
            description="Wat mij naar beneden trekt"
            color="red"
            items={form.c_game}
            onChange={(items) => updateField('c_game', items)}
            placeholder="C-game eigenschap..."
          />
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-3">
          <ListSection
            title="Krachten"
            items={form.strengths}
            onChange={(items) => updateField('strengths', items)}
            placeholder="Een kracht van mij als trader..."
          />
          <ListSection
            title="Mentale Leaks"
            items={form.mental_leaks}
            onChange={(items) => updateField('mental_leaks', items)}
            placeholder="Een mentale leak..."
          />
          <ListSection
            title="Patronen"
            items={form.patterns}
            onChange={(items) => updateField('patterns', items)}
            placeholder="Een patroon dat ik zie..."
          />
        </div>

        <div className="flex items-center justify-end rounded-md border bg-muted/30 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {saveStatus === 'saving' && 'Opslaan...'}
            {saveStatus === 'saved' && 'Opgeslagen'}
            {saveStatus === 'error' && 'Fout bij opslaan'}
            {saveStatus === 'idle' && 'Wijzigingen worden automatisch opgeslagen'}
          </span>
        </div>
      </section>

      <Separator />

      {/* ── Identity Challenges ─────────────────────────────────────────── */}
      <ChallengesSection
        supabase={supabase}
        userId={userId!}
        challenges={challenges}
        setChallenges={setChallenges}
      />

      <Separator />

      {/* ── Process Streaks ─────────────────────────────────────────────── */}
      <StreaksSection
        supabase={supabase}
        userId={userId!}
        streaks={streaks}
        setStreaks={setStreaks}
      />

      <Separator />

      {/* ── Growth Timeline ─────────────────────────────────────────────── */}
      <GrowthTimelineSection
        supabase={supabase}
        userId={userId!}
        timeline={timeline}
        setTimeline={setTimeline}
      />
    </div>
  )
}

// ─── GameCard ──────────────────────────────────────────────────────────────

const gameColors = {
  green: 'border-green-500/30 bg-green-500/5',
  yellow: 'border-yellow-500/30 bg-yellow-500/5',
  red: 'border-red-500/30 bg-red-500/5',
} as const

const gameTitleColors = {
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
} as const

function GameCard({
  title,
  description,
  color,
  items,
  onChange,
  placeholder,
}: {
  title: string
  description: string
  color: 'green' | 'yellow' | 'red'
  items: IdentityItem[]
  onChange: (items: IdentityItem[]) => void
  placeholder: string
}) {
  return (
    <div className={`space-y-3 rounded-lg border p-4 ${gameColors[color]}`}>
      <div>
        <h3 className={`font-semibold ${gameTitleColors[color]}`}>{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <StringListEditor items={items} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

// ─── ListSection ───────────────────────────────────────────────────────────

function ListSection({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string
  items: IdentityItem[]
  onChange: (items: IdentityItem[]) => void
  placeholder: string
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">{title}</h3>
      <StringListEditor items={items} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

// ─── StringListEditor ──────────────────────────────────────────────────────

function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: IdentityItem[]
  onChange: (items: IdentityItem[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = React.useState('')

  function addItem() {
    if (!draft.trim()) return
    onChange([...items, { text: draft.trim(), addedAt: new Date().toISOString() }])
    setDraft('')
  }

  function updateItem(index: number, text: string) {
    const next = [...items]
    next[index] = {
      text,
      addedAt: next[index].addedAt || new Date().toISOString(),
    }
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="space-y-0.5">
          <Input
            value={item.text}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            className="h-8 text-sm"
          />
          {item.addedAt && !isNaN(new Date(item.addedAt).getTime()) && (
            <p className="pl-1 text-xs text-muted-foreground">
              Toegevoegd op {format(new Date(item.addedAt), 'd MMM yyyy, HH:mm', { locale: nl })}
            </p>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={addItem}
          disabled={!draft.trim()}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Toevoegen
        </Button>
      </div>
    </div>
  )
}

// ─── ChallengesSection ─────────────────────────────────────────────────────

function ChallengesSection({
  supabase,
  userId,
  challenges,
  setChallenges,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  challenges: IdentityChallenge[]
  setChallenges: React.Dispatch<React.SetStateAction<IdentityChallenge[]>>
}) {
  const [newDescription, setNewDescription] = React.useState('')
  const [isAdding, setIsAdding] = React.useState(false)
  const [showResolved, setShowResolved] = React.useState(false)

  const active = challenges.filter((c) => c.status === 'active')
  const resolved = challenges.filter((c) => c.status === 'resolved')

  async function handleAdd() {
    if (!newDescription.trim()) return
    setIsAdding(true)
    try {
      const created = await createChallenge(supabase, userId, newDescription.trim())
      setChallenges((prev) => [created, ...prev])
      setNewDescription('')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleResolve(id: string) {
    const updated = await resolveChallenge(supabase, id)
    setChallenges((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Actieve Uitdagingen</h2>

      <div className="flex gap-2">
        <Input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Beschrijf een uitdaging die je nu ervaart..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
        />
        <Button onClick={handleAdd} disabled={isAdding || !newDescription.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Toevoegen
        </Button>
      </div>

      {active.length === 0 && (
        <p className="text-sm text-muted-foreground">Geen actieve uitdagingen.</p>
      )}

      <div className="space-y-2">
        {active.map((challenge) => (
          <ChallengeRow key={challenge.id} challenge={challenge} onResolve={handleResolve} />
        ))}
      </div>

      {resolved.length > 0 && (
        <div>
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Verberg' : 'Toon'} opgeloste uitdagingen ({resolved.length})
          </button>
          {showResolved && (
            <div className="mt-3 space-y-2">
              {resolved.map((challenge) => (
                <ChallengeRow key={challenge.id} challenge={challenge} onResolve={handleResolve} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function ChallengeRow({
  challenge,
  onResolve,
}: {
  challenge: IdentityChallenge
  onResolve: (id: string) => void
}) {
  const isResolved = challenge.status === 'resolved'
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <p className={`flex-1 text-sm ${isResolved ? 'text-muted-foreground line-through' : ''}`}>
        {challenge.description}
      </p>
      {isResolved ? (
        <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
          Opgelost
        </Badge>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
          onClick={() => onResolve(challenge.id)}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Oplossen
        </Button>
      )}
    </div>
  )
}

// ─── StreaksSection ────────────────────────────────────────────────────────

function StreaksSection({
  supabase,
  userId,
  streaks,
  setStreaks,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  streaks: ProcessStreak[]
  setStreaks: React.Dispatch<React.SetStateAction<ProcessStreak[]>>
}) {
  const [newType, setNewType] = React.useState('')
  const [isAdding, setIsAdding] = React.useState(false)

  async function handleAdd() {
    if (!newType.trim()) return
    setIsAdding(true)
    try {
      const created = await createStreak(supabase, userId, newType.trim())
      setStreaks((prev) => [...prev, created])
      setNewType('')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleIncrement(streak: ProcessStreak) {
    const updated = await updateStreakCount(supabase, streak.id, streak.current_count + 1)
    setStreaks((prev) => prev.map((s) => (s.id === streak.id ? updated : s)))
  }

  async function handleReset(streak: ProcessStreak) {
    const updated = await updateStreakCount(supabase, streak.id, 0)
    setStreaks((prev) => prev.map((s) => (s.id === streak.id ? updated : s)))
  }

  async function handleDelete(id: string) {
    await deleteStreak(supabase, id)
    setStreaks((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Process Streaks</h2>

      <div className="flex gap-2">
        <Input
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          placeholder="Naam van de streak (bijv. Pre-market planning)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
        />
        <Button onClick={handleAdd} disabled={isAdding || !newType.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Toevoegen
        </Button>
      </div>

      {streaks.length === 0 && (
        <p className="text-sm text-muted-foreground">Nog geen streaks bijgehouden.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {streaks.map((streak) => (
          <Card key={streak.id} className="relative">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium leading-tight">
                  {streak.streak_type}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(streak.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-3xl font-bold">{streak.current_count}</span>
                <span className="text-sm text-muted-foreground">dagen</span>
              </div>
              {streak.last_date && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Laatste update:{' '}
                  {new Date(streak.last_date).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleIncrement(streak)}>
                  +1 dag
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleReset(streak)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ─── GrowthTimelineSection ─────────────────────────────────────────────────

function GrowthTimelineSection({
  supabase,
  userId,
  timeline,
  setTimeline,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  timeline: GrowthTimeline[]
  setTimeline: React.Dispatch<React.SetStateAction<GrowthTimeline[]>>
}) {
  const [newLabel, setNewLabel] = React.useState('')
  const [newDescription, setNewDescription] = React.useState('')
  const [isAdding, setIsAdding] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)
  const [showResolved, setShowResolved] = React.useState(false)

  const active = timeline.filter((t) => t.status === 'active')
  const resolved = timeline.filter((t) => t.status === 'resolved')

  async function handleAdd() {
    if (!newLabel.trim()) return
    setIsAdding(true)
    try {
      const created = await createGrowthEntry(
        supabase,
        userId,
        newLabel.trim(),
        newDescription.trim() || null
      )
      setTimeline((prev) => [created, ...prev])
      setNewLabel('')
      setNewDescription('')
      setShowForm(false)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleResolve(id: string) {
    const updated = await resolveGrowthEntry(supabase, id)
    setTimeline((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function handleDelete(id: string) {
    await deleteGrowthEntry(supabase, id)
    setTimeline((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Groei Timeline</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe periode
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="period_label">Periode label</Label>
            <Input
              id="period_label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="bijv. Q2 2025 — Consistentie opbouwen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_focus">Focus omschrijving</Label>
            <Textarea
              id="period_focus"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Wat was de centrale focus van deze groeifase?"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={isAdding || !newLabel.trim()}>
              Toevoegen
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      )}

      {active.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">Nog geen groeifasen geregistreerd.</p>
      )}

      <div className="space-y-3">
        {active.map((entry) => (
          <TimelineRow
            key={entry.id}
            entry={entry}
            onResolve={handleResolve}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {resolved.length > 0 && (
        <div>
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Verberg' : 'Toon'} afgeronde fasen ({resolved.length})
          </button>
          {showResolved && (
            <div className="mt-3 space-y-3">
              {resolved.map((entry) => (
                <TimelineRow
                  key={entry.id}
                  entry={entry}
                  onResolve={handleResolve}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function TimelineRow({
  entry,
  onResolve,
  onDelete,
}: {
  entry: GrowthTimeline
  onResolve: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isResolved = entry.status === 'resolved'
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isResolved ? 'text-muted-foreground' : ''}`}>
              {entry.period_label}
            </p>
            {isResolved ? (
              <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
                Afgerond
              </Badge>
            ) : (
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400">
                Actief
              </Badge>
            )}
          </div>
          {entry.focus_description && (
            <p className="mt-1 text-sm text-muted-foreground">{entry.focus_description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(entry.created_at).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-1">
          {!isResolved && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
              onClick={() => onResolve(entry.id)}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Afronden
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
