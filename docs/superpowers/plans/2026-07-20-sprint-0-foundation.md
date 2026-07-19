# Sprint 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the vine-solutions org/repo with CI, a Supabase project with the full multi-tenant schema + RLS, real auth replacing the fake login, and Contacts running on live data.

**Architecture:** Mono-repo (`apps/web` Vite SPA, `supabase/` migrations+functions). supabase-js talks straight to Postgres; RLS with `private.*` security-definer helpers is the security boundary. Auth = Supabase email/password; org bootstrap via `create_org_with_owner` RPC.

**Tech Stack:** Vite 8 + React 19 (plain JS, no TS), Tailwind 4, npm, oxlint, @supabase/supabase-js v2, @tanstack/react-query v5, Supabase CLI, GitHub Actions, Vercel.

## Global Constraints

- Package manager is **npm** (`package-lock.json`); CI uses `npm ci`.
- Plain JavaScript — do not introduce TypeScript files.
- Roles enum exactly: `owner | admin | member | viewer`. Deal stages: `lead|qualified|proposal|negotiation|won|lost`. Deal channels: `direct|shopee|lazada|tiktok|facebook|instagram|website`.
- RLS enabled on every table, no exceptions. Helpers live in schema `private` (not in `public`, not API-exposed).
- Anon key may live in client env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); service-role key must never appear in `apps/web` or git.
- Org name `vine-solutions` (fallback `vine-solutions-crm`); repo `vine-crm`, private.
- Follow existing UI patterns in `src/components/ui.jsx` and existing views; keep `MAIN_EMAIL` copy `admin@thevinesolutionsai.com`.

---

### Task 1: GitHub org + repo + mono-repo restructure

**Files:**
- Move: `vine-crm/**` → `apps/web/**` (git mv)
- Move: `app.js`, `index.html`, `styles.css`, `*.png` → `legacy/`
- Modify: `vercel.json`, `README.md`
- Create: `.gitignore` additions (`apps/web/node_modules`, `apps/web/dist`, `.env*`)

**Interfaces:**
- Produces: repo `vine-solutions/vine-crm` with `apps/web` buildable via `cd apps/web && npm ci && npm run build`. All later tasks assume this layout.

- [ ] **Step 1 (USER ACTION): Create the GitHub org.** Orgs cannot be created via API. User creates `vine-solutions` at https://github.com/organizations/plan (free plan) using the emmskie016 account. If taken, use `vine-solutions-crm` and substitute everywhere below.
- [ ] **Step 2: Restructure to mono-repo**

```bash
cd "/Users/emmerson_morales/Documents/The Vine Solutions Project"
mkdir -p apps legacy
git mv vine-crm apps/web
git mv app.js index.html styles.css legacy/
git mv topicvane-dashboard.png v-*.png vine-crm-dashboard*.png legacy/
```

- [ ] **Step 3: Update root files.** `vercel.json` becomes `{"$schema": "https://openapi.vercel.sh/vercel.json"}` placeholder removed content; actual routing configured in Vercel project settings (root dir `apps/web`). Update `README.md` top section to describe the mono-repo layout (apps/web, supabase, docs, legacy). Append to `.gitignore`:

```
apps/web/node_modules
apps/web/dist
.env
.env.*
supabase/.temp
```

- [ ] **Step 4: Verify the app still builds**

Run: `cd apps/web && npm ci && npm run lint && npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: restructure to mono-repo (apps/web, legacy)"
```

- [ ] **Step 6: Create org repo and repoint origin**

```bash
gh repo create vine-solutions/vine-crm --private --description "Vine CRM — multi-tenant sales platform"
git remote rename origin origin-old
git remote add origin https://github.com/vine-solutions/vine-crm.git
git push -u origin main
```

Expected: push succeeds. Keep `origin-old` (emmskie016/thevinecrmrepo) as archive; do not push to it again.

- [ ] **Step 7: Branch protection**

```bash
gh api -X PUT repos/vine-solutions/vine-crm/branches/main/protection \
  -f 'required_status_checks[strict]=true' -f 'required_status_checks[contexts][]=ci' \
  -F enforce_admins=false -F 'required_pull_request_reviews[required_approving_review_count]=0' \
  -F restrictions=null
```

Expected: 200. (If free-plan private repo rejects protection, note it and continue — non-blocking.)

---

### Task 2: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: status check named `ci` (used by Task 1 branch protection).

- [ ] **Step 1: Write workflow**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  ci:
    name: ci
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: apps/web } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm, cache-dependency-path: apps/web/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

