-- Search tests: matching rules and that search obeys the security policies.

create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
  execute 'set local role authenticated';
end $$;

create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if;
end $$;

begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.companies (id, name, industry) values
  ('10000000-0000-0000-0000-0000000000a1', 'Desert Rose Spa', 'Beauty'),
  ('10000000-0000-0000-0000-0000000000a2', '100% Organic Co', 'Retail');
insert into public.contacts (company_id, full_name, phone, email) values
  ('10000000-0000-0000-0000-0000000000a1', 'Layla Haddad', '+971551112233', 'layla@rose.ae');

select pg_temp.assert((select count(*) from public.search_companies(null)) >= 2, 'empty search returns everything');
select pg_temp.assert((select count(*) from public.search_companies('desert')) = 1, 'matches company name, any case');
select pg_temp.assert((select count(*) from public.search_companies('layla')) = 1, 'company found by its contact''s name');
select pg_temp.assert((select count(*) from public.search_companies('0551112233')) = 1, 'local UAE phone format matches');
select pg_temp.assert((select count(*) from public.search_companies('971551112233')) = 1, 'phone without + matches');
select pg_temp.assert((select count(*) from public.search_companies('100%')) = 1, '% is matched literally');
select pg_temp.assert((select count(*) from public.search_companies('1_0')) = 0, '_ is matched literally');
select pg_temp.assert((select count(*) from public.search_contacts('rose spa')) = 1, 'contact found by company name');
select pg_temp.assert((select count(*) from public.search_contacts('rose.ae')) = 1, 'contact found by email');
commit;

begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.assert((select count(*) from public.search_companies('desert')) = 0, 'delivery search returns nothing');
select pg_temp.assert((select count(*) from public.search_contacts(null)) = 0, 'delivery contact search returns nothing');
commit;

begin;
set local role anon;
do $$
begin
  perform public.search_companies('desert');
  raise exception 'FAILED: anon could call search_companies';
exception when insufficient_privilege then
  null;
end $$;
commit;
