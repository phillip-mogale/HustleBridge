-- HustleBridge database contract. Run once in the Supabase SQL editor.
-- The front end and the Cloudflare Worker already speak to exactly these tables and columns.
-- Rule: every user table has row-level security, and a person can only touch rows where user_id = auth.uid().

create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  name text, stage text, location text, resources text, main_challenge text,
  before_rating int check (before_rating between 1 and 5),
  after_rating  int check (after_rating  between 1 and 5),
  state jsonb,                       -- full app snapshot, used to restore work on a new device
  updated_at timestamptz default now()
);
create table if not exists blueprints (
  user_id uuid primary key references auth.users on delete cascade,
  shape text, name text, data jsonb, -- data holds values, labels and a user/ai source flag per number
  confirmed_at timestamptz, updated_at timestamptz default now()
);
create table if not exists mission_progress (
  user_id uuid references auth.users on delete cascade,
  mission int check (mission between 1 and 4),
  responses jsonb, rationale text, completed_at timestamptz,
  primary key (user_id, mission)
);
create table if not exists simulation_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  inputs jsonb, event text, chosen_action text, outcome jsonb, rationale text,
  created_at timestamptz default now()
);
create table if not exists events (       -- pilot metrics: blueprint_confirmed, mission_completed, rating_after, opportunity_opened ...
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text not null, props jsonb, at timestamptz default now()
);
create table if not exists opportunities ( -- optional: the app ships with a curated list in src/lib/opportunities.js
  id text primary key, title text, type text, eligibility text, stage text, location text,
  source_url text not null, verified_deadline date, last_checked date not null
);

do $$ declare t text; begin
  foreach t in array array['profiles','blueprints','mission_progress','simulation_sessions','events'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own rows" on %I', t);
    execute format('create policy "own rows" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table opportunities enable row level security;
drop policy if exists "read all" on opportunities;
create policy "read all" on opportunities for select using (true);   -- read-only for users; write with the service role only

-- Test with two accounts: account B must get an empty result for every table when asking for account A's user_id.
