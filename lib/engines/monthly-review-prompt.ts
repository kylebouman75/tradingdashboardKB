import type { MonthlyReviewContext } from '@/lib/monthly-review'

const FALLBACK = 'Niet ingevuld'

function val(value: string | null | undefined): string {
  return value && value.trim() ? value : FALLBACK
}

function buildWeeklyReviewsSection(context: MonthlyReviewContext): string {
  if (context.approvedWeeklyReviews.length === 0) {
    return 'Geen goedgekeurde Weekly Reviews beschikbaar voor deze maand.'
  }

  return context.approvedWeeklyReviews
    .map((entry) => `Week van ${entry.weekStartDate}:\n${entry.content}`)
    .join('\n\n---\n\n')
}

function buildReflectionSection(context: MonthlyReviewContext): string {
  const { reflection } = context

  if (!reflection) {
    return 'Geen Monthly Reflection ingevuld voor deze maand.'
  }

  const feelings = Array.isArray(reflection.month_feelings)
    ? reflection.month_feelings.filter((item): item is string => typeof item === 'string')
    : []

  return `Hoe voelde de maand aan: ${feelings.length > 0 ? feelings.join(', ') : FALLBACK}
Zichtbare groei: ${val(reflection.visible_growth)}
Terugkerende uitdaging: ${val(reflection.recurring_challenge)}
Grootste les: ${val(reflection.lesson_learned)}
Verbetering volgende maand: ${val(reflection.improve_next_month)}
Persoonlijke overwinning: ${val(reflection.personal_victory)}
Vrije reflectie: ${val(reflection.free_reflection)}`
}

function buildHistorySection(context: MonthlyReviewContext): string {
  if (context.historicalReviews.length === 0) {
    return 'Geen historische Monthly Reviews beschikbaar.'
  }

  return context.historicalReviews
    .map((entry) => `${entry.monthYear}: ${entry.summary ?? 'Geen samenvatting beschikbaar.'}`)
    .join('\n')
}

export function buildMonthlyReviewPrompt(context: MonthlyReviewContext): string {
  return `Je bent een trading performance coach. Analyseer de afgelopen tradingmaand en identificeer concrete patronen en groeipunten. Analyseer NOOIT op winst of verlies. P&L is niet relevant.

## Centrale vraag
Welke patronen definiëren de tradingstijl van deze trader dit kwartaal, en wat is de meest impactvolle volgende stap in zijn/haar ontwikkeling?

## Maandoverzicht
Maand: ${context.monthYear}
Periode: ${context.monthFrom} t/m ${context.monthTo}
Aantal tradingdagen: ${context.tradingDayCount}
Aantal trades: ${context.trades.length}

## Weekly Reviews deze maand
${buildWeeklyReviewsSection(context)}

## Monthly Reflection (handmatige input van trader)
${buildReflectionSection(context)}

## Historische context (laatste 3 maanden)
${buildHistorySection(context)}

## Jouw analyse moet bevatten:

### Maandpatroon
Wat was het overheersende gedragspatroon deze maand? (geen evaluatie op P&L — kijk naar process, discipline, emotie)

### Wat structureel verbeterde
Maximaal 3 concrete gedragsveranderingen ten opzichte van vorige maanden

### Wat hardnekkig terugkwam
Maximaal 3 patronen die ondanks bewustzijn bleven terugkomen — wees specifiek

### Grootste bottleneck van de maand
Exact 1 — het patroon met de meeste impact als de trader slechts één ding zou doorbreken

### Mentale evolutie
1. Waar zit de trader nu in zijn/haar mentale ontwikkeling?
2. Wat is de volgende groeifase?
3. Wat houdt die volgende groeifase tegen?

### Trader Identity Update
Op basis van alle data: wat is de huidige kernidentiteit van deze trader? (1-2 zinnen, gedragsmatig beschreven)

### Focus voor volgende maand
"Als ik volgende maand alleen dit goed doe, zal mijn trading een niveau stijgen: ..."
(Exact 1 concreet aandachtspunt — gedragsmatig en meetbaar)

### Grootste overwinning van de maand
Nooit over geld — focus op discipline, mentale doorbraken, correcte uitvoering onder druk

Schrijf in het Nederlands. Wees concreet en direct. Analyseer nooit op P&L.`
}
