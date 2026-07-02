'use client'

import * as React from 'react'
import { Pencil, Trash2, X } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { createBacktestScreenshotLabel, type ScreenshotLabel } from '@/lib/backtest'
import { deleteScreenshotLabel, updateScreenshotLabel } from '@/lib/trades'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export function BacktestScreenshotLabelsManager({
  userId,
  labels,
  onChange,
}: {
  userId: string
  labels: ScreenshotLabel[]
  onChange: () => void
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const [newName, setNewName] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await createBacktestScreenshotLabel(supabase, userId, newName.trim())
    setNewName('')
    onChange()
  }

  function startEditing(label: ScreenshotLabel) {
    setEditingId(label.id)
    setEditingName(label.name)
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editingName.trim()) return
    await updateScreenshotLabel(supabase, editingId, editingName.trim())
    setEditingId(null)
    setEditingName('')
    onChange()
  }

  async function handleDelete(id: string) {
    await deleteScreenshotLabel(supabase, id)
    onChange()
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <h3 className="text-sm font-semibold">Labels beheren</h3>

      <ul className="space-y-2">
        {labels.length === 0 && (
          <li className="text-sm text-muted-foreground">Nog geen labels aangemaakt.</li>
        )}
        {labels.map((label) => (
          <li key={label.id} className="flex items-center gap-2">
            {editingId === label.id ? (
              <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
                <Input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-8"
                />
                <Button type="submit" size="sm">
                  Opslaan
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm">{label.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEditing(label)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Label verwijderen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Weet je zeker dat je het label &quot;{label.name}&quot; wilt verwijderen?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(label.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nieuw label, bijv. Entry-moment"
          className="h-8"
        />
        <Button type="submit" size="sm" variant="outline">
          Toevoegen
        </Button>
      </form>
    </div>
  )
}
