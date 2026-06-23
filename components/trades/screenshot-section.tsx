'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import { deleteTradeScreenshotFile } from '@/lib/storage'
import {
  deleteTradeScreenshotRecord,
  ensureScreenshotLabelsSeed,
  getScreenshotLabels,
  getTradeScreenshots,
  updateTradeScreenshotLabel,
  type ScreenshotLabel,
  type TradeScreenshot,
} from '@/lib/trades'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScreenshotUpload } from '@/components/trades/screenshot-upload'
import { ScreenshotGallery } from '@/components/trades/screenshot-gallery'
import { ScreenshotLabelsManager } from '@/components/trades/screenshot-labels-manager'

export function ScreenshotSection({
  tradeId,
  editable = true,
  allowUpload = true,
}: {
  tradeId: string
  editable?: boolean
  allowUpload?: boolean
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [screenshots, setScreenshots] = React.useState<TradeScreenshot[]>([])
  const [labels, setLabels] = React.useState<ScreenshotLabel[]>([])
  const [showLabelsManager, setShowLabelsManager] = React.useState(false)
  const hasInitialized = React.useRef(false)

  const refresh = React.useCallback(async () => {
    const data = await getTradeScreenshots(supabase, tradeId)
    setScreenshots(data)
  }, [supabase, tradeId])

  const refreshLabels = React.useCallback(async () => {
    if (!userId) return
    const labelsData = await getScreenshotLabels(supabase, userId)
    setLabels(labelsData)
  }, [supabase, userId])

  React.useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      await ensureScreenshotLabelsSeed(supabase, user.id)
      const labelsData = await getScreenshotLabels(supabase, user.id)
      setLabels(labelsData)
      await refresh()
    }

    load()
  }, [supabase, refresh])

  async function handleDelete(screenshot: TradeScreenshot) {
    await deleteTradeScreenshotFile(supabase, screenshot.storage_url)
    await deleteTradeScreenshotRecord(supabase, screenshot.id)
    await refresh()
  }

  async function handleLabelChange(screenshotId: string, label: string | null) {
    await updateTradeScreenshotLabel(supabase, screenshotId, label)
    await refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Screenshots</CardTitle>
        {editable && userId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowLabelsManager((prev) => !prev)}
          >
            {showLabelsManager ? 'Labels verbergen' : 'Labels beheren'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showLabelsManager && userId && (
          <ScreenshotLabelsManager userId={userId} labels={labels} onChange={refreshLabels} />
        )}
        {allowUpload && userId && (
          <ScreenshotUpload userId={userId} tradeId={tradeId} onUploaded={refresh} />
        )}
        <ScreenshotGallery
          screenshots={screenshots}
          labels={labels}
          editable={editable}
          onDelete={handleDelete}
          onLabelChange={handleLabelChange}
        />
      </CardContent>
    </Card>
  )
}
