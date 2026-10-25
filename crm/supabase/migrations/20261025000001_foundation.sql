-- =============================================================================
-- Phase 1 — Foundation: users and roles, companies, contacts.
--
-- How security works in this app (read this once):
--   * Every table has Row Level Security (RLS) switched on. With RLS on, the
--     database refuses every read and write unless a policy below allows it.
--   * Policies check the signed-in user's role (owner / sales / delivery),
--     which lives in public.profiles. A user without a role sees nothing.
--   * The browser only ever holds the public "publishable" key. That key can do
--     nothing on its own: all access goes through these policies.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- Helper functions live in a schema the web API does not expose.
create schema if not exists private;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Enums (fixed lists). To add a value later: alter type ... add value '...';
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('owner', 'sales', 'delivery');

create type public.company_source as enum (
  'network', 'linkedin', 'referral', 'instagram', 'event', 'freelance_platform', 'other'
);

create type public.emirate as enum (
  'dubai', 'abu_dhabi', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah', 'outside_uae'
);

create type public.company_status as enum ('lead', 'client', 'past_client', 'archived');

create type public.language_code as enum ('en', 'ar', 'fr');

-- Keeps updated_at current on every update.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profiles: one row per login, created automatically on sign-up / invite.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  -- null = invited but no access yet. The owner assigns a role.
  role public.app_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- The signed-in user's role, or null. "security definer" lets policies read
-- profiles without recursively hitting the profiles policies.
create function private.user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create function private.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.user_role() = any (roles), false);
$$;

grant execute on function private.user_role() to authenticated;
grant execute on function private.has_role(public.app_role[]) to authenticated;

-- New login -> new profile. The very first user becomes the owner; everyone
-- after that starts with no role until the owner gives them one.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Serialise sign-ups so two people can't both become "first".
  lock table public.profiles in share row exclusive mode;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when exists (select 1 from public.profiles where role = 'owner') then null
      else 'owner'::public.app_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;

-- Team members can see each other (needed to show "owner" / "assigned to").
create policy "profiles: team can read"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or private.user_role() is not null);

-- Anyone can edit their own row; the owner can edit any row.
create policy "profiles: edit own or owner"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or private.has_role('owner'))
  with check (id = (select auth.uid()) or private.has_role('owner'));

-- Only the full_name column is editable through the API, so nobody can
-- promote themselves by updating their own role. Role changes come in Phase 7
-- through an owner-only function.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Companies
-- -----------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  industry text,
  emirate public.emirate,
  city text,
  website text,
  instagram text, -- stored as the handle without "@"
  source public.company_source,
  status public.company_status not null default 'lead',
  tags text[] not null default '{}',
  notes text,
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  -- Lower-cased copy of the searchable fields, kept up to date by a trigger.
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_search_idx on public.companies using gin (search_text extensions.gin_trgm_ops);
create index companies_tags_idx on public.companies using gin (tags);
create index companies_status_idx on public.companies (status);
create index companies_owner_idx on public.companies (owner_id);
create index companies_created_by_idx on public.companies (created_by);

create function private.companies_search_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text = lower(concat_ws(' ',
    new.name, new.industry, new.city, new.website, new.instagram,
    array_to_string(new.tags, ' '), new.notes
  ));
  return new;
end;
$$;

create trigger companies_search_text
  before insert or update on public.companies
  for each row execute function private.companies_search_text();

create trigger companies_updated_at
  before update on public.companies
  for each row execute function private.set_updated_at();

alter table public.companies enable row level security;

create policy "companies: owner and sales can read"
  on public.companies for select to authenticated
  using (private.has_role('owner', 'sales'));

create policy "companies: owner and sales can add"
  on public.companies for insert to authenticated
  with check (private.has_role('owner', 'sales'));

create policy "companies: owner and sales can edit"
  on public.companies for update to authenticated
  using (private.has_role('owner', 'sales'))
  with check (private.has_role('owner', 'sales'));

create policy "companies: only owner can delete"
  on public.companies for delete to authenticated
  using (private.has_role('owner'));

revoke all on table public.companies from anon;
grant select, insert, update, delete on table public.companies to authenticated;

-- Every tag in use, for filter chips and suggestions. security_invoker makes
-- the view obey the companies policies above instead of bypassing them.
create view public.company_tags
with (security_invoker = true)
as
  select distinct unnest(tags) as tag from public.companies;

