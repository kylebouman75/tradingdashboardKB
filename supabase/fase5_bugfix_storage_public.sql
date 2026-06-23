-- Fase 5 bugfix: de 'trade-screenshots' bucket is in fase2_schema.sql aangemaakt
-- met public = false. supabase.storage.from('trade-screenshots').getPublicUrl()
-- geeft dan een URL terug die niet laadbaar is in een <img> tag (geen geldige
-- sessie/API-key bij een kale GET request), waardoor screenshots niet zichtbaar zijn.
--
-- Voer dit eenmalig uit in de Supabase SQL Editor van het project.

update storage.buckets
set public = true
where id = 'trade-screenshots';
