begin;
create extension if not exists pgtap;

select plan(22);

-- ============================================================
-- Setup (runs as postgres / superuser, bypasses RLS)
-- ============================================================

-- second org (org B) + a contact in it, to prove cross-org isolation
insert into orgs (id, name, slug) values
  ('00000000-0000-0000-0000-000000000002', 'Org B', 'org-b');
insert into contacts (id, org_id, name, email) values
  ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000002', 'Org B Contact', 'orgb@example.com');

-- helper: create a minimal auth.users row
create or replace function tests_create_user(p_id uuid, p_email text) returns void
language sql as $$
  insert into auth.users
    (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '', now(), now(), now(), '{}', '{}')
  on conflict (id) do nothing;
$$;

select tests_create_user('10000000-0000-0000-0000-000000000001', 'member-a@example.com');
select tests_create_user('10000000-0000-0000-0000-000000000002', 'viewer-a@example.com');
select tests_create_user('10000000-0000-0000-0000-000000000003', 'admin-a@example.com');
select tests_create_user('10000000-0000-0000-0000-000000000004', 'member-b@example.com');
select tests_create_user('10000000-0000-0000-0000-000000000005', 'newowner@example.com');

insert into org_members (org_id, user_id, role) values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'member'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'viewer'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'admin'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'member');

-- ============================================================
-- Anonymous sees 0 rows in every business table
-- ============================================================
set local role anon;
set local request.jwt.claims to '';

select is((select count(*) from companies)::int, 0, 'anon sees 0 companies');
select is((select count(*) from contacts)::int, 0, 'anon sees 0 contacts');
select is((select count(*) from deals)::int, 0, 'anon sees 0 deals');
select is((select count(*) from products)::int, 0, 'anon sees 0 products');
select is((select count(*) from tasks)::int, 0, 'anon sees 0 tasks');
select is((select count(*) from invoices)::int, 0, 'anon sees 0 invoices');
select is((select count(*) from invoice_items)::int, 0, 'anon sees 0 invoice_items');
select is((select count(*) from payment_plans)::int, 0, 'anon sees 0 payment_plans');
select is((select count(*) from social_posts)::int, 0, 'anon sees 0 social_posts');
select is((select count(*) from integration_settings)::int, 0, 'anon sees 0 integration_settings');

reset role;
reset request.jwt.claims;

-- ============================================================
-- Member of org A sees org A contacts but 0 of org B
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*) from contacts)::int, 3, 'org A member sees only org A contacts (seed = 3)');
select is((select count(*) from contacts where org_id = '00000000-0000-0000-0000-000000000002')::int, 0, 'org A member sees 0 org B contacts');

reset role;
reset request.jwt.claims;

-- ============================================================
-- Viewer insert into contacts fails
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$ insert into contacts (org_id, name) values ('00000000-0000-0000-0000-000000000001', 'Viewer Insert Attempt') $$,
  '42501',
  null,
  'viewer insert into contacts fails'
);

reset role;
reset request.jwt.claims;

-- ============================================================
-- Member delete fails (row remains)
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

delete from contacts where id = '00000000-0000-0000-0000-000000000201';

reset role;
reset request.jwt.claims;

select is((select count(*) from contacts where id = '00000000-0000-0000-0000-000000000201')::int, 1, 'member delete does not remove contact (RLS blocks it)');

-- ============================================================
-- Admin delete succeeds
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}';

delete from contacts where id = '00000000-0000-0000-0000-000000000201';

reset role;
reset request.jwt.claims;

select is((select count(*) from contacts where id = '00000000-0000-0000-0000-000000000201')::int, 0, 'admin delete removes contact');

-- ============================================================
-- create_org_with_owner creates org + owner membership
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated"}';

select isnt(
  (select public.create_org_with_owner('New Org', 'new-org')),
  null,
  'create_org_with_owner returns a new org id'
);

reset role;
reset request.jwt.claims;

select is(
  (select role::text from org_members
     where org_id = (select id from orgs where slug = 'new-org')
       and user_id = '10000000-0000-0000-0000-000000000005'),
  'owner',
  'create_org_with_owner creates an owner membership for the calling user'
);

-- ============================================================
-- Anon sees 0 profiles
-- ============================================================
set local role anon;
set local request.jwt.claims to '';

select is((select count(*) from profiles)::int, 0, 'anon sees 0 profiles');

reset role;
reset request.jwt.claims;

-- ============================================================
-- Org A member can see fellow org A member's profile but not
-- an unrelated org B member's profile
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from profiles where user_id = '10000000-0000-0000-0000-000000000003')::int,
  1,
  'org A member can see fellow org A member profile'
);
select is(
  (select count(*) from profiles where user_id = '10000000-0000-0000-0000-000000000004')::int,
  0,
  'org A member cannot see org B member profile'
);

reset role;
reset request.jwt.claims;

-- ============================================================
-- Admin cannot self-promote to owner via org_members update
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}';

do $inner$
begin
  update org_members set role = 'owner'
    where org_id = '00000000-0000-0000-0000-000000000001'
      and user_id = '10000000-0000-0000-0000-000000000003';
exception when insufficient_privilege then
  null;
end $inner$;

reset role;
reset request.jwt.claims;

select is(
  (select role::text from org_members
     where org_id = '00000000-0000-0000-0000-000000000001'
       and user_id = '10000000-0000-0000-0000-000000000003'),
  'admin',
  'admin self-promotion to owner is blocked'
);

-- ============================================================
-- Org A member cannot reassign a contact's org_id to org B
-- ============================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

do $inner$
begin
  update contacts set org_id = '00000000-0000-0000-0000-000000000002'
    where id = '00000000-0000-0000-0000-000000000202';
exception when insufficient_privilege then
  null;
end $inner$;

reset role;
reset request.jwt.claims;

select is(
  (select org_id from contacts where id = '00000000-0000-0000-0000-000000000202'),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'org A member cannot reassign a contact into org B (row unchanged)'
);

select * from finish();
rollback;
