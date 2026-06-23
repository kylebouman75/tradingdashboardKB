import { NextResponse, type NextRequest } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

import { createClient } from '@/lib/supabase/server'
import { getWeeklyReviewContext } from '@/lib/weekly-review'
import { buildWeeklyReviewPrompt } from '@/lib/engines/weekly-review-prompt'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const weekStartDate = body?.weekStartDate as string | undefined

  if (!weekStartDate) {
    return NextResponse.json({ error: 'weekStartDate is verplicht.' }, { status: 400 })
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
    const context = await getWeeklyReviewContext(supabase, user.id, weekStartDate)
    const prompt = buildWeeklyReviewPrompt(context)

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    })

    return NextResponse.json({ content: text })
  } catch {
    return NextResponse.json(
      { error: 'Het genereren van de Weekly Review is mislukt. Probeer het opnieuw.' },
      { status: 500 }
    )
  }
}
