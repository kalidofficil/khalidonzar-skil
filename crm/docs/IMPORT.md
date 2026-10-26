# Importing leads

`scripts/import_lead_analysis.py` turns a lead-analysis workbook (the
`ClickTap_Lead_Analysis.xlsx` format: tabs "All Leads Scored" and "Priority Leads")
into one SQL file that you run in Supabase.

## Before you start

- Both migrations have run (`20261025000001_foundation.sql` and `20261026000001_pipeline_and_activities.sql`).
- Your owner login exists (docs/SETUP.md step 5). Imported records are owned by it.

## Run the import

1. Open Supabase → **SQL Editor** → **New query**.
2. Open the `.sql` file in a text editor, copy everything, paste it into the editor, and click **Run**.
3. The last result shows how many companies were imported per status. Refresh the CRM.

If the editor says the query is too large, run it from your computer instead (needs Postgres's `psql`).
Use the connection string from Supabase → **Connect** → *Session pooler*:

```bash
psql "postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" -f onzar-crm-lead-import.sql
```

The file runs as one transaction: if anything fails, nothing is imported. Running it twice is
refused, so you can't create duplicates by accident.

## What gets created

| Lead rating | What you get |
| --- | --- |
| HOT / WARM | Company + contact + an open **deal** at the matching stage, with a next follow-up date. Deal notes hold the rating, the service to pitch, the upsell, the opening message and the next action. |
| Existing client ("deal closed") | A **won** PR deal (value 0: please fill in) + an open upsell deal. Company status = Client. |
| COLD | Company + contact, tagged `cold`. No deal, so the pipeline stays clean. |
| Not interested / invalid | Company + contact with status **Archived** (kept for history, hidden from lists). |
| Agencies | Tagged `partner`, no deal. |

Every original inquiry becomes an activity on the company timeline, with your team's call notes.
Repeat inquiries from the same company (same email domain or phone) are merged into one company.

Useful filters afterwards: **Companies → Tag → hot / warm / cold / partner / client**, and
**Pipeline → Table → Follow-up → Due today**. The table also has an **Overdue** filter.

## Undo

```sql
delete from public.companies where 'import-2026-10' = any(tags);
```

This removes every imported company and, with it, their contacts, deals, activities and files.

## Privacy

The generated `.sql` contains names, phone numbers and emails. Keep it out of git: the
`imports/` folder is git-ignored for this. Delete the file after importing.
