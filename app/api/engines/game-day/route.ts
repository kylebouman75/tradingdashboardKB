import { NextResponse, type NextRequest } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

import { createClient } from '@/lib/supabase/server'
import { getGameDayContext, type GameDayClassificationValue } from '@/lib/game-day'
import { buildGameDayPrompt } from '@/lib/engines/game-day-prompt'

const VALID_CLASSIFICATIONS: GameDayClassificationValue[] = ['A', 'B', 'C', 'B→A', 'A→B', 'B→C']

function parseClassification(rawText: string): {
  classification: GameDayClassificationValue
  content: string
} {
  const normalized = rawText.replace(/->/g, '→')
  const lines = normalized.split('\n')
  const firstLine = lines[0]?.trim() ?? ''
  const match = firstLine.match(/^CLASSIFICATIE:\s*(.+)$/i)
  const candidate = match?.[1]?.trim()

  const classification = VALID_CLASSIFICATIONS.includes(
    candidate as GameDayClassificationValue
  )
    ? (candidate as GameDayClassificationValue)
    : 'B'

  const content = match ? lines.slice(1).join('\n').trim() : normalized.trim()

  return { classification, content }
}

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
    const context = await getGameDayContext(supabase, user.id, date)
    const prompt = buildGameDayPrompt(context)

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    })

    const { classification, content } = parseClassification(text)

    return NextResponse.json({ content, classification })
  } catch {
    return NextResponse.json(
      { error: 'Het genereren van de Game Day analyse is mislukt. Probeer het opnieuw.' },
      { status: 500 }
    )
  }
}
