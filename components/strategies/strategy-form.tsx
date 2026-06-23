'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import {
  createStrategy,
  updateStrategy,
  type Strategy,
} from '@/lib/strategies'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StrategyImageSection } from '@/components/strategies/strategy-image-section'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type FormState = {
  name: string
  description: string
  explanation: string
  setup_conditions: string
  entry_criteria: string
  exit_criteria: string
  trade_management_rules: string
  a_plus_criteria: string
}

function strategyToFormState(strategy: Strategy): FormState {
  return {
    name: strategy.name,
    description: strategy.description ?? '',
    explanation: strategy.explanation ?? '',
    setup_conditions: strategy.setup_conditions ?? '',
    entry_criteria: strategy.entry_criteria ?? '',
    exit_criteria: strategy.exit_criteria ?? '',
    trade_management_rules: strategy.trade_management_rules ?? '',
    a_plus_criteria: strategy.a_plus_criteria ?? '',
  }
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  explanation: '',
  setup_conditions: '',
  entry_criteria: '',
  exit_criteria: '',
  trade_management_rules: '',
  a_plus_criteria: '',
}

export function StrategyForm({ strategy }: { strategy?: Strategy }) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [form, setForm] = React.useState<FormState>(
    strategy ? strategyToFormState(strategy) : EMPTY_FORM
  )
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle')
  const [savedId, setSavedId] = React.useState<string | null>(strategy?.id ?? null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNew = !strategy

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const autosave = React.useCallback(
    async (currentForm: FormState, id: string | null) => {
      if (!currentForm.name.trim()) return
      if (!id) return

      setSaveStatus('saving')
      try {
        await updateStrategy(supabase, id, {
          name: currentForm.name,
          description: currentForm.description || null,
          explanation: currentForm.explanation || null,
          setup_conditions: currentForm.setup_conditions || null,
          entry_criteria: currentForm.entry_criteria || null,
          exit_criteria: currentForm.exit_criteria || null,
          trade_management_rules: currentForm.trade_management_rules || null,
          a_plus_criteria: currentForm.a_plus_criteria || null,
        })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    },
    [supabase]
  )

  React.useEffect(() => {
    if (isNew) return
    if (!savedId) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      autosave(form, savedId)
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [form, isNew, savedId, autosave])

  async function handleCreate() {
    if (!form.name.trim()) return

    setSaveStatus('saving')
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const created = await createStrategy(supabase, user.id, {
        name: form.name,
        description: form.description || null,
        explanation: form.explanation || null,
        setup_conditions: form.setup_conditions || null,
        entry_criteria: form.entry_criteria || null,
        exit_criteria: form.exit_criteria || null,
        trade_management_rules: form.trade_management_rules || null,
        a_plus_criteria: form.a_plus_criteria || null,
      })
      setSavedId(created.id)
      setSaveStatus('saved')
      router.replace(`/libraries/strategy-library/${created.id}/edit`)
    } catch {
      setSaveStatus('error')
    }
  }

  const saveLabel =
    saveStatus === 'saving'
      ? 'Opslaan...'
      : saveStatus === 'saved'
        ? 'Opgeslagen'
        : saveStatus === 'error'
          ? 'Fout bij opslaan'
          : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? 'Nieuwe strategie' : 'Strategie bewerken'}
        </h1>
        <div className="flex items-center gap-3">
          {saveLabel && (
            <span
              className={`text-sm ${
                saveStatus === 'error' ? 'text-red-400' : 'text-muted-foreground'
              }`}
            >
              {saveLabel}
            </span>
          )}
          {isNew ? (
            <Button onClick={handleCreate} disabled={!form.name.trim() || saveStatus === 'saving'}>
              Opslaan & doorgaan
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push(`/libraries/strategy-library/${savedId}`)}>
              Bekijken
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basisinformatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Bijv. Break & Retest, ICT Liquidity Sweep..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Korte omschrijving</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Één zin samenvatting van de strategie"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uitleg</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.explanation}
            onChange={(e) => set('explanation', e.target.value)}
            placeholder="Uitgebreide uitleg van de strategie, de theorie erachter en wanneer deze werkt..."
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup voorwaarden</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.setup_conditions}
            onChange={(e) => set('setup_conditions', e.target.value)}
            placeholder="Welke marktomstandigheden moeten aanwezig zijn voor een geldige setup?"
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entry criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.entry_criteria}
            onChange={(e) => set('entry_criteria', e.target.value)}
            placeholder="Specifieke triggers en bevestigingen nodig voor entry..."
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exit criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.exit_criteria}
            onChange={(e) => set('exit_criteria', e.target.value)}
            placeholder="Stop loss plaatsing, take profit levels, trail criteria..."
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trade management regels</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.trade_management_rules}
            onChange={(e) => set('trade_management_rules', e.target.value)}
            placeholder="Regels voor het managen van de positie nadat je erin zit..."
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>A+ criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.a_plus_criteria}
            onChange={(e) => set('a_plus_criteria', e.target.value)}
            placeholder="Wat maakt een trade met deze strategie een echte A+ setup?"
            rows={4}
          />
        </CardContent>
      </Card>

      {savedId && <StrategyImageSection strategyId={savedId} editable />}
    </div>
  )
}
