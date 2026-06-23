import type { WeeklyReviewContext } from '@/lib/weekly-review'

const FALLBACK = 'Niet ingevuld'

function val(value: string | null | undefined): string {
  return value && value.trim() ? value : FALLBACK
}

function buildGameDaySection(context: WeeklyReviewContext): string {
  if (context.gameDayReviews.length === 0) {
    return 'Geen Game Day classificaties beschikbaar voor deze week.'
  }

  return context.gameDayReviews
    .map((entry) =>
      entry.summary
        ? `${entry.date}: ${entry.classification} — ${entry.summary}`
        : `${entry.date}: ${entry.classification}`
    )
    .join('\n')
}

function buildDailyReviewsSection(context: WeeklyReviewContext): string {
  if (context.approvedDailyReviews.length === 0) {
    return 'Geen goedgekeurde Daily Reviews beschikbaar voor deze week.'
  }

  return context.approvedDailyReviews
    .map((entry) => `${entry.date}: ${entry.content}`)
    .join('\n\n')
}

function buildReflectionSection(context: WeeklyReviewContext): string {
  const { reflection, pitfallNames } = context

  if (!reflection) {
    return 'Geen Weekly Reflection ingevuld voor deze week.'
  }

  const feelings = Array.isArray(reflection.week_feelings)
    ? reflection.week_feelings.filter((item): item is string => typeof item === 'string')
    : []

  return `Hoe voelde de week aan: ${feelings.length > 0 ? feelings.join(', ') : FALLBACK}
Structureel goed: ${val(reflection.structural_good)}
Energie kostte: ${val(reflection.energy_cost)}
Terugkerende valkuil: ${pitfallNames.length > 0 ? pitfallNames.join(', ') : FALLBACK}
Trots op: ${val(reflection.proud_of)}
Verbetering volgende week: ${val(reflection.improve_next_week)}
Vrije reflectie: ${val(reflection.free_reflection)}`
}

function buildHistorySection(context: WeeklyReviewContext): string {
  if (context.historicalReviews.length === 0) {
    return 'Geen historische Weekly Reviews beschikbaar.'
  }

  return context.historicalReviews
    .map((entry) => `${entry.weekStartDate}: ${entry.summary ?? 'Geen samenvatting beschikbaar.'}`)
    .join('\n')
}

export function buildWeeklyReviewPrompt(context: WeeklyReviewContext): string {
  return `Je bent een trading performance coach. Analyseer de afgelopen tradingweek en identificeer concrete verbeteringen. Analyseer NOOIT op winst of verlies. P&L is niet relevant.

## Centrale vraag
Wat moet de trader concreet verbeteren op basis van alles wat hij/zij deze week heeft gedaan?

## Weekoverzicht
Week: ${context.weekStartDate} t/m ${context.weekEndDate}
Aantal tradingdagen: ${context.tradingDayCount}
Aantal trades: ${context.trades.length}

## Game Day classificaties deze week
${buildGameDaySection(context)}

## Daily Reviews deze week
${buildDailyReviewsSection(context)}

## Weekly Reflection (handmatige input van trader)
${buildReflectionSection(context)}

## Historische context (laatste 4 weken)
${buildHistorySection(context)}

## Jouw analyse moet bevatten:

### Wat ging structureel goed? (maximaal 5 terugkerende sterke punten)

### Wat kostte deze week het meeste performance? (maximaal 3 terugkerende patronen — geen losse incidenten)

### Grootste bottleneck
(Exact 1 — het onderdeel met de grootste impact als de trader slechts één ding zou verbeteren)

### Concrete verbetering
(Exact 1 verbeterpunt — gedragsmatig en concreet, geen vage adviezen)

### Grootste mentale leak
(Exact 1 — bijv. hindsight bias, controlebehoefte, resultaatgericht denken, perfectionisme, challenge-druk)

### Evolutie als trader
1. Waar ben ik beter in geworden?
2. Wat blijft terugkomen?
3. Wat is mijn volgende groeifase?

### Grootste overwinning van de week
(Nooit over geld — focus op discipline, geduld, emotionele regulatie, A-game momenten)

### Focus voor volgende week
"Als ik volgende week alleen dit goed doe, zal mijn trading verbeteren: ..."
(Maximaal 1 concreet aandachtspunt)

Schrijf in het Nederlands. Wees concreet en direct. Analyseer nooit op P&L.`
}
