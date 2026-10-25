# Onzar CRM

A private CRM for a digital marketing / drop-servicing business: clients, contacts,
pipeline, conversation history, follow-ups, projects, freelancers, invoices.
Built for one person now, ready for a small team later.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · deployed on Vercel.

> First time? Follow **[docs/SETUP.md](docs/SETUP.md)**: create the Supabase project, load the
> database, create your login, and run the app. About 20 minutes.

## Build status

| Phase | What | Status |
| --- | --- | --- |
| 1 | Setup, login, database, companies and contacts | ✅ built |
| 2 | Pipeline (kanban + table) and conversation history | next |
| 3 | Follow-ups, tasks and the Today page | |
| 4 | Projects, freelancers and margins | |
| 5 | Proposals, invoices and PDF export | |
| 6 | Dashboard, track record, CSV import/export | |
| 7 | Roles and permissions UI, polish, go live | |

## Everyday commands

Run these inside the `crm` folder.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app on http://localhost:3000 (reloads as you edit) |
| `npm run check` | Lint + type check + unit tests. Run before every commit |
| `npm test` | Unit tests only (phone numbers, links, form validation; money maths from Phase 4) |
| `npm run test:db` | Database security tests on a throwaway local Postgres (needs Postgres installed; optional) |
| `npm run build` | Production build, the same as Vercel runs |
| `npm run db:push` | Apply new database migrations to your Supabase project |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from your Supabase project |

## How the code is organised

```
crm/
  messages/en.json          every piece of UI text (translate this file to add Arabic)
  supabase/
    migrations/             the database, as SQL files applied in order
    tests/                  database security tests (who can see what)
    config.toml             Supabase settings for local development
  src/
    proxy.ts                runs before every page: refreshes the login, redirects signed-out users
    app/
      (auth)/               sign-in and forgot-password pages
      auth/confirm/         handles links from Supabase emails (invite, reset password)
      (app)/                everything behind the login
        companies/          list, detail, new, edit (+ actions.ts = saving to the database)
        contacts/           list, new, edit
        search/             one search across everything
        account/            your name and password
    components/
      ui/                   buttons, inputs, dialogs... (shadcn/ui style)
      shell/                sidebar, top bar, phone tab bar, account menu
    lib/
      auth.ts               who is signed in, and what role they have
      data/                 database reads used by pages
      validation/           form rules (required fields, phone format...)
      phone.ts              phone number cleaning + WhatsApp links
      supabase/             database clients (server, browser, proxy)
```

### Where data rules live

1. **The database is the real gatekeeper.** Every table has Row Level Security. The
   policies in `supabase/migrations/` decide which role can read or change what, so even
   a bug in the app can't show data to the wrong person. `npm run test:db` proves it.
2. **Server Actions** (`actions.ts` files) validate every form with the rules in
   `src/lib/validation/` before anything is saved.
3. **The UI** hides what your role can't use, but that's only for convenience.

### Security notes

- The only keys in the app are the Supabase URL and the *publishable* key. Both are designed
  to be public. The secret / service-role key is never used by this app; don't add it.
- `.env.local` holds your keys and is git-ignored. Never commit it.
- Public sign-up is off. People get in only when you invite them (see SETUP.md).

### Adding Arabic later

All text is in `messages/en.json` and layouts use start/end instead of left/right.
To add Arabic: add `"ar"` to `src/i18n/config.ts`, create `messages/ar.json`, and add a
language switcher. The page flips to right-to-left automatically.
