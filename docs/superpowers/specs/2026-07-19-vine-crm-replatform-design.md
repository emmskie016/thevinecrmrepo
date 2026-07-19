# Vine CRM Replatform — Design Spec

Date: 2026-07-19
Status: Approved design, pending implementation plan
Approach: Mono-repo + Supabase with JWT-claim/membership-table RLS (Approach A)

## Goal

Turn the client-side-only Vine CRM prototype (`vine-crm/` Vite SPA, all state in Zustand) into a multi-tenant SaaS: real auth, Postgres persistence with RLS as the security boundary, CI/CD, and new Conversations (email/SMS) + Email Campaigns features. Agile delivery across three tracks: frontend, backend, fullstack.

## Decisions (locked)

- New GitHub org **`vine-solutions`** (fallback `vine-solutions-crm` if taken), created via `gh` (authed as `ecm-star`). One private mono-repo **`vine-crm`**.
- **Supabase, new project** (tvs-ai account) — Postgres + Auth + Storage + Edge Functions. RLS on every table.
- **Multi-tenant**: `org_id` on every business table; roles `owner | admin | member | viewer`.
- **Keep Vite SPA** — `supabase-js` direct from the client; no separate API service. Backend track = schema, RLS, edge functions.
- **Email = Gmail OAuth per user** (2-way inbox + campaigns through the sender's Gmail).
- **SMS = provider-agnostic**: schema + UI + adapter interface now; no gateway wired until a client picks one.
- Vercel project under **tvs-ai** team; preview per PR, prod on `main`.

## 1. Org & repo layout

```
apps/web/          ← current vine-crm/ Vite app promoted here
supabase/          ← config.toml, migrations/, seed.sql, functions/
docs/              ← specs, sprint plans, ADRs
legacy/            ← old vanilla prototype (app.js, index.html, screenshots); excluded from CI
.github/workflows/ ← ci.yml, db.yml
```

`main` protected: PRs required, CI must pass. Branch naming `feat/*`, `fix/*`, `chore/*`.

## 2. Database schema

All tables: `id uuid pk default gen_random_uuid()`, `org_id uuid not null` (except `orgs`, `profiles`), `created_at`/`updated_at` (trigger-maintained).

Tenancy & identity:
- **orgs** (name, slug unique)
- **org_members** (org_id, user_id → auth.users, role `org_role` enum `owner|admin|member|viewer`, unique(org_id, user_id))
- **profiles** (user_id pk → auth.users, full_name, avatar_url) — auto-created by trigger on auth signup

CRM core:
- **companies** (name, industry, website, …)
- **contacts** (company_id fk nullable, name, email, phone, …)
- **deals** (contact_id, company_id, stage enum `lead|qualified|proposal|negotiation|won|lost`, amount numeric, channel enum `direct|shopee|lazada|tiktok|facebook|instagram|website`, position int for kanban ordering)
- **products** (name, sku, price, stock, image_url → Storage bucket `product-images`)
- **tasks** (title, due_date, status, assignee user_id, optional deal_id/contact_id)
- **invoices** + **invoice_items**; **payment_plans**
- **social_posts** (content, channel, status, scheduled_at)
- **integration_settings** (org_id, key, jsonb value) — replaces the store's integrations state

Conversations & marketing:
- **conversations** (org_id, contact_id, channel enum `email|sms`, subject, last_message_at, status `open|closed`)
- **messages** (conversation_id, direction `inbound|outbound`, body, from_addr, to_addr, provider_message_id, status `queued|sent|delivered|failed`, sent_by user_id nullable, created_at)
- **email_accounts** (org_id, user_id, gmail_address, OAuth refresh token in **Supabase Vault**, sync cursor/historyId)
- **campaigns** (org_id, name, subject, body_html, segment jsonb filter, status `draft|scheduled|sending|sent`, scheduled_at)
- **campaign_recipients** (campaign_id, contact_id, status, message_id fk nullable)

All schema changes as SQL migrations in `supabase/migrations/`; demo data mirrored in `seed.sql`.

## 3. RLS model

- RLS enabled on **every** table; Storage policies scope bucket paths by `{org_id}/...` prefix.
- Helpers in a `private` schema (not API-exposed), `security definer` to avoid recursive policy lookups:
  - `private.user_org_ids() returns setof uuid`
  - `private.user_role(org uuid) returns org_role`
- Standard policy per business table:
  - **select**: `org_id in (select private.user_org_ids())`
  - **insert/update**: same + role in `('owner','admin','member')`
  - **delete**: role in `('owner','admin')`
- **orgs/org_members** special cases: members read their own org's rows; only owner/admin manage members. Signup bootstrap via `security definer` RPC `create_org_with_owner(name)` (solves the insert chicken-and-egg).
- `email_accounts` OAuth tokens: never client-readable — access only via edge functions with service role; token material lives in Vault.
- **viewer** role = read-only everywhere.

## 4. Auth & frontend integration

- Supabase Auth email/password first; Google OAuth login later. Replaces the fake login in the Zustand store.
- `apps/web`: `supabase-js` client, `AuthProvider` + `OrgProvider` (active org in context, switcher for multi-org users).
- Entity state migrates incrementally from Zustand slices to TanStack Query hooks per table (`useDeals`, `useContacts`, …). Kanban drag persists `stage` + `position`.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key public by design; RLS is the boundary).

