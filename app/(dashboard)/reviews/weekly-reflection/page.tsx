import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getWeekStartIso } from '@/lib/week'
import { WeekNavigator } from '@/components/shared/week-navigator'
import { WeeklyReflectionForm } from '@/components/reviews/weekly-reflection/weekly-reflection-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WeeklyReflectionRoute({
  searchParams,
}: {
  searchParams: { week?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const weekStartDate = searchParams.week ?? getWeekStartIso()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Weekly Reflectie</h1>
        <WeekNavigator weekStartDate={weekStartDate} />
      </div>

      <WeeklyReflectionForm key={weekStartDate} weekStartDate={weekStartDate} />
    </div>
  )
}
