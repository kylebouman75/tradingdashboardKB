'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getSignedBacktestScreenshotUrl } from '@/lib/storage'
import type { BacktestScreenshot, ScreenshotLabel } from '@/lib/backtest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
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
import { ScreenshotLightbox } from '@/components/trades/screenshot-lightbox'

export function BacktestScreenshotGallery({
  screenshots,
  labels,
  editable = true,
  onDelete,
  onLabelChange,
}: {
  screenshots: BacktestScreenshot[]
  labels: ScreenshotLabel[]
  editable?: boolean
  onDelete?: (screenshot: BacktestScreenshot) => void
  onLabelChange?: (screenshotId: string, label: string | null) => void
}) {
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null)

  if (screenshots.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen screenshots toegevoegd.</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {screenshots.map((screenshot) => (
          <div key={screenshot.id} className="space-y-2">
            <BacktestScreenshotThumbnail
              screenshot={screenshot}
              onClick={(url) => setLightboxUrl(url)}
            />

            {editable ? (
              <div className="flex items-center gap-1">
                <Select
                  value={screenshot.label ?? 'none'}
                  onValueChange={(value) =>
                    onLabelChange?.(screenshot.id, value === 'none' ? null : value)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Geen label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen label</SelectItem>
                    {labels.map((label) => (
                      <SelectItem key={label.id} value={label.name}>
                        {label.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Screenshot verwijderen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Weet je zeker dat je deze screenshot wilt verwijderen?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete?.(screenshot)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              screenshot.label && (
                <p className="text-center text-xs text-muted-foreground">{screenshot.label}</p>
              )
            )}
          </div>
        ))}
      </div>

      <ScreenshotLightbox
        imageUrl={lightboxUrl}
        open={lightboxUrl !== null}
        onOpenChange={(open) => !open && setLightboxUrl(null)}
      />
    </>
  )
}

function BacktestScreenshotThumbnail({
  screenshot,
  onClick,
}: {
  screenshot: BacktestScreenshot
  onClick: (url: string) => void
}) {
  const [src, setSrc] = React.useState(screenshot.storage_url)
  const triedFallback = React.useRef(false)

  React.useEffect(() => {
    setSrc(screenshot.storage_url)
    triedFallback.current = false
  }, [screenshot.storage_url])

  async function handleError() {
    if (triedFallback.current) return
    triedFallback.current = true

    const supabase = createClient()
    const signedUrl = await getSignedBacktestScreenshotUrl(supabase, screenshot.storage_url)
    if (signedUrl) {
      setSrc(signedUrl)
    }
  }

  return (
    <button
      type="button"
      onClick={() => onClick(src)}
      className="block w-full overflow-hidden rounded-md border"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={screenshot.label ?? 'Backtest screenshot'}
        className="h-32 w-full object-cover"
        onError={handleError}
      />
    </button>
  )
}
