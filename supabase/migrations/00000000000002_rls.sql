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

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  orgs, org_members, profiles,
  companies, contacts, deals, products, tasks,
  invoices, invoice_items, payment_plans, social_posts, integration_settings
  to authenticated;
-- anon gets no table privileges at all: every business table is
-- protected by both grant and RLS, so an anon select fails with
-- 42501 (insufficient_privilege) before RLS is even evaluated.

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table profiles enable row level security;

create policy "members read own orgs" on orgs for select using (id in (select private.user_org_ids()));
create policy "admins update org" on orgs for update using (private.user_role(id) in ('owner','admin'));
create policy "members read membership" on org_members for select using (org_id in (select private.user_org_ids()));
create policy "admins manage membership" on org_members for all
  using (
    private.user_role(org_id) = 'owner'
    or (role <> 'owner' and private.user_role(org_id) = 'admin')
  )
  with check (
    private.user_role(org_id) = 'owner'
    or (role <> 'owner' and private.user_role(org_id) = 'admin')
  );
create policy "own profile read" on profiles for select using (
  user_id = auth.uid()
  or user_id in (select om.user_id from org_members om where om.org_id in (select private.user_org_ids()))
);
create policy "own profile write" on profiles for update using (user_id = auth.uid());

do $$ declare t text;
begin
  foreach t in array array['companies','contacts','deals','products','tasks','invoices','invoice_items','payment_plans','social_posts','integration_settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format($p$create policy "org read" on %I for select using (org_id in (select private.user_org_ids()))$p$, t);
    execute format($p$create policy "org insert" on %I for insert with check (org_id in (select private.user_org_ids()) and private.user_role(org_id) in ('owner','admin','member'))$p$, t);
    execute format($p$create policy "org update" on %I for update using (org_id in (select private.user_org_ids()) and private.user_role(org_id) in ('owner','admin','member')) with check (org_id in (select private.user_org_ids()) and private.user_role(org_id) in ('owner','admin','member'))$p$, t);
    execute format($p$create policy "org delete" on %I for delete using (private.user_role(org_id) in ('owner','admin'))$p$, t);
  end loop;
end $$;

-- Tenant boundary: org_id must never change on an existing row, even
-- when the caller is a member of both the source and destination org
-- (in which case the "org update" RLS with-check above would allow
-- it, since it only checks that org_id lands in one of the caller's
-- orgs). This trigger closes that gap unconditionally.
create function private.prevent_org_change() returns trigger
language plpgsql as $$
begin
  if new.org_id is distinct from old.org_id then
    raise exception 'org_id is immutable';
  end if;
  return new;
end $$;

do $$ declare t text;
begin
  foreach t in array array['companies','contacts','deals','products','tasks','invoices','invoice_items','payment_plans','social_posts','integration_settings'] loop
    execute format('create trigger prevent_org_change before update on %I for each row execute function private.prevent_org_change()', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public) values ('product-images','product-images', true)
  on conflict do nothing;
create policy "org upload product images" on storage.objects for insert
  with check (bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid in (select private.user_org_ids()));
create policy "public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "org update product images" on storage.objects for update
  using (bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid in (select private.user_org_ids()))
  with check (bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid in (select private.user_org_ids()));
create policy "org delete product images" on storage.objects for delete
  using (bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid in (select private.user_org_ids())
    and private.user_role((storage.foldername(name))[1]::uuid) in ('owner','admin','member'));
