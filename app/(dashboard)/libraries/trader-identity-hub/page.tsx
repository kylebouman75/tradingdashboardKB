import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { TraderIdentityHubPage } from '@/components/trader-identity/trader-identity-hub-page'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TraderIdentityHubRoute() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trader Identity Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jouw levend zelfportret als trader — wie ben je, hoe presteer je, waar groei je naartoe
        </p>
      </div>

      <TraderIdentityHubPage />
    </div>
  )
}
