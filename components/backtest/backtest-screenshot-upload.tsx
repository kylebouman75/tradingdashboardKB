'use client'

import * as React from 'react'
import { Upload } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { uploadBacktestScreenshot } from '@/lib/storage'
import { createBacktestScreenshot } from '@/lib/backtest'
import { Button } from '@/components/ui/button'

export function BacktestScreenshotUpload({
  userId,
  backtestId,
  onUploaded,
}: {
  userId: string
  backtestId: string
  onUploaded: () => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)

    const supabase = createClient()

    try {
      for (const file of Array.from(files)) {
        const storageUrl = await uploadBacktestScreenshot(supabase, userId, backtestId, file)
        await createBacktestScreenshot(supabase, backtestId, storageUrl)
      }
      onUploaded()
    } catch {
      setError('Uploaden mislukt. Probeer het opnieuw.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Uploaden...' : 'Screenshot uploaden'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
