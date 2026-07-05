# Enabling Cloud Sync (Google sign-in + PostgreSQL)

The app runs **local-first** out of the box — everything works with data in the
browser, no account needed. These steps switch on Google sign-in and
cross-device sync. All services below have free tiers; total cost ₹0.

## 1. PostgreSQL database (~3 min)

Easiest options:

- **Supabase** — supabase.com → New project → Settings → Database →
  Connection string (URI, use the "Transaction" pooler string).
- **Neon** — neon.tech → New project → copy the connection string.

Put it in `.env.local` as `DATABASE_URL`.

## 2. Google OAuth credentials (~5 min)

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project
   (e.g. "Project Aesthetic").
2. **APIs & Services → OAuth consent screen** → External → fill app name +
   your email → add yourself as a test user.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   Web application.
   - Authorized JavaScript origins: `http://localhost:3000` (add your
     production URL later)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Copy the Client ID and Client Secret into `.env.local`.

## 3. Auth secret

```bash
npx auth secret        # writes AUTH_SECRET to .env.local
```

## 4. Create the tables & run

```bash
npx prisma migrate dev --name init   # creates all tables
npm run dev
```

Open **More → Sign in with Google**. Your local data uploads on first sign-in
and syncs automatically after every change (4-second debounce), on app open,
and when you come back online. **Progress photo images never sync** — only
their metadata (month, angle, weight); the images stay on each device by
design.

## Production (Vercel)

Add the same four env vars in Vercel → Project → Settings → Environment
Variables, and add your production URL to the Google OAuth origins +
redirect URIs. Run `npx prisma migrate deploy` against the production
database (or let Supabase/Neon run it via CI).