revoke all on public.company_tags from anon;
grant select on public.company_tags to authenticated;

-- -----------------------------------------------------------------------------
-- Contacts (always belong to a company)
-- -----------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) > 0),
  job_title text,
  phone text,     -- international format, e.g. +971501234567
  whatsapp text,  -- only if different from phone
  email text,
  preferred_language public.language_code not null default 'en',
  is_primary boolean not null default false,
  notes text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_company_idx on public.contacts (company_id);
create index contacts_created_by_idx on public.contacts (created_by);
create index contacts_search_idx on public.contacts using gin (search_text extensions.gin_trgm_ops);
-- At most one primary contact per company.
create unique index contacts_one_primary_per_company on public.contacts (company_id) where is_primary;

-- "+971501234567" -> "+971501234567 971501234567 0501234567", so a search for
-- the number in any common format finds the contact.
create function private.phone_variants(phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when phone is null then null
    when phone like '+971%' then concat_ws(' ', phone, substr(phone, 2), '0' || substr(phone, 5))
    else concat_ws(' ', phone, regexp_replace(phone, '\D', '', 'g'))
  end;
$$;

create function private.contacts_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text = lower(concat_ws(' ',
    new.full_name, new.job_title, new.email, new.notes,
    private.phone_variants(new.phone), private.phone_variants(new.whatsapp)
  ));

  -- A company's first contact becomes its primary contact automatically.
  if tg_op = 'INSERT' and not exists (
    select 1 from public.contacts where company_id = new.company_id
  ) then
    new.is_primary = true;
  end if;

  -- Marking a contact as primary un-marks the previous one.
  if new.is_primary then
    update public.contacts
       set is_primary = false
     where company_id = new.company_id
       and id <> new.id
       and is_primary;
  end if;

  return new;
end;
$$;

create trigger contacts_before_write
  before insert or update on public.contacts
  for each row execute function private.contacts_before_write();

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function private.set_updated_at();

alter table public.contacts enable row level security;

create policy "contacts: owner and sales can read"
  on public.contacts for select to authenticated
  using (private.has_role('owner', 'sales'));

create policy "contacts: owner and sales can add"
  on public.contacts for insert to authenticated
  with check (private.has_role('owner', 'sales'));

create policy "contacts: owner and sales can edit"
  on public.contacts for update to authenticated
  using (private.has_role('owner', 'sales'))
  with check (private.has_role('owner', 'sales'));

create policy "contacts: owner and sales can delete"
  on public.contacts for delete to authenticated
  using (private.has_role('owner', 'sales'));

revoke all on table public.contacts from anon;
grant select, insert, update, delete on table public.contacts to authenticated;

-- -----------------------------------------------------------------------------
-- Search. These run with the caller's permissions (security invoker), so the
-- policies above still decide what each person can see. The app can add
-- filters, sorting and paging on top, e.g. supabase.rpc('search_companies', { q })
-- -----------------------------------------------------------------------------

-- Escapes % and _ so they are matched literally.
create function private.like_pattern(q text)
returns text
language sql
immutable
set search_path = ''
as $$
  select '%' || replace(replace(replace(lower(btrim(q)), '\', '\\'), '%', '\%'), '_', '\_') || '%';
$$;
grant execute on function private.like_pattern(text) to authenticated;

-- Companies whose own fields, or any of whose contacts, match the text.
create function public.search_companies(q text default null)
returns setof public.companies
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
    from public.companies c
   where coalesce(btrim(q), '') = ''
      or c.search_text like private.like_pattern(q)
      or exists (
           select 1 from public.contacts ct
            where ct.company_id = c.id
              and ct.search_text like private.like_pattern(q)
         );
$$;

-- Contacts whose own fields, or whose company name, match the text.
create function public.search_contacts(q text default null)
returns setof public.contacts
language sql
stable
security invoker
set search_path = ''
as $$
  select ct.*
    from public.contacts ct
    join public.companies c on c.id = ct.company_id
   where coalesce(btrim(q), '') = ''
      or ct.search_text like private.like_pattern(q)
      or lower(c.name) like private.like_pattern(q);
$$;

revoke all on function public.search_companies(text) from public, anon;
revoke all on function public.search_contacts(text) from public, anon;
grant execute on function public.search_companies(text) to authenticated;
grant execute on function public.search_contacts(text) to authenticated;
