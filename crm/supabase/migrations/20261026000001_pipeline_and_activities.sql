-- =============================================================================
-- Phase 2 — Pipeline and conversation history.
--   services            what you sell (catalogue)
--   deals               opportunities, one company each, moving through stages
--   deal_services       which services a deal includes
--   deal_stage_history  every stage change, for conversion stats (Phase 6)
--   activities          the conversation timeline (WhatsApp, calls, meetings...)
--   attachments         files on a company / deal / activity (stored in Storage)
--
-- Money is stored in fils (1 AED = 100 fils) as whole numbers, never decimals.
-- =============================================================================

create type public.deal_stage as enum (
  'lead', 'contacted', 'discovery', 'proposal', 'negotiation', 'won', 'lost'
);

create type public.lost_reason as enum (
  'price', 'budget', 'timing', 'competitor', 'no_response', 'not_a_fit', 'other'
);

create type public.billing_type as enum ('one_off', 'monthly');

create type public.activity_channel as enum (
  'whatsapp', 'call', 'meeting', 'email', 'linkedin', 'instagram', 'other'
);

-- Default win probability for each stage (%). Keep in sync with
-- STAGE_PROBABILITY in src/lib/pipeline.ts (a test checks they match).
create function public.default_stage_probability(stage public.deal_stage)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select case stage
    when 'lead' then 10
    when 'contacted' then 20
    when 'discovery' then 40
    when 'proposal' then 60
    when 'negotiation' then 80
    when 'won' then 100
    when 'lost' then 0
  end::smallint;
$$;

-- -----------------------------------------------------------------------------
-- Companies: remember when we last talked to them.
-- -----------------------------------------------------------------------------
alter table public.companies add column last_activity_at timestamptz;

-- -----------------------------------------------------------------------------
-- Services catalogue
-- -----------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) > 0),
  billing public.billing_type not null default 'one_off',
  default_price_fils bigint check (default_price_fils >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_updated_at
  before update on public.services
  for each row execute function private.set_updated_at();

alter table public.services enable row level security;

create policy "services: owner and sales can read"
  on public.services for select to authenticated
  using (private.has_role('owner', 'sales'));

create policy "services: owner manages"
  on public.services for all to authenticated
  using (private.has_role('owner'))
  with check (private.has_role('owner'));

revoke all on table public.services from anon;
grant select, insert, update, delete on table public.services to authenticated;

-- A starting list; edit it in Settings → Services.
insert into public.services (name, billing, sort_order) values
  ('Meta ads management', 'monthly', 10),
  ('Google ads management', 'monthly', 20),
  ('TikTok ads management', 'monthly', 30),
  ('Social media management', 'monthly', 40),
  ('SEO', 'monthly', 50),
  ('Content creation', 'one_off', 60),
  ('Website design', 'one_off', 70),
  ('Branding', 'one_off', 80),
  ('Marketing strategy', 'one_off', 90);

-- -----------------------------------------------------------------------------
-- Deals
-- -----------------------------------------------------------------------------
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  primary_contact_id uuid references public.contacts (id) on delete set null,
  title text not null check (length(btrim(title)) > 0),
  -- One-off: the full price. Monthly: the price per month.
  value_fils bigint not null default 0 check (value_fils >= 0),
  billing public.billing_type not null default 'one_off',
  -- Monthly deals: expected length of the retainer, used for pipeline value.
  term_months smallint not null default 1 check (term_months between 1 and 120),
  stage public.deal_stage not null default 'lead',
  probability smallint check (probability between 0 and 100),
  expected_close_date date,
  next_follow_up_date date,
  lost_reason public.lost_reason,
  lost_note text,
  notes text,
  won_at timestamptz,
  lost_at timestamptz,
  last_activity_at timestamptz,
  -- Order of cards inside a kanban column (lower = higher up).
  position double precision not null default 0,
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deals_lost_needs_reason check (stage <> 'lost' or lost_reason is not null)
);

create index deals_company_idx on public.deals (company_id);
create index deals_contact_idx on public.deals (primary_contact_id);
create index deals_stage_position_idx on public.deals (stage, position);
create index deals_follow_up_idx on public.deals (next_follow_up_date) where stage not in ('won', 'lost');
create index deals_owner_idx on public.deals (owner_id);
create index deals_created_by_idx on public.deals (created_by);
create index deals_search_idx on public.deals using gin (search_text extensions.gin_trgm_ops);