- [ ] **Step 2: Push and verify**

Run: `git add .github && git commit -m "ci: lint+build workflow" && git push`
Then: `gh run watch --exit-status` — Expected: run `ci` green.

---

### Task 3: Supabase project + CLI setup

**Files:**
- Create: `supabase/config.toml` (generated by `supabase init`)

**Interfaces:**
- Produces: linked Supabase project ref `<PROJECT_REF>` (record it in `docs/superpowers/plans/sprint-0-notes.md`); local `supabase start` stack for tests. Later tasks run `supabase db push` / `supabase test`.

- [ ] **Step 1: Install CLI:** `brew install supabase/tap/supabase` — Expected: `supabase --version` ≥ 2.x.
- [ ] **Step 2 (USER ACTION if no token): Auth.** `supabase login` (opens browser) or set `SUPABASE_ACCESS_TOKEN`.
- [ ] **Step 3: Create + link project**

```bash
cd "/Users/emmerson_morales/Documents/The Vine Solutions Project"
supabase init
supabase projects create vine-crm --org-id "$(supabase orgs list -o json | jq -r '.[0].id')" --db-password "$(openssl rand -base64 24)" --region ap-southeast-1
supabase link --project-ref <PROJECT_REF>
```

Save the generated db password to the user's password manager (tell the user the value once, do not store in git).

- [ ] **Step 4: Commit** `git add supabase/config.toml .gitignore && git commit -m "chore: supabase init + link"`

---

### Task 4: Core schema migration + seed

**Files:**
- Create: `supabase/migrations/00000000000001_core_schema.sql`
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: enums `org_role`, `deal_stage`, `deal_channel`; tables `orgs, org_members, profiles, companies, contacts, deals, products, tasks, invoices, invoice_items, payment_plans, social_posts, integration_settings`; trigger `handle_new_user`; `set_updated_at` trigger on all tables. Task 5 policies reference these exact names.

- [ ] **Step 1: Write migration** (`00000000000001_core_schema.sql`):

```sql
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
```

- [ ] **Step 2: Write `supabase/seed.sql`** — port the demo data from `apps/web/src/lib/store.js` `defaultState` (companies, contacts, deals, products, tasks, payment plans, social posts) into inserts under a demo org `('Vine Demo','vine-demo')`. Map old stage names: New→lead, Qualified→qualified, Proposal→proposal, Negotiation→negotiation, Won→won, Lost→lost. Map old channels: Direct→direct, Online store→website, Marketplace→shopee, Retail→direct, Wholesale→direct.
- [ ] **Step 3: Verify locally:** `supabase start && supabase db reset` — Expected: migration + seed apply cleanly.
- [ ] **Step 4: Commit** `git add supabase && git commit -m "feat(db): core multi-tenant schema + seed"`

---

### Task 5: RLS helpers, policies, storage, bootstrap RPC + tests

**Files:**
- Create: `supabase/migrations/00000000000002_rls.sql`
- Create: `supabase/tests/rls_test.sql`

**Interfaces:**
- Consumes: all Task 4 tables/enums.
- Produces: `private.user_org_ids()`, `private.user_role(uuid)`, `public.create_org_with_owner(text, text)` returning `uuid` (new org id). Frontend Task 7 calls `supabase.rpc('create_org_with_owner', { org_name, org_slug })`.

- [ ] **Step 1: Write migration**

```sql
create function private.user_org_ids() returns setof uuid
language sql stable security definer set search_path = public as
$$ select org_id from org_members where user_id = auth.uid() $$;

create function private.user_role(org uuid) returns org_role
language sql stable security definer set search_path = public as
$$ select role from org_members where user_id = auth.uid() and org_id = org $$;

create function public.create_org_with_owner(org_name text, org_slug text) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_org uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into orgs (name, slug) values (org_name, org_slug) returning id into new_org;
  insert into org_members (org_id, user_id, role) values (new_org, auth.uid(), 'owner');
  return new_org;
end $$;

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table profiles enable row level security;

create policy "members read own orgs" on orgs for select using (id in (select private.user_org_ids()));
create policy "admins update org" on orgs for update using (private.user_role(id) in ('owner','admin'));
create policy "members read membership" on org_members for select using (org_id in (select private.user_org_ids()));
create policy "admins manage membership" on org_members for all
  using (private.user_role(org_id) in ('owner','admin'))
  with check (private.user_role(org_id) in ('owner','admin'));
create policy "own profile read" on profiles for select using (true);
create policy "own profile write" on profiles for update using (user_id = auth.uid());

do $$ declare t text;
begin
  foreach t in array array['companies','contacts','deals','products','tasks','invoices','invoice_items','payment_plans','social_posts','integration_settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format($p$create policy "org read" on %I for select using (org_id in (select private.user_org_ids()))$p$, t);
    execute format($p$create policy "org insert" on %I for insert with check (org_id in (select private.user_org_ids()) and private.user_role(org_id) in ('owner','admin','member'))$p$, t);
    execute format($p$create policy "org update" on %I for update using (org_id in (select private.user_org_ids()) and private.user_role(org_id) in ('owner','admin','member'))$p$, t);
    execute format($p$create policy "org delete" on %I for delete using (private.user_role(org_id) in ('owner','admin'))$p$, t);
  end loop;
end $$;

insert into storage.buckets (id, name, public) values ('product-images','product-images', true)
  on conflict do nothing;
create policy "org upload product images" on storage.objects for insert
  with check (bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid in (select private.user_org_ids()));
create policy "public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
```

