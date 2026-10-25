-- Phase 2 tests: deals, stage history, activities, attachments.

create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
  execute 'set local role authenticated';
end $$;

create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if;
end $$;

-- Owner: deals and their automatic behaviour --------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.companies (id, name, status) values
  ('30000000-0000-0000-0000-000000000001', 'Falcon Realty', 'lead'),
  ('30000000-0000-0000-0000-000000000002', 'Other Co', 'lead');
insert into public.contacts (id, company_id, full_name) values
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Hamad'),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Someone Else');
insert into public.deals (id, company_id, title, value_fils)
  values ('32000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Meta ads Q1', 1500000);

select pg_temp.assert((select probability from public.deals where title = 'Meta ads Q1') = 10, 'new lead gets 10%');
select pg_temp.assert((select count(*) from public.deal_stage_history) = 1, 'creation is recorded in history');

update public.deals set stage = 'proposal' where title = 'Meta ads Q1';
select pg_temp.assert((select probability from public.deals where title = 'Meta ads Q1') = 60, 'stage change resets probability');
select pg_temp.assert(
  (select count(*) from public.deal_stage_history where from_stage = 'lead' and to_stage = 'proposal') = 1,
  'stage change is recorded');

update public.deals set probability = 70 where title = 'Meta ads Q1';
update public.deals set notes = 'call back' where title = 'Meta ads Q1';
select pg_temp.assert((select probability from public.deals where title = 'Meta ads Q1') = 70, 'manual probability is kept');
select pg_temp.assert((select count(*) from public.deal_stage_history) = 2, 'non-stage edits are not recorded');

update public.deals set stage = 'lost', lost_reason = 'price', lost_note = 'too expensive' where title = 'Meta ads Q1';
select pg_temp.assert((select lost_at is not null and probability = 0 from public.deals where title = 'Meta ads Q1'), 'lost sets lost_at and 0%');
update public.deals set stage = 'negotiation' where title = 'Meta ads Q1';
select pg_temp.assert(
  (select lost_at is null and lost_reason is null and lost_note is null from public.deals where title = 'Meta ads Q1'),
  're-opening a lost deal clears lost details');

update public.deals set stage = 'won' where title = 'Meta ads Q1';
select pg_temp.assert((select won_at is not null from public.deals where title = 'Meta ads Q1'), 'won sets won_at');
select pg_temp.assert(
  (select status from public.companies where name = 'Falcon Realty') = 'client',
  'winning a deal makes the company a client');
commit;

begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
do $$
begin
  update public.deals set stage = 'lost' where title = 'Meta ads Q1';
  raise exception 'FAILED: deal was marked lost without a reason';
exception when check_violation then null;
end $$;
do $$
begin
  update public.deals set primary_contact_id = '31000000-0000-0000-0000-000000000002' where title = 'Meta ads Q1';
  raise exception 'FAILED: contact from another company was accepted';
exception when check_violation then null;
end $$;
do $$
begin
  insert into public.deal_stage_history (deal_id, to_stage)
    values ('32000000-0000-0000-0000-000000000001', 'won');
  raise exception 'FAILED: history was written directly';
exception when insufficient_privilege then null;
end $$;
commit;

-- Activities ------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
-- Deliberately give the wrong company: the deal's company wins.
insert into public.activities (id, company_id, deal_id, channel, summary, next_step, next_step_date, occurred_at)
  values ('33000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
          '32000000-0000-0000-0000-000000000001', 'whatsapp', 'Sent the proposal', 'Follow up', '2026-11-02',
          '2026-10-25 10:00+04');
select pg_temp.assert(
  (select company_id from public.activities where summary = 'Sent the proposal') = '30000000-0000-0000-0000-000000000001',
  'activity takes its deal''s company');
select pg_temp.assert(
  (select next_follow_up_date from public.deals where title = 'Meta ads Q1') = '2026-11-02',
  'next-step date becomes the deal''s follow-up');