create function private.deals_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text = lower(concat_ws(' ', new.title, new.notes, new.lost_note));

  -- Probability follows the stage unless someone sets it explicitly.
  if tg_op = 'INSERT' then
    new.probability = coalesce(new.probability, public.default_stage_probability(new.stage));
  elsif new.stage is distinct from old.stage and new.probability is not distinct from old.probability then
    new.probability = public.default_stage_probability(new.stage);
  end if;

  -- Won / lost timestamps, and lost details only on lost deals.
  if new.stage = 'won' and (tg_op = 'INSERT' or old.stage <> 'won') then
    new.won_at = now();
  elsif new.stage <> 'won' then
    new.won_at = null;
  end if;

  if new.stage = 'lost' and (tg_op = 'INSERT' or old.stage <> 'lost') then
    new.lost_at = now();
  elsif new.stage <> 'lost' then
    new.lost_at = null;
    new.lost_reason = null;
    new.lost_note = null;
  end if;

  -- The primary contact must work at the deal's company.
  if new.primary_contact_id is not null and not exists (
    select 1 from public.contacts
     where id = new.primary_contact_id and company_id = new.company_id
  ) then
    raise exception 'Contact does not belong to this company' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger deals_before_write
  before insert or update on public.deals
  for each row execute function private.deals_before_write();

create trigger deals_updated_at
  before update on public.deals
  for each row execute function private.set_updated_at();

alter table public.deals enable row level security;

create policy "deals: owner and sales can read"
  on public.deals for select to authenticated
  using (private.has_role('owner', 'sales'));

create policy "deals: owner and sales can add"
  on public.deals for insert to authenticated
  with check (private.has_role('owner', 'sales'));

create policy "deals: owner and sales can edit"
  on public.deals for update to authenticated
  using (private.has_role('owner', 'sales'))
  with check (private.has_role('owner', 'sales'));

create policy "deals: only owner can delete"
  on public.deals for delete to authenticated
  using (private.has_role('owner'));

revoke all on table public.deals from anon;
grant select, insert, update, delete on table public.deals to authenticated;

-- -----------------------------------------------------------------------------
-- Which services a deal includes
-- -----------------------------------------------------------------------------
create table public.deal_services (
  deal_id uuid not null references public.deals (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  primary key (deal_id, service_id)
);

create index deal_services_service_idx on public.deal_services (service_id);

alter table public.deal_services enable row level security;

create policy "deal_services: owner and sales"
  on public.deal_services for all to authenticated
  using (private.has_role('owner', 'sales'))
  with check (private.has_role('owner', 'sales'));

revoke all on table public.deal_services from anon;
grant select, insert, delete on table public.deal_services to authenticated;

-- -----------------------------------------------------------------------------
-- Stage history (written only by the trigger below, never by the app)
-- -----------------------------------------------------------------------------
create table public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  from_stage public.deal_stage,          -- null when the deal was created
  to_stage public.deal_stage not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles (id) on delete set null
);

create index deal_stage_history_deal_idx on public.deal_stage_history (deal_id, changed_at);
create index deal_stage_history_changed_by_idx on public.deal_stage_history (changed_by);

create function private.deals_record_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    insert into public.deal_stage_history (deal_id, from_stage, to_stage, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.stage end, new.stage, (select auth.uid()));
  end if;
  return null;
end;
$$;

create trigger deals_record_stage
  after insert or update of stage on public.deals
  for each row execute function private.deals_record_stage();

-- Winning a deal makes the company a client.
create function private.deals_mark_client_on_win()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stage = 'won' and (tg_op = 'INSERT' or old.stage <> 'won') then
    update public.companies
       set status = 'client'
     where id = new.company_id
       and status in ('lead', 'past_client');
  end if;
  return null;
end;
$$;

create trigger deals_mark_client_on_win
  after insert or update of stage on public.deals
  for each row execute function private.deals_mark_client_on_win();

alter table public.deal_stage_history enable row level security;

create policy "deal_stage_history: owner and sales can read"
  on public.deal_stage_history for select to authenticated
  using (private.has_role('owner', 'sales'));

revoke all on table public.deal_stage_history from anon, authenticated;
grant select on table public.deal_stage_history to authenticated;

-- -----------------------------------------------------------------------------
-- Activities: the conversation history
-- -----------------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  occurred_at timestamptz not null default now(),
  channel public.activity_channel not null,
  summary text not null check (length(btrim(summary)) > 0),
  outcome text,
  next_step text,
  next_step_date date,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_company_idx on public.activities (company_id, occurred_at desc);
create index activities_deal_idx on public.activities (deal_id, occurred_at desc);
create index activities_contact_idx on public.activities (contact_id);
create index activities_created_by_idx on public.activities (created_by);
create index activities_next_step_idx on public.activities (next_step_date) where next_step_date is not null;
create index activities_search_idx on public.activities using gin (search_text extensions.gin_trgm_ops);

