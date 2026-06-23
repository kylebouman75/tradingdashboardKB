import { NextResponse, type NextRequest } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

import { createClient } from '@/lib/supabase/server'
import { getMonthlyReviewContext } from '@/lib/monthly-review'
import { buildMonthlyReviewPrompt } from '@/lib/engines/monthly-review-prompt'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const monthYear = body?.monthYear as string | undefined

  if (!monthYear) {
    return NextResponse.json({ error: 'monthYear is verplicht.' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is niet ingesteld. Vul deze in via .env.local.' },
      { status: 500 }
    )
  }

  try {
    const context = await getMonthlyReviewContext(supabase, user.id, monthYear)
    const prompt = buildMonthlyReviewPrompt(context)

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    })

    return NextResponse.json({ content: text })
  } catch {
    return NextResponse.json(
      { error: 'Het genereren van de Monthly Review is mislukt. Probeer het opnieuw.' },
      { status: 500 }
    )
  }
}
