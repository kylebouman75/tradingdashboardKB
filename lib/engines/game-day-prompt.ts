import type { GameDayContext } from '@/lib/game-day'

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

function buildPreMarketSection(context: GameDayContext): string {
  const { preMarket, sessionName } = context

  if (!preMarket) {
    return 'Geen Pre-Market ingevuld voor deze dag.'
  }

  const confidence = preMarket.confidence_score
    ? `${preMarket.confidence_score}/5 (${CONFIDENCE_LABELS[preMarket.confidence_score]})`
    : FALLBACK
  const stress = preMarket.stress_level
    ? `${preMarket.stress_level}/5 (${STRESS_LABELS[preMarket.stress_level]})`
    : FALLBACK

  return `Mentale staat: ${val(preMarket.mental_state)}
Focuspunt: ${val(preMarket.focus_point)}
Te vermijden: ${val(preMarket.avoid_today)}
Confidence score: ${confidence}
Stressniveau: ${stress}
Sessie: ${sessionName ?? FALLBACK}`
}

function buildTradesSection(context: GameDayContext): string {
  if (context.trades.length === 0) {
    return 'Geen trades gelogd voor deze dag.'
  }

  return context.trades
    .map(
      (trade, index) => `Trade ${index + 1}: ${trade.symbol} | ${trade.direction} | ${trade.outcome} | RR: ${
        trade.rr ?? FALLBACK
      }
Emotie: ${trade.emotionName ?? FALLBACK}
Trade management: ${val(trade.trade_management_notes)}`
    )
    .join('\n\n')
}

function buildPostMarketSection(context: GameDayContext): string {
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
Meenemen naar morgen: ${val(postMarket.take_forward)}`
}

function buildHistorySection(context: GameDayContext): string {
  if (context.recentClassifications.length === 0) {
    return 'Geen historische Game Day classificaties beschikbaar.'
  }

  return context.recentClassifications
    .map((entry) => `${entry.date}: ${entry.classification}`)
    .join('\n')
}

export function buildGameDayPrompt(context: GameDayContext): string {
  return `Je bent een trading performance coach gespecialiseerd in mentale performance analyse. Analyseer de mentale staat van de trader vandaag. Analyseer NOOIT op winst of verlies. P&L is niet relevant.

## Centrale vraag
In welke mentale staat verkeerde de trader vandaag?

## Pre-Market (mentale voorbereiding)
${buildPreMarketSection(context)}

## Trades van de dag
${buildTradesSection(context)}

## Post-Market reflectie
${buildPostMarketSection(context)}

## Historische context (laatste 7 dagen)
${buildHistorySection(context)}

## Jouw analyse moet bevatten:

### CLASSIFICATIE
Kies één van de volgende classificaties op basis van de mentale performance van vandaag:
- A (volledig in flow, discipline, geduld, emotionele stabiliteit)
- B (solide dag, kleine afwijkingen, stabiel maar niet optimaal)
- C (emoties, impulsiviteit, FOMO, onrust, gebrek aan discipline)
- B→A (begon twijfelend, eindigde sterk)
- A→B (begon sterk, zakte weg)
- B→C (verslechterde gedurende de dag)

Schrijf de classificatie op de EERSTE regel van je antwoord in dit exacte formaat:
CLASSIFICATIE: [A|B|C|B→A|A→B|B→C]

### Waarom deze classificatie?
Beschrijf hoe de dag begon, hoe hij eindigde en welke mentale verschuivingen plaatsvonden.

### Wat ging mentaal goed?
Discipline, emotionele regulatie, geduld, focus — benoem concrete momenten.

### B-invloeden
Lichte twijfel, recente verliezen, te lang analyseren, resultaatgericht denken. Indien geen B-invloeden: "Geen duidelijke B-invloeden aanwezig."

### C-invloeden
FOMO, onrust, externe ruis, setup forceren, impulsiviteit. Indien geen C-invloeden: "Geen duidelijke C-invloeden aanwezig."

### Intuïtie-systeem
Rust = A-game / Twijfel = B-game / Onrust = C-game
Analyseer het intuïtieniveau van vandaag.

### Grootste mentale winst
(1 concreet inzicht uit deze dag)

### Focuspunt voor morgen
(maximaal 1 concreet aandachtspunt)

Schrijf in het Nederlands. Wees concreet. Analyseer nooit op P&L.`
}
