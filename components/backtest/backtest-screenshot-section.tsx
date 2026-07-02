'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import { deleteBacktestScreenshotFile } from '@/lib/storage'
import {
  deleteBacktestScreenshotRecord,
  ensureBacktestScreenshotLabelsSeed,
  getBacktestScreenshotLabels,
  getBacktestScreenshots,
  updateBacktestScreenshotLabel,
  type BacktestScreenshot,
  type ScreenshotLabel,
} from '@/lib/backtest'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BacktestScreenshotUpload } from '@/components/backtest/backtest-screenshot-upload'
import { BacktestScreenshotGallery } from '@/components/backtest/backtest-screenshot-gallery'
import { BacktestScreenshotLabelsManager } from '@/components/backtest/backtest-screenshot-labels-manager'

export function BacktestScreenshotSection({
  backtestId,
  editable = true,
  allowUpload = true,
}: {
  backtestId: string
  editable?: boolean
  allowUpload?: boolean
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [screenshots, setScreenshots] = React.useState<BacktestScreenshot[]>([])
  const [labels, setLabels] = React.useState<ScreenshotLabel[]>([])
  const [showLabelsManager, setShowLabelsManager] = React.useState(false)
  const hasInitialized = React.useRef(false)

  const refresh = React.useCallback(async () => {
    const data = await getBacktestScreenshots(supabase, backtestId)
    setScreenshots(data)
  }, [supabase, backtestId])

  const refreshLabels = React.useCallback(async () => {
    if (!userId) return
    const labelsData = await getBacktestScreenshotLabels(supabase, userId)
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
      await ensureBacktestScreenshotLabelsSeed(supabase, user.id)
      const labelsData = await getBacktestScreenshotLabels(supabase, user.id)
      setLabels(labelsData)
      await refresh()
    }

    load()
  }, [supabase, refresh])

  async function handleDelete(screenshot: BacktestScreenshot) {
    await deleteBacktestScreenshotFile(supabase, screenshot.storage_url)
    await deleteBacktestScreenshotRecord(supabase, screenshot.id)
    await refresh()
  }

  async function handleLabelChange(screenshotId: string, label: string | null) {
    await updateBacktestScreenshotLabel(supabase, screenshotId, label)
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
          <BacktestScreenshotLabelsManager userId={userId} labels={labels} onChange={refreshLabels} />
        )}
        {allowUpload && userId && (
          <BacktestScreenshotUpload userId={userId} backtestId={backtestId} onUploaded={refresh} />
        )}
        <BacktestScreenshotGallery
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
