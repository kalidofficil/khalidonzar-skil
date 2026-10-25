# Setup guide

Follow these steps once. You need:

- A computer with **Node.js 22 or newer** ([nodejs.org](https://nodejs.org), choose "LTS"). Check with `node -v`.
- A free **Supabase** account ([supabase.com](https://supabase.com)).
- Later, for going online: a **Vercel** account ([vercel.com](https://vercel.com)), signed in with GitHub.

Commands below run in a terminal, inside the `crm` folder of this repository.

---

## 1. Create the Supabase project (5 min)

1. In Supabase, click **New project**.
2. Name: `onzar-crm`. Choose a strong **database password** and save it in your password manager.
3. **Region**: pick the one closest to Dubai in the list. Use a Middle East region if one is offered, otherwise Mumbai or Frankfurt.
4. Wait about a minute for it to finish.

## 2. Load the database (5 min)

The database is defined by the SQL files in `supabase/migrations/`. Pick **one** way to load them.

### Option A: command line (recommended, because it remembers which files already ran)

```bash
npm install
npx supabase login                          # opens the browser once
npx supabase link --project-ref YOUR_REF    # YOUR_REF is in the project URL: supabase.com/dashboard/project/YOUR_REF
npm run db:push                             # applies every migration that hasn't run yet
```

Each later phase adds a new file to `supabase/migrations/`. Run `npm install` and `npm run db:push`
again after pulling it. (Phase 2 added `20261026000001_pipeline_and_activities.sql`: deals,
activities, the services list and the private **attachments** file bucket.)

### Option B: copy and paste

In Supabase open **SQL Editor → New query**, paste the whole content of
`supabase/migrations/20261025000001_foundation.sql`, and click **Run**. It should say "Success".
Then do the same with `20261026000001_pipeline_and_activities.sql`.
For later phases, run each new migration file once, oldest first. If you use this option,
keep a note of which files you've already run.

## 3. Lock down sign-in (3 min)

In Supabase:

1. **Authentication → Sign In / Providers → Email**: keep Email enabled. Turn **off** "Allow new users to sign up".
   This means only people you invite can get in.
2. On the same page, set the minimum password length to **10**.
3. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for now. Change it to your live address when you deploy (step 7).
   - **Redirect URLs**: add `http://localhost:3000/**`.

## 4. Email templates for invites and password resets (3 min)

So email links open this app correctly, go to **Authentication → Emails → Templates**:

- **Invite user**: replace the link in the message body with
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Accept the invite</a>
  ```
- **Reset password**: replace the link with
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>
  ```

Both links sign the person in and take them to **Account**, where they set their password.

> Supabase's built-in email sender only allows a few emails per hour. That's fine for now.
> When the team grows, add your own SMTP under **Authentication → Emails → SMTP Settings**.

## 5. Create your own login (1 min)

**Do this after step 2.** The database makes the *first* user the **Owner** automatically.

1. **Authentication → Users → Add user → Create new user**.
2. Enter your email and a password (10+ characters), and tick **Auto Confirm User**.

Check it worked: **Table Editor → profiles** should show your email with role `owner`.

<details>
<summary>Created your user before loading the database?</summary>

Run this once in the SQL Editor, replacing the email:

```sql
insert into public.profiles (id, email, role)
select id, email, 'owner' from auth.users where email = 'you@example.com'
on conflict (id) do update set role = 'owner';
```
</details>

## 6. Run the app on your computer (3 min)

1. In Supabase open **Project Settings → API Keys**. Copy the **publishable** key (starts with
   `sb_publishable_`). Older projects call it the **anon** key, which also works. Then copy the
   **Project URL** (Project Settings → Data API, or the "Connect" button).
2. Create your settings file:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and paste the two values.
3. Start the app:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:3000 and sign in.

## 7. Put it online with Vercel (optional now, required in Phase 7)

Deploying early lets you test on your phone. The app lives in the `crm` folder of the repository.

1. Push the repository to GitHub (already done if you're reading this there).
2. In Vercel, click **Add New → Project** and import the repository.
3. Set **Root Directory** to `crm`. The framework is detected as Next.js.
4. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the same values as `.env.local`).
5. Click **Deploy**. You get an address like `https://onzar-crm.vercel.app`.
6. Back in Supabase **Authentication → URL Configuration**: set **Site URL** to that address and
   add `https://onzar-crm.vercel.app/**` to Redirect URLs.
7. On your phone, open the address and sign in. Then use **Share → Add to Home Screen** (iPhone)
   or **⋮ → Install app** (Android). It now opens like a normal app.

> **Plan note:** Vercel's free Hobby plan is for non-commercial use. It's fine for testing.
> Before the business relies on it, move to Vercel Pro or another host (decided in Phase 7).

## 8. Inviting someone later

**Authentication → Users → Invite user**, then enter their email. They get an email, set a password,
and land on a "Waiting for access" screen until you give them a role. Until the Phase 7 team
screen exists, set it in the SQL Editor:

```sql
update public.profiles set role = 'sales' where email = 'teammate@example.com';  -- or 'delivery'
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Missing Supabase settings" | `.env.local` is missing or has a typo. Restart `npm run dev` after editing it. |
| Signed in but sees "Waiting for access" | That user has no role. See step 8 (or step 5's note for your own account). |
| Email link says "invalid or has expired" | Links work once and expire after an hour. Request a new one. Also check the template from step 4. |
| Lists are empty after signing in | Check the migration ran (step 2) and your profile has role `owner` (step 5). |
| File upload fails | Check the Phase 2 migration ran: **Storage** should show a private bucket called `attachments`. Files must be 10 MB or smaller. |
| Copy buttons show a pop-up instead of copying | Browsers only allow copying on `https://` or `localhost`. It works on the Vercel address. |
