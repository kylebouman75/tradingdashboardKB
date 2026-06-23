'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  createCustomFieldDefinition,
  deleteCustomFieldDefinition,
  getCustomFieldDefinitions,
  updateCustomFieldDefinition,
  type CustomFieldDefinition,
  type CustomFieldType,
} from '@/lib/trades'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Tekst',
  textarea: 'Tekstvak',
  number: 'Getal',
  dropdown: 'Keuzelijst',
  multiselect: 'Multi-select',
  boolean: 'Ja/Nee',
  date: 'Datum',
  time: 'Tijd',
  rating: 'Beoordeling (1-5)',
}

const TYPES_WITH_OPTIONS: CustomFieldType[] = ['dropdown', 'multiselect']

export function CustomFieldsManager() {
  const supabase = React.useMemo(() => createClient(), [])
  const [definitions, setDefinitions] = React.useState<CustomFieldDefinition[]>([])
  const [userId, setUserId] = React.useState<string | null>(null)

  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<CustomFieldType>('text')
  const [optionsText, setOptionsText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(
    async (uid: string) => {
      const data = await getCustomFieldDefinitions(supabase, uid)
      setDefinitions(data)
    },
    [supabase]
  )

  React.useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await refresh(user.id)
    }
    load()
  }, [supabase, refresh])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !name.trim()) return

    setError(null)

    const options = TYPES_WITH_OPTIONS.includes(type)
      ? optionsText
          .split(',')
          .map((option) => option.trim())
          .filter(Boolean)
      : []

    if (TYPES_WITH_OPTIONS.includes(type) && options.length === 0) {
      setError('Voeg minstens één optie toe (komma-gescheiden).')
      return
    }

    try {
      await createCustomFieldDefinition(supabase, userId, {
        name: name.trim(),
        type,
        options,
        sort_order: definitions.length,
        is_hidden: false,
      })
      setName('')
      setType('text')
      setOptionsText('')
      await refresh(userId)
    } catch {
      setError('Aanmaken van het veld is mislukt.')
    }
  }

  async function handleDelete(id: string) {
    if (!userId) return
    await deleteCustomFieldDefinition(supabase, id)
    await refresh(userId)
  }

  async function handleToggleHidden(definition: CustomFieldDefinition) {
    if (!userId) return
    await updateCustomFieldDefinition(supabase, definition.id, {
      is_hidden: !definition.is_hidden,
    })
    await refresh(userId)
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!userId) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= definitions.length) return

    const current = definitions[index]
    const target = definitions[targetIndex]

    await Promise.all([
      updateCustomFieldDefinition(supabase, current.id, { sort_order: target.sort_order }),
      updateCustomFieldDefinition(supabase, target.id, { sort_order: current.sort_order }),
    ])
    await refresh(userId)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">Nieuw veld toevoegen</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="field-name">Naam</Label>
            <Input
              id="field-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Marktconditie"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as CustomFieldType)}>
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {TYPES_WITH_OPTIONS.includes(type) && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="field-options">Opties (komma-gescheiden)</Label>
              <Input
                id="field-options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="bijv. Trending, Ranging, Volatiel"
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit">Veld toevoegen</Button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {definitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nog geen eigen velden aangemaakt.
                </TableCell>
              </TableRow>
            ) : (
              definitions.map((definition, index) => (
                <TableRow key={definition.id}>
                  <TableCell className="font-medium">{definition.name}</TableCell>
                  <TableCell>{TYPE_LABELS[definition.type]}</TableCell>
                  <TableCell>{definition.is_hidden ? 'Verborgen' : 'Zichtbaar'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => handleMove(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === definitions.length - 1}
                        onClick={() => handleMove(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleHidden(definition)}
                      >
                        {definition.is_hidden ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Veld verwijderen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je het veld &quot;{definition.name}&quot; wilt
                              verwijderen? Dit kan niet ongedaan worden gemaakt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(definition.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