- [ ] **Step 2: Write failing RLS tests** (`supabase/tests/rls_test.sql`, pgTAP via `supabase test db`). Cover: anonymous sees 0 rows in every table; a seeded member of org A sees org A contacts but 0 of org B; viewer insert into contacts fails; member delete fails; admin delete succeeds; `create_org_with_owner` creates org + owner membership for an authed user. Use `select tests.create_supabase_user(...)`/`tests.authenticate_as(...)` from the `supabase_test_helpers` extension (add `create extension if not exists supabase_test_helpers;` guarded to test run).
- [ ] **Step 3: Run tests, verify they fail** before applying migration: `supabase test db` — Expected: failures (policies missing).
- [ ] **Step 4: Apply + pass:** `supabase db reset && supabase test db` — Expected: all pass.
- [ ] **Step 5: Push to hosted project:** `supabase db push` — Expected: both migrations applied remotely.
- [ ] **Step 6: Commit** `git add supabase && git commit -m "feat(db): RLS policies, helpers, bootstrap RPC, storage rules + tests"`

---

### Task 6: db CI workflow

**Files:**
- Create: `.github/workflows/db.yml`

**Interfaces:**
- Consumes: repo secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF` (set via `gh secret set`).

- [ ] **Step 1: Write workflow**

```yaml
name: db
on:
  pull_request: { paths: ['supabase/**'] }
  push: { branches: [main], paths: ['supabase/**'] }
jobs:
  verify:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db start
      - run: supabase db lint
      - run: supabase test db
  deploy:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      - run: supabase db push
```

- [ ] **Step 2: Set secrets** (`gh secret set SUPABASE_ACCESS_TOKEN` etc. — values from Task 3; USER ACTION for the access token if not in env).
- [ ] **Step 3: Commit, push, verify green:** `gh run watch --exit-status`.

---

### Task 7: Auth + org bootstrap in the app

**Files:**
- Create: `apps/web/src/lib/supabase.js`, `apps/web/src/lib/AuthContext.jsx`, `apps/web/.env.local` (untracked), `apps/web/.env.example`
- Modify: `apps/web/src/App.jsx` (replace fake login gate), `apps/web/src/lib/store.js` (remove AUTH_KEY logic only)
- Test: `apps/web/src/lib/AuthContext.test.jsx`

**Interfaces:**
- Consumes: `create_org_with_owner(org_name, org_slug)` RPC (Task 5).
- Produces: `supabase` client export; `useAuth()` returning `{ session, user, org, orgs, signIn(email,pw), signUp(email,pw,fullName,orgName), signOut(), setActiveOrg(id) }`. Task 8 uses `supabase` and `useAuth().org.id`.

- [ ] **Step 1: Install deps:** `cd apps/web && npm i @supabase/supabase-js @tanstack/react-query` and dev deps `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom`. Add `"test": "vitest run"` script.
- [ ] **Step 2: `src/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

`.env.example` lists both vars; `.env.local` holds real values (already gitignored).

