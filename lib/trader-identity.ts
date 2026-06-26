import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type TraderIdentity = Database['public']['Tables']['trader_identity']['Row']
export type IdentityChallenge = Database['public']['Tables']['identity_challenges']['Row']
export type ProcessStreak = Database['public']['Tables']['process_streaks']['Row']
export type GrowthTimeline = Database['public']['Tables']['growth_timeline']['Row']

export type UpdateTraderIdentityInput = {
  a_game?: string[]
  b_game?: string[]
  c_game?: string[]
  mental_leaks?: string[]
  patterns?: string[]
  strengths?: string[]
  current_growth_phase?: string | null
  week_focus?: string | null
}

// ─── Trader Identity (één per gebruiker) ───────────────────────────────────

export async function getTraderIdentity(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TraderIdentity | null> {
  const { data, error } = await supabase
    .from('trader_identity')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertTraderIdentity(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: UpdateTraderIdentityInput
): Promise<TraderIdentity> {
  const { data: existing } = await supabase
    .from('trader_identity')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('trader_identity')
      .update({ ...input, last_updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('trader_identity')
    .insert({ user_id: userId, ...input, last_updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Identity Challenges ───────────────────────────────────────────────────

export async function getChallenges(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<IdentityChallenge[]> {
  const { data, error } = await supabase
    .from('identity_challenges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createChallenge(
  supabase: SupabaseClient<Database>,
  userId: string,
  description: string
): Promise<IdentityChallenge> {
  const { data, error } = await supabase
    .from('identity_challenges')
    .insert({ user_id: userId, description })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function resolveChallenge(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<IdentityChallenge> {
  const { data, error } = await supabase
    .from('identity_challenges')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteChallenge(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('identity_challenges').delete().eq('id', id)
  if (error) throw error
}

// ─── Process Streaks ───────────────────────────────────────────────────────

export async function getStreaks(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProcessStreak[]> {
  const { data, error } = await supabase
    .from('process_streaks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createStreak(
  supabase: SupabaseClient<Database>,
  userId: string,
  streakType: string
): Promise<ProcessStreak> {
  const { data, error } = await supabase
    .from('process_streaks')
    .insert({ user_id: userId, streak_type: streakType, current_count: 0 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateStreakCount(
  supabase: SupabaseClient<Database>,
  id: string,
  count: number
): Promise<ProcessStreak> {
  const { data, error } = await supabase
    .from('process_streaks')
    .update({
      current_count: count,
      last_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteStreak(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('process_streaks').delete().eq('id', id)
  if (error) throw error
}

// ─── Growth Timeline ───────────────────────────────────────────────────────

export async function getGrowthTimeline(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<GrowthTimeline[]> {
  const { data, error } = await supabase
    .from('growth_timeline')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createGrowthEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodLabel: string,
  focusDescription: string | null
): Promise<GrowthTimeline> {
  const { data, error } = await supabase
    .from('growth_timeline')
    .insert({ user_id: userId, period_label: periodLabel, focus_description: focusDescription })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function resolveGrowthEntry(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<GrowthTimeline> {
  const { data, error } = await supabase
    .from('growth_timeline')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGrowthEntry(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('growth_timeline').delete().eq('id', id)
  if (error) throw error
}