select pg_temp.assert(
  (select last_activity_at from public.companies where name = 'Falcon Realty') = '2026-10-25 10:00+04',
  'company last_activity_at is updated');
-- An older activity doesn't move "last contacted" backwards.
insert into public.activities (company_id, channel, summary, occurred_at)
  values ('30000000-0000-0000-0000-000000000001', 'call', 'Old call', '2026-10-01 09:00+04');
select pg_temp.assert(
  (select last_activity_at from public.companies where name = 'Falcon Realty') = '2026-10-25 10:00+04',
  'older activity keeps the latest last_activity_at');
select pg_temp.assert((select count(*) from public.search_activities('proposal')) = 1, 'activity search');
select pg_temp.assert((select count(*) from public.search_deals('falcon')) = 1, 'deal search by company name');
commit;

begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
do $$
begin
  insert into public.activities (company_id, contact_id, channel, summary)
    values ('30000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000002', 'call', 'x');
  raise exception 'FAILED: activity with a contact from another company was accepted';
exception when check_violation then null;
end $$;
commit;

-- Sales ------------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.assert((select count(*) from public.deals where title = 'Meta ads Q1') = 1, 'sales can read deals');
select pg_temp.assert((select count(*) from public.services) > 0, 'sales can read services');
insert into public.activities (company_id, channel, summary)
  values ('30000000-0000-0000-0000-000000000001', 'meeting', 'Sales meeting');
delete from public.activities where summary = 'Sent the proposal';  -- owner's: not allowed
delete from public.activities where summary = 'Sales meeting';      -- own: allowed
select pg_temp.assert(
  exists (select 1 from public.activities where summary = 'Sent the proposal'),
  'sales cannot delete the owner''s activity');
select pg_temp.assert(
  not exists (select 1 from public.activities where summary = 'Sales meeting'),
  'sales can delete their own activity');
delete from public.deals where title = 'Meta ads Q1';
select pg_temp.assert(exists (select 1 from public.deals where title = 'Meta ads Q1'), 'sales cannot delete deals');
update public.services set name = 'Hacked' where name = 'SEO';
select pg_temp.assert(not exists (select 1 from public.services where name = 'Hacked'), 'sales cannot edit services');
commit;

-- Delivery sees none of it -----------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.assert((select count(*) from public.deals) = 0, 'delivery: no deals');
select pg_temp.assert((select count(*) from public.activities) = 0, 'delivery: no activities');
select pg_temp.assert((select count(*) from public.deal_stage_history) = 0, 'delivery: no stage history');
select pg_temp.assert((select count(*) from public.services) = 0, 'delivery: no services');
select pg_temp.assert((select count(*) from public.attachments) = 0, 'delivery: no attachments');
do $$
begin
  insert into storage.objects (bucket_id, name) values ('attachments', '30000000-0000-0000-0000-000000000001/x/a.pdf');
  raise exception 'FAILED: delivery uploaded a file';
exception when insufficient_privilege then null;
end $$;
commit;

-- Attachments --------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
insert into storage.objects (bucket_id, name) values ('attachments', '30000000-0000-0000-0000-000000000001/abc/brief.pdf');
insert into public.attachments (company_id, storage_path, file_name)
  values ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001/abc/brief.pdf', 'brief.pdf');
select pg_temp.assert((select count(*) from public.attachments) = 1, 'sales can attach files');
do $$
begin
  insert into public.attachments (company_id, storage_path, file_name)
    values ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002/abc/x.pdf', 'x.pdf');
  raise exception 'FAILED: attachment outside its company folder was accepted';
exception when check_violation then null;
end $$;
commit;

-- Deleting a company removes its deals, activities and attachment rows ---------
begin;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
delete from public.companies where name = 'Falcon Realty';
select pg_temp.assert((select count(*) from public.deals where title = 'Meta ads Q1') = 0, 'deals go with the company');
select pg_temp.assert(
  (select count(*) from public.activities where company_id = '30000000-0000-0000-0000-000000000001') = 0,
  'activities go with the company');
commit;
