-- Trading OS — Fase 2: Database Schema & RLS
-- Plak dit volledige bestand in het Supabase dashboard onder SQL Editor -> New query en voer het uit.
-- Volgorde is van belang vanwege foreign key afhankelijkheden. Voer dit bestand in zijn geheel uit.

-- ============================================================
-- Stap 0 — Vereiste extensie voor gen_random_uuid()
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- Stap 1 — Auth & Profiel
-- ============================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text,
  avatar_url text,
  email text,
  theme text default 'dark' check (theme in ('dark', 'light')),
  language text default 'nl',
  accent_color text default 'blue',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Stap 2 — Configureerbare lijsten
-- ============================================================
create table public.trading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

create table public.emotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

create table public.pitfalls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

create table public.screenshot_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  context text default 'trade' check (context in ('trade', 'backtest')),
  created_at timestamptz default now() not null
);

-- ============================================================
-- Stap 3 — Custom Trade Fields
-- ============================================================
create table public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('text', 'textarea', 'number', 'dropdown', 'multiselect', 'boolean', 'date', 'time', 'rating')),
  options jsonb,
  sort_order integer default 0,
  is_hidden boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Stap 4 — Strategy Library
-- ============================================================
create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  explanation text,
  setup_conditions text,
  entry_criteria text,
  exit_criteria text,
  trade_management_rules text,
  a_plus_criteria text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.strategy_images (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid references public.strategies(id) on delete cascade not null,
  storage_url text not null,
  label text,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Stap 5 — Trade Log
-- ============================================================
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  time time,
  session_id uuid references public.trading_sessions(id) on delete set null,
  symbol text not null,
  strategy_id uuid references public.strategies(id) on delete set null,
  direction text not null check (direction in ('long', 'short')),
  outcome text not null check (outcome in ('win', 'loss', 'breakeven')),
  rr numeric,
  technical_analysis text,
  trade_management_notes text,
  emotion_id uuid references public.emotions(id) on delete set null,
  custom_field_values jsonb default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.trade_screenshots (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid references public.trades(id) on delete cascade not null,
  storage_url text not null,
  label text,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Stap 6 — Pre-Market
-- ============================================================
create table public.pre_market_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  session_id uuid references public.trading_sessions(id) on delete set null,
  bias text,
  important_levels text,
  scenarios text,
  a_plus_criteria text,
  risk_plan text,
  mental_state text,
  focus_point text,
  avoid_today text,
  confidence_score integer check (confidence_score between 1 and 5),
  stress_level integer check (stress_level between 1 and 5),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Stap 7 — Post-Market
-- ============================================================
create table public.post_market_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  day_start_feeling text,
  day_end_feeling text,
  followed_plan text check (followed_plan in ('yes', 'partially', 'no')),
  what_went_well text,
  what_went_less_well text,
  mental_shifts text,
  pitfalls_present jsonb default '[]',
  take_forward text,
  free_reflection text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Stap 8 — Analysis Engine outputs (dagelijks)
-- ============================================================
create table public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  status text default 'generated' check (status in ('generated', 'draft', 'approved', 'stored')),
  generated_content jsonb,
  approved_content jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.game_day_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  classification text check (classification in ('A', 'B', 'C', 'B→A', 'A→B', 'B→C')),
  status text default 'generated' check (status in ('generated', 'draft', 'approved', 'stored')),
  generated_content jsonb,
  approved_content jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Stap 9 — Wekelijkse workflow
-- ============================================================
create table public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start_date date not null,
  week_feelings jsonb default '[]',
  structural_good text,
  energy_cost text,
  recurring_pitfalls jsonb default '[]',
  proud_of text,
  improve_next_week text,
  free_reflection text,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start_date date not null,
  status text default 'generated' check (status in ('generated', 'draft', 'approved', 'stored')),
  generated_content jsonb,
  approved_content jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Stap 10 — Maandelijkse workflow
-- ============================================================
create table public.monthly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  month_year text not null,
  month_feelings jsonb default '[]',
  visible_growth text,
  recurring_challenge text,
  lesson_learned text,
  improve_next_month text,
  personal_victory text,
  free_reflection text,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  month_year text not null,
  status text default 'generated' check (status in ('generated', 'draft', 'approved', 'stored')),
  generated_content jsonb,
  approved_content jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Stap 11 — Trader Identity Hub
-- ============================================================
create table public.trader_identity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  a_game jsonb default '{}',
  b_game jsonb default '{}',
  c_game jsonb default '{}',
  mental_leaks jsonb default '{}',
  patterns jsonb default '{}',
  strengths jsonb default '{}',
  current_growth_phase text,
  week_focus text,
  last_updated_at timestamptz default now(),
  created_at timestamptz default now() not null
);

create table public.identity_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  status text default 'active' check (status in ('active', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Stap 12 — Analytics (afgeleid, geen duplicatie)
-- ============================================================
create table public.process_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  streak_type text not null,
  current_count integer default 0,
  last_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.growth_timeline (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  period_label text not null,
  focus_description text,
  status text default 'active' check (status in ('active', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Stap 13 — Research (Backtest)
-- ============================================================
create table public.backtests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  symbol text not null,
  strategy_id uuid references public.strategies(id) on delete set null,
  hypothesis text,
  market_context text,
  setup_description text,
  entry_criteria text,
  exit_criteria text,
  rr numeric,
  what_worked text,
  what_didnt text,
  observations text,
  conclusion text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.backtest_screenshots (
  id uuid primary key default gen_random_uuid(),
  backtest_id uuid references public.backtests(id) on delete cascade not null,
  storage_url text not null,
  label text,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Updated_at trigger functie
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.custom_field_definitions
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.strategies
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.trades
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.pre_market_entries
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.post_market_entries
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.daily_reviews
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.game_day_reviews
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.weekly_reflections
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.weekly_reviews
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.monthly_reflections
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.monthly_reviews
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.process_streaks
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Auto-aanmaken van profiles bij registratie
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Tabellen met user_id (universele policy)
alter table public.profiles enable row level security;
create policy "Users can only access own data" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.trading_sessions enable row level security;
create policy "Users can only access own data" on public.trading_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.emotions enable row level security;
create policy "Users can only access own data" on public.emotions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.pitfalls enable row level security;
create policy "Users can only access own data" on public.pitfalls
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.screenshot_labels enable row level security;
create policy "Users can only access own data" on public.screenshot_labels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.custom_field_definitions enable row level security;
create policy "Users can only access own data" on public.custom_field_definitions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.strategies enable row level security;
create policy "Users can only access own data" on public.strategies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.trades enable row level security;
create policy "Users can only access own data" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.pre_market_entries enable row level security;
create policy "Users can only access own data" on public.pre_market_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.post_market_entries enable row level security;
create policy "Users can only access own data" on public.post_market_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.daily_reviews enable row level security;
create policy "Users can only access own data" on public.daily_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.game_day_reviews enable row level security;
create policy "Users can only access own data" on public.game_day_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.weekly_reflections enable row level security;
create policy "Users can only access own data" on public.weekly_reflections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.weekly_reviews enable row level security;
create policy "Users can only access own data" on public.weekly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.monthly_reflections enable row level security;
create policy "Users can only access own data" on public.monthly_reflections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.monthly_reviews enable row level security;
create policy "Users can only access own data" on public.monthly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.trader_identity enable row level security;
create policy "Users can only access own data" on public.trader_identity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.identity_challenges enable row level security;
create policy "Users can only access own data" on public.identity_challenges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.process_streaks enable row level security;
create policy "Users can only access own data" on public.process_streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.growth_timeline enable row level security;
create policy "Users can only access own data" on public.growth_timeline
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.backtests enable row level security;
create policy "Users can only access own data" on public.backtests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tabellen zonder user_id (policy via parent-tabel)
alter table public.strategy_images enable row level security;
create policy "Users can access own strategy images" on public.strategy_images for all
using (
  exists (
    select 1 from public.strategies
    where strategies.id = strategy_images.strategy_id
    and strategies.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.strategies
    where strategies.id = strategy_images.strategy_id
    and strategies.user_id = auth.uid()
  )
);

alter table public.trade_screenshots enable row level security;
create policy "Users can access own trade screenshots" on public.trade_screenshots for all
using (
  exists (
    select 1 from public.trades
    where trades.id = trade_screenshots.trade_id
    and trades.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trades
    where trades.id = trade_screenshots.trade_id
    and trades.user_id = auth.uid()
  )
);

alter table public.backtest_screenshots enable row level security;
create policy "Users can access own backtest screenshots" on public.backtest_screenshots for all
using (
  exists (
    select 1 from public.backtests
    where backtests.id = backtest_screenshots.backtest_id
    and backtests.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.backtests
    where backtests.id = backtest_screenshots.backtest_id
    and backtests.user_id = auth.uid()
  )
);

-- ============================================================
-- Supabase Storage buckets (privé)
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('trade-screenshots', 'trade-screenshots', false),
  ('strategy-images', 'strategy-images', false),
  ('backtest-screenshots', 'backtest-screenshots', false),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Storage policies: pad moet beginnen met de user_id van de gebruiker,
-- bijv. trade-screenshots/{user_id}/{filename}
create policy "Users can read own files in trade-screenshots"
on storage.objects for select
using (bucket_id = 'trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can upload own files in trade-screenshots"
on storage.objects for insert
with check (bucket_id = 'trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own files in trade-screenshots"
on storage.objects for delete
using (bucket_id = 'trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own files in strategy-images"
on storage.objects for select
using (bucket_id = 'strategy-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can upload own files in strategy-images"
on storage.objects for insert
with check (bucket_id = 'strategy-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own files in strategy-images"
on storage.objects for delete
using (bucket_id = 'strategy-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own files in backtest-screenshots"
on storage.objects for select
using (bucket_id = 'backtest-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can upload own files in backtest-screenshots"
on storage.objects for insert
with check (bucket_id = 'backtest-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own files in backtest-screenshots"
on storage.objects for delete
using (bucket_id = 'backtest-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own files in avatars"
on storage.objects for select
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can upload own files in avatars"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own files in avatars"
on storage.objects for delete
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
