'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export function ScreenshotLightbox({
  imageUrl,
  open,
  onOpenChange,
}: {
  imageUrl: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Screenshot</DialogTitle>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Trade screenshot" className="w-full rounded-md" />
        )}
      </DialogContent>
    </Dialog>
  )
}
