'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getSignedStrategyImageUrl } from '@/lib/storage'
import type { StrategyImage } from '@/lib/strategies'
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
import { ScreenshotLightbox } from '@/components/trades/screenshot-lightbox'

export function StrategyImageGallery({
  images,
  editable = true,
  onDelete,
  onLabelChange,
}: {
  images: StrategyImage[]
  editable?: boolean
  onDelete?: (image: StrategyImage) => void
  onLabelChange?: (imageId: string, label: string | null) => void
}) {
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null)

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen afbeeldingen toegevoegd.</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="space-y-2">
            <StrategyImageThumbnail image={image} onClick={(url) => setLightboxUrl(url)} />

            {editable ? (
              <div className="space-y-1">
                <LabelInput
                  imageId={image.id}
                  initialLabel={image.label}
                  onSave={(label) => onLabelChange?.(image.id, label)}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Afbeelding verwijderen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Weet je zeker dat je deze afbeelding wilt verwijderen?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete?.(image)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              image.label && (
                <p className="text-center text-xs text-muted-foreground">{image.label}</p>
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

function LabelInput({
  imageId,
  initialLabel,
  onSave,
}: {
  imageId: string
  initialLabel: string | null
  onSave: (label: string | null) => void
}) {
  const [value, setValue] = React.useState(initialLabel ?? '')

  React.useEffect(() => {
    setValue(initialLabel ?? '')
  }, [imageId, initialLabel])

  function handleBlur() {
    const trimmed = value.trim()
    onSave(trimmed || null)
  }

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="Label..."
      className="h-7 text-xs"
    />
  )
}

function StrategyImageThumbnail({
  image,
  onClick,
}: {
  image: StrategyImage
  onClick: (url: string) => void
}) {
  const [src, setSrc] = React.useState(image.storage_url)
  const triedFallback = React.useRef(false)

  React.useEffect(() => {
    setSrc(image.storage_url)
    triedFallback.current = false
  }, [image.storage_url])

  async function handleError() {
    if (triedFallback.current) return
    triedFallback.current = true

    const supabase = createClient()
    const signedUrl = await getSignedStrategyImageUrl(supabase, image.storage_url)
    if (signedUrl) setSrc(signedUrl)
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
        alt={image.label ?? 'Strategie afbeelding'}
        className="h-32 w-full object-cover"
        onError={handleError}
      />
    </button>
  )
}
