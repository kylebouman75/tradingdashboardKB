import { NextResponse, type NextRequest } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

import { createClient } from '@/lib/supabase/server'
import { getDailyReviewContext } from '@/lib/daily-review'
import { buildDailyReviewPrompt } from '@/lib/engines/daily-review-prompt'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const date = body?.date as string | undefined

  if (!date) {
    return NextResponse.json({ error: 'Datum is verplicht.' }, { status: 400 })
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
    const context = await getDailyReviewContext(supabase, user.id, date)
    const prompt = buildDailyReviewPrompt(context)

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    })

    return NextResponse.json({ content: text })
  } catch {
    return NextResponse.json(
      { error: 'Het genereren van de Daily Review is mislukt. Probeer het opnieuw.' },
      { status: 500 }
    )
  }
}