create function private.activities_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text = lower(concat_ws(' ', new.summary, new.outcome, new.next_step));

  -- An activity on a deal always belongs to that deal's company.
  if new.deal_id is not null then
    select company_id into new.company_id from public.deals where id = new.deal_id;
  end if;

  if new.contact_id is not null and not exists (
    select 1 from public.contacts where id = new.contact_id and company_id = new.company_id
  ) then
    raise exception 'Contact does not belong to this company' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger activities_before_write
  before insert or update on public.activities
  for each row execute function private.activities_before_write();

create trigger activities_updated_at
  before update on public.activities
  for each row execute function private.set_updated_at();

-- After logging: update "last contacted" dates, and move the deal's next
-- follow-up to the activity's next-step date.
create function private.activities_after_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.companies
     set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at)
   where id = new.company_id;

  if new.deal_id is not null then
    update public.deals
       set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at),
           next_follow_up_date = coalesce(new.next_step_date, next_follow_up_date)
     where id = new.deal_id;
  end if;

  return null;
end;
$$;

create trigger activities_after_write
  after insert or update on public.activities
  for each row execute function private.activities_after_write();

alter table public.activities enable row level security;

create policy "activities: owner and sales can read"
  on public.activities for select to authenticated
  using (private.has_role('owner', 'sales'));

create policy "activities: owner and sales can add"
  on public.activities for insert to authenticated
  with check (private.has_role('owner', 'sales'));

create policy "activities: owner and sales can edit"
  on public.activities for update to authenticated
  using (private.has_role('owner', 'sales'))
  with check (private.has_role('owner', 'sales'));

-- Sales can delete what they logged; the owner can delete anything.
create policy "activities: owner or author can delete"
  on public.activities for delete to authenticated
  using (
    private.has_role('owner')
    or (private.has_role('sales') and created_by = (select auth.uid()))
  );

revoke all on table public.activities from anon;
grant select, insert, update, delete on table public.activities to authenticated;

-- -----------------------------------------------------------------------------
-- Attachments: the file itself is in Storage bucket "attachments" at
-- <company_id>/<random id>/<file name>; this table describes it.
-- -----------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete set null,
  activity_id uuid references public.activities (id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Files must live in their company's folder.
  constraint attachments_path_in_company_folder check (storage_path like company_id::text || '/%')
);

create index attachments_company_idx on public.attachments (company_id, created_at desc);
create index attachments_deal_idx on public.attachments (deal_id);
create index attachments_activity_idx on public.attachments (activity_id);
create index attachments_created_by_idx on public.attachments (created_by);

alter table public.attachments enable row level security;

create policy "attachments: owner and sales can read"
  on public.attachments for select to authenticated
  using (private.has_role('owner', 'sales'));

create policy "attachments: owner and sales can add"
  on public.attachments for insert to authenticated
  with check (private.has_role('owner', 'sales'));

create policy "attachments: owner or uploader can delete"
  on public.attachments for delete to authenticated
  using (
    private.has_role('owner')
    or (private.has_role('sales') and created_by = (select auth.uid()))
  );

revoke all on table public.attachments from anon;
grant select, insert, delete on table public.attachments to authenticated;

-- The private Storage bucket (10 MB per file) and who may use it.
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 10485760)
on conflict (id) do nothing;

create policy "attachments bucket: owner and sales can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and private.has_role('owner', 'sales'));

create policy "attachments bucket: owner and sales can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and private.has_role('owner', 'sales'));

create policy "attachments bucket: owner and sales can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and private.has_role('owner', 'sales'));

-- -----------------------------------------------------------------------------
-- Search
-- -----------------------------------------------------------------------------

-- Deals whose title/notes, or whose company name, match the text.
create function public.search_deals(q text default null)
returns setof public.deals
language sql
stable
security invoker
set search_path = ''
as $$
  select d.*
    from public.deals d
    join public.companies c on c.id = d.company_id
   where coalesce(btrim(q), '') = ''
      or d.search_text like private.like_pattern(q)
      or lower(c.name) like private.like_pattern(q);
$$;

create function public.search_activities(q text default null)
returns setof public.activities
language sql
stable
security invoker
set search_path = ''
as $$
  select a.*
    from public.activities a
   where coalesce(btrim(q), '') = ''
      or a.search_text like private.like_pattern(q);
$$;

revoke all on function public.search_deals(text) from public, anon;
revoke all on function public.search_activities(text) from public, anon;
grant execute on function public.search_deals(text) to authenticated;
grant execute on function public.search_activities(text) to authenticated;
