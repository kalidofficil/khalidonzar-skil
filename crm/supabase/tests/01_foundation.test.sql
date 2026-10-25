-- Security tests for Phase 1: roles, companies, contacts.
-- Each block acts as a specific user and fails loudly if access is wrong.

-- Helper: act as a user for the rest of the current transaction.
create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
  execute 'set local role authenticated';
end $$;

create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if;
end $$;

-- Four logins. The first one becomes owner automatically.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'sales@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'delivery@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'pending@test.local');

select pg_temp.assert(
  (select role from public.profiles where email = 'owner@test.local') = 'owner',
  'first user becomes owner');
select pg_temp.assert(
  (select role from public.profiles where email = 'sales@test.local') is null,
  'later users start with no role');

-- Give the test users their roles (as the database admin).
update public.profiles set role = 'sales' where email = 'sales@test.local';
update public.profiles set role = 'delivery' where email = 'delivery@test.local';

-- Owner: full access ----------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.companies (id, name, industry, tags, website)
  values ('10000000-0000-0000-0000-000000000001', 'Palm Bakery', 'F&B', '{bakery,jumeirah}', 'palmbakery.ae');
insert into public.contacts (id, company_id, full_name, phone)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Sara', '+971501234567');
insert into public.contacts (id, company_id, full_name)
  values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Omar');
select pg_temp.assert(
  (select owner_id from public.companies where name = 'Palm Bakery') = '00000000-0000-0000-0000-00000000000a',
  'owner_id defaults to the signed-in user');
select pg_temp.assert(
  (select search_text from public.companies where name = 'Palm Bakery') like '%jumeirah%',
  'search_text includes tags');
select pg_temp.assert(
  (select is_primary from public.contacts where full_name = 'Sara'),
  'first contact becomes primary');
select pg_temp.assert(
  not (select is_primary from public.contacts where full_name = 'Omar'),
  'second contact is not primary');
update public.contacts set is_primary = true where full_name = 'Omar';
select pg_temp.assert(
  (select count(*) from public.contacts where is_primary) = 1
  and (select is_primary from public.contacts where full_name = 'Omar'),
  'marking a contact primary un-marks the previous one');
select pg_temp.assert((select count(*) from public.company_tags) = 2, 'owner sees tags');
commit;

-- Sales: read, add, edit; cannot delete companies -----------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.assert((select count(*) from public.companies) = 1, 'sales can read companies');
select pg_temp.assert((select count(*) from public.contacts) = 2, 'sales can read contacts');
insert into public.companies (name) values ('Sales Lead LLC');
update public.companies set city = 'Dubai Marina' where name = 'Palm Bakery';
delete from public.companies where name = 'Palm Bakery';  -- silently matches 0 rows under RLS
select pg_temp.assert(
  exists (select 1 from public.companies where name = 'Palm Bakery'),
  'sales cannot delete companies');
commit;

-- Delivery: no access to sales data -------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.assert((select count(*) from public.companies) = 0, 'delivery cannot read companies');
select pg_temp.assert((select count(*) from public.contacts) = 0, 'delivery cannot read contacts');
select pg_temp.assert((select count(*) from public.company_tags) = 0, 'tag view obeys company policies');
commit;

begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
do $$
begin
  insert into public.companies (name) values ('Should fail');
  raise exception 'FAILED: delivery was able to insert a company';
exception when insufficient_privilege then
  null; -- expected: RLS rejected the row
end $$;
commit;

-- No role yet: sees nothing, can't write ---------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select pg_temp.assert((select count(*) from public.companies) = 0, 'pending user cannot read companies');
do $$
begin
  insert into public.contacts (company_id, full_name)
    values ('10000000-0000-0000-0000-000000000001', 'Nope');
  raise exception 'FAILED: pending user was able to insert a contact';
exception when insufficient_privilege then
  null;
end $$;
commit;

-- Nobody can promote themselves ------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
do $$
begin
  update public.profiles set role = 'owner' where email = 'sales@test.local';
  raise exception 'FAILED: sales user changed their own role';
exception when insufficient_privilege then
  null; -- expected: only full_name is updatable
end $$;
update public.profiles set full_name = 'Sales Person' where email = 'sales@test.local';
select pg_temp.assert(
  (select full_name from public.profiles where email = 'sales@test.local') = 'Sales Person',
  'users can edit their own name');
commit;

begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
update public.profiles set full_name = 'Hacked' where email = 'owner@test.local';
select pg_temp.assert(
  (select full_name from public.profiles where email = 'owner@test.local') = '',
  'users cannot edit someone else''s name');
commit;

-- Logged-out visitors (anon) get nothing ---------------------------------------
begin;
set local role anon;
do $$
begin
  perform 1 from public.companies;
  raise exception 'FAILED: anon could query companies';
exception when insufficient_privilege then
  null;
end $$;
commit;

-- Owner can delete; contacts go with the company --------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
delete from public.companies where name = 'Palm Bakery';
select pg_temp.assert((select count(*) from public.contacts) = 0, 'deleting a company deletes its contacts');
commit;
