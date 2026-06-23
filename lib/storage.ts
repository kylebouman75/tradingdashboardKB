import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

const SCREENSHOTS_BUCKET = 'trade-screenshots'
const STRATEGY_IMAGES_BUCKET = 'strategy-images'

export async function uploadTradeScreenshot(
  supabase: SupabaseClient<Database>,
  userId: string,
  tradeId: string,
  file: File
): Promise<string> {
  const extension = file.name.split('.').pop()
  const filename = `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
  const path = `${userId}/${tradeId}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from(SCREENSHOTS_BUCKET)
    .upload(path, file)

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(SCREENSHOTS_BUCKET).getPublicUrl(path)

  return data.publicUrl
}

function extractStoragePath(storageUrl: string): string | null {
  const marker = `/${SCREENSHOTS_BUCKET}/`
  const markerIndex = storageUrl.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  return storageUrl.slice(markerIndex + marker.length)
}

/**
 * Public buckets serveren bestanden direct via storage_url. Als de bucket
 * (nog) niet op public staat, geeft een kale GET op die URL een 400/403
 * terug en blijft de afbeelding leeg. Deze functie biedt een fallback door
 * een tijdelijke signed URL voor hetzelfde pad op te vragen.
 */
export async function getSignedScreenshotUrl(
  supabase: SupabaseClient<Database>,
  storageUrl: string
): Promise<string | null> {
  const path = extractStoragePath(storageUrl)
  if (!path) return null

  const { data, error } = await supabase.storage
    .from(SCREENSHOTS_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (error) {
    // eslint-disable-next-line no-console
    console.log('[storage] kon geen signed URL genereren voor', path, error)
    return null
  }

  return data.signedUrl
}

export async function deleteTradeScreenshotFile(
  supabase: SupabaseClient<Database>,
  storageUrl: string
): Promise<void> {
  const path = extractStoragePath(storageUrl)

  if (!path) {
    return
  }

  const { error } = await supabase.storage.from(SCREENSHOTS_BUCKET).remove([path])

  if (error) {
    throw error
  }
}

export async function uploadStrategyImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  strategyId: string,
  file: File
): Promise<string> {
  const extension = file.name.split('.').pop()
  const filename = `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
  const path = `${userId}/${strategyId}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from(STRATEGY_IMAGES_BUCKET)
    .upload(path, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(STRATEGY_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function extractStrategyImagePath(storageUrl: string): string | null {
  const marker = `/${STRATEGY_IMAGES_BUCKET}/`
  const markerIndex = storageUrl.indexOf(marker)
  if (markerIndex === -1) return null
  return storageUrl.slice(markerIndex + marker.length)
}

export async function getSignedStrategyImageUrl(
  supabase: SupabaseClient<Database>,
  storageUrl: string
): Promise<string | null> {
  const path = extractStrategyImagePath(storageUrl)
  if (!path) return null

  const { data, error } = await supabase.storage
    .from(STRATEGY_IMAGES_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (error) return null
  return data.signedUrl
}

export async function deleteStrategyImageFile(
  supabase: SupabaseClient<Database>,
  storageUrl: string
): Promise<void> {
  const path = extractStrategyImagePath(storageUrl)
  if (!path) return

  const { error } = await supabase.storage.from(STRATEGY_IMAGES_BUCKET).remove([path])
  if (error) throw error
}
