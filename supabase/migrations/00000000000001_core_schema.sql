create schema if not exists private;
create type org_role as enum ('owner','admin','member','viewer');
create type deal_stage as enum ('lead','qualified','proposal','negotiation','won','lost');
create type deal_channel as enum ('direct','shopee','lazada','tiktok','facebook','instagram','website');

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id));

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text, avatar_url text,
  created_at timestamptz not null default now());

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function private.set_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;

-- business tables (all follow this shape)
create table companies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null, industry text, website text, owner text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  name text not null, email text, phone text, title text, status text default 'Active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  name text not null, stage deal_stage not null default 'lead',
  amount numeric(12,2) not null default 0,
  channel deal_channel not null default 'direct',
  position int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null, sku text, type text default 'Product', status text default 'Active',
  price numeric(12,2) not null default 0, stock int not null default 0, image_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null, due_date date, status text default 'Open',
  assignee uuid references auth.users(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  number text not null, contact_id uuid references contacts(id) on delete set null,
  status text default 'Draft', currency text default 'USD',
  issued_at date, due_at date, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null, qty int not null default 1, unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table payment_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null, price numeric(12,2) not null default 0,
  interval text not null default 'month', description text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table social_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  content text not null, channel text not null, status text not null default 'Draft', scheduled_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table integration_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  key text not null, value jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (org_id, key));

do $$ declare t text;
begin
  foreach t in array array['orgs','companies','contacts','deals','products','tasks','invoices','invoice_items','payment_plans','social_posts','integration_settings'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function private.set_updated_at()', t);
  end loop;
end $$;
