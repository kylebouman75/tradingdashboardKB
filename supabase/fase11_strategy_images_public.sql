-- Fase 11: Strategy Library — maak strategy-images bucket public
-- De bucket is aangemaakt in fase2_schema.sql met public = false.
-- getPublicUrl() geeft dan een URL die niet laadbaar is in een <img> tag.
-- Voer dit eenmalig uit in de Supabase SQL Editor.

update storage.buckets
set public = true
where id = 'strategy-images';
