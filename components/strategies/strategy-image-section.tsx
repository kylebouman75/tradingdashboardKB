'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import { deleteStrategyImageFile } from '@/lib/storage'
import {
  deleteStrategyImageRecord,
  getStrategyImages,
  updateStrategyImageLabel,
  type StrategyImage,
} from '@/lib/strategies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StrategyImageUpload } from '@/components/strategies/strategy-image-upload'
import { StrategyImageGallery } from '@/components/strategies/strategy-image-gallery'

export function StrategyImageSection({
  strategyId,
  editable = true,
}: {
  strategyId: string
  editable?: boolean
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [images, setImages] = React.useState<StrategyImage[]>([])
  const hasInitialized = React.useRef(false)

  const refresh = React.useCallback(async () => {
    const data = await getStrategyImages(supabase, strategyId)
    setImages(data)
  }, [supabase, strategyId])

  React.useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      await refresh()
    }

    load()
  }, [supabase, refresh])

  async function handleDelete(image: StrategyImage) {
    await deleteStrategyImageFile(supabase, image.storage_url)
    await deleteStrategyImageRecord(supabase, image.id)
    await refresh()
  }

  async function handleLabelChange(imageId: string, label: string | null) {
    await updateStrategyImageLabel(supabase, imageId, label)
    await refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Afbeeldingen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editable && userId && (
          <StrategyImageUpload userId={userId} strategyId={strategyId} onUploaded={refresh} />
        )}
        <StrategyImageGallery
          images={images}
          editable={editable}
          onDelete={handleDelete}
          onLabelChange={handleLabelChange}
        />
      </CardContent>
    </Card>
  )
}
