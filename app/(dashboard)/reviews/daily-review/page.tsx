import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { DateNavigator } from '@/components/shared/date-navigator'
import { DailyReviewPage as DailyReviewPageContent } from '@/components/reviews/daily-review/daily-review-page'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default async function DailyReviewRoute({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const date = searchParams.date ?? todayIso()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Daily Review</h1>
        <DateNavigator date={date} />
      </div>

      <DailyReviewPageContent key={date} date={date} />
    </div>
  )
}