- [ ] **Step 3: Write failing test** for AuthContext: mock `supabase.auth.getSession`/`onAuthStateChange`; assert `useAuth()` exposes null session initially, and after `signUp` it calls `supabase.auth.signUp` then `supabase.rpc('create_org_with_owner', …)`. Run `npm test` — Expected: FAIL (module missing).
- [ ] **Step 4: Implement `AuthContext.jsx`**: provider subscribes to `onAuthStateChange`; loads `org_members` joined to `orgs` for the user; `org` = first membership (persist choice in localStorage `vine-active-org`); `signUp` = `auth.signUp({ email, password, options:{ data:{ full_name } } })` then rpc `create_org_with_owner` with slug = kebab-cased org name + 4 random chars.
- [ ] **Step 5: Wire `App.jsx`**: wrap app in `QueryClientProvider` + `AuthProvider`; the existing login screen submits to `signIn`; add a sign-up form variant (name, org name, email, password); render app only when `session && org`. Remove `AUTH_KEY` localStorage logic from `store.js` (entity state stays for now).
- [ ] **Step 6: Verify:** `npm test` passes; `npm run dev`, sign up a real user in the browser against the hosted project, confirm org row exists (`supabase inspect` or Studio). Expected: login/logout works, refresh keeps session.
- [ ] **Step 7: Commit** `git commit -am "feat(auth): Supabase auth + org bootstrap replacing fake login"`

---

### Task 8: Contacts on live data

**Files:**
- Create: `apps/web/src/lib/queries/contacts.js`
- Modify: `apps/web/src/views/Records.jsx` (contacts tab only)
- Test: `apps/web/src/lib/queries/contacts.test.js`

**Interfaces:**
- Consumes: `supabase`, `useAuth().org.id`.
- Produces: `useContacts()` → TanStack query `['contacts', orgId]` returning rows; `useCreateContact()`, `useUpdateContact()`, `useDeleteContact()` mutations that invalidate `['contacts', orgId]`. Pattern to be replicated for every entity in Sprint 3.

- [ ] **Step 1: Write failing tests** for the query module (mock supabase client: `from('contacts').select().eq('org_id',…).order('created_at')`; create inserts `{...values, org_id}`). Run `npm test` — Expected: FAIL.
- [ ] **Step 2: Implement `contacts.js`**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../AuthContext'

export function useContacts() {
  const { org } = useAuth()
  return useQuery({
    queryKey: ['contacts', org.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts')
        .select('*, company:companies(id,name)')
        .eq('org_id', org.id).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function useContactMutation(fn) {
  const { org } = useAuth(); const qc = useQueryClient()
  return useMutation({ mutationFn: (v) => fn(v, org.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', org.id] }) })
}
export const useCreateContact = () => useContactMutation(async (values, org_id) => {
  const { error } = await supabase.from('contacts').insert({ ...values, org_id }); if (error) throw error })
export const useUpdateContact = () => useContactMutation(async ({ id, ...values }) => {
  const { error } = await supabase.from('contacts').update(values).eq('id', id); if (error) throw error })
export const useDeleteContact = () => useContactMutation(async ({ id }) => {
  const { error } = await supabase.from('contacts').delete().eq('id', id); if (error) throw error })
```

- [ ] **Step 3: Tests pass:** `npm test` — Expected: PASS.
- [ ] **Step 4: Swap Records.jsx contacts tab** from store state to these hooks (loading/error states with existing UI components; add/edit/delete forms call the mutations). Other tabs keep using the store untouched.
- [ ] **Step 5: E2E verify in browser:** sign in, create/edit/delete a contact, refresh — data persists; second browser profile with a different user/org sees none of it (RLS check).
- [ ] **Step 6: Commit** `git commit -am "feat(contacts): live Supabase data via TanStack Query"`

---

### Task 9: Vercel wiring

**Files:**
- Modify: `vercel.json` (SPA rewrite)

**Interfaces:**
- Consumes: built app in `apps/web`; env vars from Task 7.

- [ ] **Step 1:** `vercel.json` (root):

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- [ ] **Step 2: Create/link Vercel project** under team `tvs-ai` (`vercel link` — USER ACTION for OAuth if CLI unauthenticated), set Root Directory `apps/web`, framework Vite. Set env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for production + preview (`vercel env add`).
- [ ] **Step 3: Connect Git integration** to `vine-solutions/vine-crm` in Vercel dashboard (USER ACTION if org needs Vercel GitHub app install) so PRs get previews, main deploys prod.
- [ ] **Step 4: Deploy + verify:** `vercel deploy --prod`; open URL, sign in, contacts CRUD works. Expected: Sprint 0 exit criteria met.
- [ ] **Step 5: Commit** `git commit -am "chore: vercel SPA rewrites" && git push`

---

## Sprint 0 exit criteria (from spec)
Repo in org with green CI; migrations applied; RLS test matrix passing; real signup → org create → contacts CRUD verified in browser on a Vercel deploy.
