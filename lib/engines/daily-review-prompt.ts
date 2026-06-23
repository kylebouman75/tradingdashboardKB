import type { DailyReviewContext } from '@/lib/daily-review'

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Zeer laag',
  2: 'Laag',
  3: 'Neutraal',
  4: 'Hoog',
  5: 'Zeer hoog',
}

const STRESS_LABELS: Record<number, string> = {
  1: 'Zeer laag',
  2: 'Laag',
  3: 'Gemiddeld',
  4: 'Hoog',
  5: 'Zeer hoog',
}

const FOLLOWED_PLAN_LABELS: Record<string, string> = {
  yes: 'Ja',
  partially: 'Gedeeltelijk',
  no: 'Nee',
}

const FALLBACK = 'Niet ingevuld'

function val(value: string | null | undefined): string {
  return value && value.trim() ? value : FALLBACK
}

function buildPreMarketSection(context: DailyReviewContext): string {
  const { preMarket } = context

  if (!preMarket) {
    return 'Geen Pre-Market ingevuld voor deze dag.'
  }

  const confidence = preMarket.confidence_score
    ? `${preMarket.confidence_score}/5 (${CONFIDENCE_LABELS[preMarket.confidence_score]})`
    : FALLBACK
  const stress = preMarket.stress_level
    ? `${preMarket.stress_level}/5 (${STRESS_LABELS[preMarket.stress_level]})`
    : FALLBACK

  return `Bias: ${val(preMarket.bias)}
Belangrijke levels: ${val(preMarket.important_levels)}
Scenario's: ${val(preMarket.scenarios)}
A+ setup criteria: ${val(preMarket.a_plus_criteria)}
Risk plan: ${val(preMarket.risk_plan)}
Mentale staat: ${val(preMarket.mental_state)}
Focuspunt: ${val(preMarket.focus_point)}
Te vermijden: ${val(preMarket.avoid_today)}
Confidence score: ${confidence}
Stressniveau: ${stress}`
}

function buildTradesSection(context: DailyReviewContext): string {
  if (context.trades.length === 0) {
    return 'Geen trades gelogd voor deze dag.'
  }

  return context.trades
    .map(
      (trade, index) => `Trade ${index + 1}: ${trade.symbol} | ${trade.direction} | ${trade.outcome} | RR: ${
        trade.rr ?? FALLBACK
      }
Technische analyse: ${val(trade.technical_analysis)}
Trade management: ${val(trade.trade_management_notes)}
Emotie: ${trade.emotionName ?? FALLBACK}`
    )
    .join('\n\n')
}

function buildPostMarketSection(context: DailyReviewContext): string {
  const { postMarket, pitfallNames } = context

  if (!postMarket) {
    return 'Geen Post-Market ingevuld voor deze dag.'
  }

  const followedPlan = postMarket.followed_plan
    ? FOLLOWED_PLAN_LABELS[postMarket.followed_plan]
    : FALLBACK

  return `Hoe begon de dag: ${val(postMarket.day_start_feeling)}
Hoe eindigde de dag: ${val(postMarket.day_end_feeling)}
Plan gevolgd: ${followedPlan}
Wat ging goed: ${val(postMarket.what_went_well)}
Wat ging minder goed: ${val(postMarket.what_went_less_well)}
Mentale verschuivingen: ${val(postMarket.mental_shifts)}
Valkuilen aanwezig: ${pitfallNames.length > 0 ? pitfallNames.join(', ') : FALLBACK}
Meenemen naar morgen: ${val(postMarket.take_forward)}
Vrije reflectie: ${val(postMarket.free_reflection)}`
}

export function buildDailyReviewPrompt(context: DailyReviewContext): string {
  return `Je bent een trading performance coach. Analyseer de tradingdag van vandaag uitsluitend op proceskwaliteit, discipline en gedrag. Analyseer NOOIT op winst of verlies. P&L is niet relevant.

## Centrale vraag
Hoe goed heeft de trader vandaag zijn/haar proces uitgevoerd?

## Pre-Market (voorbereiding)
${buildPreMarketSection(context)}

## Trades van de dag
${buildTradesSection(context)}

## Post-Market reflectie
${buildPostMarketSection(context)}

## Jouw analyse moet bevatten:

### Per trade
Voor elke trade:
- Was het volgens plan? (setup, confluence, confirmations)
- Entry kwaliteit (timing, context)
- Trade management (TP/SL, aanpassingen)
- Emotionele controle (rust, twijfel, FOMO, onrust)
- Execution classificatie: 🟢 A-Game / 🟡 B-Game / 🔴 C-Game
- Mistake classificatie: 🟢 A Mistake (markt/variance) / 🟡 B Mistake (kleine afwijking) / 🔴 C Mistake (emotie/impuls/FOMO)

### Mentale analyse
Analyseer: challenge-druk, hindsight bias, overanalyse, perfectionisme, controlebehoefte, resultaatgerichtheid, emotionele stabiliteit. Koppel aan terugkerende patronen indien zichtbaar.

### Dagconclusie
🔑 Belangrijkste inzicht van de dag (1 zin)
🎯 Focuspunt voor morgen (maximaal 1 concreet verbeterpunt)

Schrijf in het Nederlands. Wees concreet en direct. Analyseer nooit op P&L of financiële resultaten.`
}
