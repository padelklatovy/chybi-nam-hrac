-- ============================================================
--  HLEDÁM HRU — Supabase schéma
--  Spusť v Supabase: Database → SQL Editor → New query.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  creator     text not null default 'Hráč',
  date        date not null,
  time        text not null,
  level       text not null default 'mix',
  type        text not null default 'volná hra',
  court       text default '',
  note        text default '',
  needed      integer not null default 1,   -- kolik hráčů ještě hledáme (0 = plno)
  status      text not null default 'open',  -- open | full | closed
  created_at  timestamptz not null default now()
);

create index if not exists matches_date_idx on public.matches (date, time);
create index if not exists matches_status_idx on public.matches (status);

-- RLS: pro MVP otevřené (komunitní nástroj bez účtů)
alter table public.matches enable row level security;
create policy "open read"  on public.matches for select using (true);
create policy "open write" on public.matches for all    using (true) with check (true);

-- ukázková data
insert into public.matches (creator, date, time, level, type, court, note, needed, status) values
  ('Filip', current_date,            '18:00', 'B1',  'volná hra',        'Kurt 1', 'Svižné tempo, hrajeme na výsledek.', 2, 'open'),
  ('Petra', current_date + 1,        '10:00', 'C1',  'tréninkový zápas', '',       'V klidu, ideální na zlepšení.',      1, 'open'),
  ('Tomáš', current_date + 2,        '19:30', 'mix', 'Americano',        'Kurt 2', 'Klubové Americano, přijďte všichni!',0, 'full')
on conflict do nothing;
