# Trading OS — Project Instructies voor Claude Code

## Verplicht aan het einde van elke sessie

Na het voltooien van alle wijzigingen, voer altijd uit:

```bash
git add .
git commit -m "auto: [korte beschrijving van wat gebouwd is]"
git push
```

Doe dit zonder dat de gebruiker erom hoeft te vragen.

## Stack

- Next.js 14.2.5 (App Router)
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Database + Storage)
- Groq via Vercel AI SDK
- Nederlandse UI

## Vaste regels

- Gebruik altijd "Analysis Engine" — nooit "AI Engine"
- Geen P&L of geldbedragen opslaan — alleen RR
- Geen numerieke scores (0–100)
- Autosave overal (debounce 1s) — geen handmatige Save knoppen
- `generated_content` wordt NOOIT overschreven na aanmaak
- RLS actief op alle tabellen: `auth.uid() = user_id`
- Seed data: altijd `SELECT COUNT(*) > 0` checken vóór invoegen
- Taal: Nederlands
- Dark mode standaard, blauwe accent kleur