## 5. Conversations, email, campaigns, SMS

**Gmail (2-way email):**
- Per-user Google OAuth (`gmail.send`, `gmail.readonly`) via edge function callback; refresh tokens in Vault.
- Outbound: edge function `send-email` → Gmail API → writes `messages` row.
- Inbound: Gmail watch/push (Pub/Sub) → ingest edge function threads replies onto `conversations` by contact email + Gmail threadId. Fallback if Pub/Sub is deferred: periodic history sync via `pg_cron`-scheduled function.
- **Constraint**: Gmail send caps (~500/day consumer, ~2,000/day Workspace). Fine for 1:1 + small campaigns. If volume grows, add a bulk provider behind the same `messages` abstraction — no schema change.

**Campaigns:** compose → segment (jsonb filter on contacts: channel, company, deal stage) → schedule → edge function fans out via sender's Gmail with batching/rate-limit, tracks per-recipient status. Campaign sends also appear in each contact's conversation thread.

**SMS (provider-agnostic):** `channel='sms'` exists in schema/UI from day one. Single edge function `send-sms` with a provider-adapter interface; no gateway wired yet. UI shows SMS composer disabled with a "connect an SMS provider" state in Integrations.

**Frontend:** new **Conversations** nav — two-pane inbox (thread list with Email/SMS channel tabs, message view + reply composer). **Campaigns** view under Marketing (list, editor, recipient status table). Contact drawer gains a Conversations section.

## 6. CI/CD

- `ci.yml`: pnpm install, lint, typecheck, build on every PR.
- `db.yml`: PRs — `supabase db lint` + migration dry-run against shadow db; merge to `main` — `supabase db push` (access token in repo secrets).
- Vercel: root `apps/web`, preview deploys per PR, prod on `main`.

## 7. Testing

- Vitest for store/hooks and adapter logic.
- SQL-based RLS tests (role × table matrix: each of the 4 roles + anonymous, per table, per verb) run against the shadow db in CI.
- Playwright smoke: login → dashboard → kanban drag → conversation reply.

## 8. Agile tracks & sprint plan

GitHub Projects board in the org; swimlane labels `frontend`, `backend`, `fullstack`.

**Sprint 0 — foundation (execute first):**
| # | Track | Story |
|---|---|---|
| 1 | fullstack | Org + repo + mono-repo restructure + branch protection |
| 2 | fullstack | CI workflows + Vercel project wiring |
| 3 | backend | Supabase project + core schema migrations + seed |
| 4 | backend | RLS helpers + policies + storage policies + bootstrap RPC |
| 5 | fullstack | Auth wiring (login/signup/org create) replacing fake login |
| 6 | frontend | Supabase client + providers + contacts on live data, E2E verified |

**Sprint 1:** conversations schema + Gmail OAuth + inbox UI.
**Sprint 2:** campaigns + SMS adapter scaffold.
**Sprint 3:** migrate remaining entities to live data (deals, products, tasks, invoices, payment plans, social posts, integration settings, reports as Postgres views).

## Out of scope (this design)

- Choosing/wiring an actual SMS gateway.
- Bulk email provider beyond Gmail.
- Google OAuth as a login method (only Gmail-connect for email accounts in Sprint 1).
- Migrating any real client data (seed/demo data only).
