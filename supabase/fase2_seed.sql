-- Trading OS — Fase 2: Seed data
-- Voer dit bestand pas uit NA fase2_schema.sql en NA je eigen registratie.
--
-- Belangrijk: de Supabase SQL Editor draait als beheerder, niet als de ingelogde
-- gebruiker, dus auth.uid() werkt hier niet. Vervang de placeholder hieronder door
-- jouw eigen user_id. Je vindt deze in: Authentication -> Users -> (jouw account) -> User UID.

-- Vervang elke '0a79cdc9-b450-4aa4-a490-1deede46456b' door jouw eigen UUID, bijvoorbeeld:
-- '11111111-2222-3333-4444-555555555555'

insert into public.trading_sessions (user_id, name, sort_order) values
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Amsterdam', 1),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Londen', 2),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'New York AM', 3),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'New York PM', 4),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Londen → New York overlap', 5);

insert into public.emotions (user_id, name, sort_order) values
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Rustig', 1),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Gefocust', 2),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Zelfverzekerd', 3),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Twijfel', 4),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'FOMO', 5),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Gestrest', 6),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Gehaast', 7),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Gefrustreerd', 8);

insert into public.pitfalls (user_id, name, sort_order) values
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'FOMO', 1),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Overanalyse', 2),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Hindsight bias', 3),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Controlebehoefte', 4),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Perfectionisme', 5),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Externe ruis', 6),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Resultaatgericht denken', 7);

insert into public.screenshot_labels (user_id, name, context) values
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Pre-trade', 'trade'),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'During trade', 'trade'),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Post-trade', 'trade'),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Pre-backtest', 'backtest'),
('0a79cdc9-b450-4aa4-a490-1deede46456b', 'Post-backtest', 'backtest');
