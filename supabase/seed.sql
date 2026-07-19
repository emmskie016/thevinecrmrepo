-- Demo seed data ported from apps/web/src/lib/store.js defaultState
-- Single demo org; fixed UUIDs so later tests can reference them.
-- users/auth.users intentionally omitted (auth-managed); tasks.assignee left null.

insert into orgs (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Vine Demo', 'vine-demo');

-- companies
insert into companies (id, org_id, name, industry, website, owner, created_at) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Northstar Labs', 'SaaS', 'northstarlabs.com', 'Mina', '2026-05-02'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Atlas Commerce', 'Retail', 'atlascommerce.com', 'Ava', '2026-05-18'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Harbor Health', 'Healthcare', 'harborhealth.io', 'Noah', '2026-06-03');

-- contacts
insert into contacts (id, org_id, company_id, name, email, phone, title, created_at) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Mina Khan', 'mina@northstarlabs.com', '+1 555 990', 'Head of Growth', '2026-06-10'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Jonathan Brooks', 'jon@atlascommerce.com', '+1 555 014', 'Operations Lead', '2026-06-14'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'Priya Nair', 'priya@harborhealth.io', '+1 555 221', 'IT Director', '2026-06-20');

-- deals (stage mapping: New->lead, Qualified->qualified, Proposal->proposal, Negotiation->negotiation, Won->won, Lost->lost)
-- (channel mapping: Direct->direct, Online store->website, Marketplace->shopee, Retail->direct, Wholesale->direct)
insert into deals (id, org_id, contact_id, company_id, name, stage, amount, channel, position, created_at) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Expansion package', 'proposal', 18000, 'direct', 0, '2026-07-18'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'Renewal discussion', 'qualified', 9500, 'website', 1, '2026-07-24'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', 'Patient portal rollout', 'negotiation', 32000, 'direct', 2, '2026-08-12'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Support add-on', 'won', 6200, 'website', 3, '2026-06-28'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'Analytics pilot', 'lead', 12400, 'shopee', 4, '2026-09-02'),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'Holiday bundle restock', 'proposal', 21000, 'direct', 5, '2026-08-30');

-- products
insert into products (id, org_id, name, sku, type, status, price, stock, image_url, created_at) values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001', 'Growth Plan (Annual)', 'SVC-GROW-01', 'Service', 'Active', 18000, 0, null, '2026-05-01'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000001', 'Analytics Suite', 'SVC-ANLYT-02', 'Service', 'Active', 12400, 0, null, '2026-05-04'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000001', 'Priority Support Add-on', 'SVC-SUPP-03', 'Service', 'Active', 6200, 0, null, '2026-05-10'),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000001', 'Starter Hardware Kit', 'PRD-HW-04', 'Product', 'Active', 950, 42, null, '2026-05-15'),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000001', 'Holiday Gift Bundle', 'PRD-BND-05', 'Product', 'Active', 210, 8, null, '2026-06-01'),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000001', 'Legacy Onboarding Pack', 'SVC-ONB-06', 'Service', 'Archived', 1500, 0, null, '2026-04-02');

-- tasks (assignee left null; auth.users empty at seed time)
insert into tasks (id, org_id, title, due_date, status, created_at) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000001', 'Send proposal follow-up', '2026-07-06', 'Open', now()),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000001', 'Confirm renewal meeting', '2026-07-12', 'Open', now()),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000001', 'Draft rollout timeline', '2026-07-15', 'Open', now()),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000001', 'Share pilot pricing', '2026-07-03', 'Done', now());

-- payment plans
insert into payment_plans (id, org_id, name, price, interval, description, active) values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000001', 'Starter', 29, 'month', 'For solo operators getting started.', true),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000001', 'Growth', 79, 'month', 'For growing teams that need automation.', true),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000001', 'Enterprise', 249, 'month', 'For established businesses at scale.', true);

-- social posts (channel/status kept as store text values; one row per channel since social_posts.channel is a single text field)
insert into social_posts (id, org_id, content, channel, status, scheduled_at) values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000001', 'New Analytics Suite is live — turn raw store data into decisions. Book a demo this week.', 'LinkedIn', 'Scheduled', '2026-07-10'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000001', 'New Analytics Suite is live — turn raw store data into decisions. Book a demo this week.', 'X', 'Scheduled', '2026-07-10'),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000001', 'Holiday Gift Bundles are back and selling fast — only a few left in stock! 🎁', 'Instagram', 'Published', '2026-07-06'),
  ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000001', 'Holiday Gift Bundles are back and selling fast — only a few left in stock! 🎁', 'Facebook', 'Published', '2026-07-06'),
  ('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000001', 'Holiday Gift Bundles are back and selling fast — only a few left in stock! 🎁', 'TikTok', 'Published', '2026-07-06'),
  ('00000000-0000-0000-0000-000000000706', '00000000-0000-0000-0000-000000000001', 'Behind the scenes: how our team ships customer support that actually helps.', 'LinkedIn', 'Draft', null);
