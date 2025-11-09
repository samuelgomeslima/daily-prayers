-- Enable extensions required for UUID generation.
create extension if not exists "pgcrypto";

-- Helper function to automatically refresh the updated_at column.
create or replace function set_updated_at()
returns trigger as
$$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notes_set_updated_at
before update on notes
for each row execute procedure set_updated_at();

create table if not exists life_plan_practices (
  id text not null,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  is_default boolean not null default false,
  completed_periods text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

create trigger life_plan_practices_set_updated_at
before update on life_plan_practices
for each row execute procedure set_updated_at();

create table if not exists rosary_progress (
  user_id uuid not null references users(id) on delete cascade,
  sequence_id text not null,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, sequence_id)
);

create trigger rosary_progress_set_updated_at
before update on rosary_progress
for each row execute procedure set_updated_at();

create table if not exists model_settings (
  user_id uuid primary key references users(id) on delete cascade,
  catechist_model text not null,
  chat_model text not null,
  updated_at timestamptz not null default now()
);

create trigger model_settings_set_updated_at
before update on model_settings
for each row execute procedure set_updated_at();
