# Predictotronix Setup Guide (ELI5)

A super-friendly, click-by-click guide to set up **Supabase** (your database + login system) and **Render** (where the app actually runs on the internet).

If you've never done this before, follow each step in order. Don't skip ahead.

---

## Part 1 — Supabase (do this first)

Supabase stores your users, fixtures, predictions, and scores. It also handles login.

### Step 1.1 — Create a Supabase account

1. Go to **https://supabase.com**.
2. Click **Start your project** (top right).
3. Sign in with GitHub (easiest) or email.

### Step 1.2 — Create a new project

1. Once logged in, click **New project**.
2. Pick (or create) an **Organization** — the free one is fine.
3. Fill in:
   - **Name:** `predictotronix` (or whatever you like)
   - **Database Password:** click **Generate a password** and **save it somewhere safe** (1Password, a note, etc.). You won't need it day-to-day but you can't see it again later.
   - **Region:** pick the one closest to you (e.g. `West EU (London)`).
   - **Pricing plan:** Free.
4. Click **Create new project**. Wait ~2 minutes while it spins up.

### Step 1.3 — Grab your Supabase keys

You need three values. Keep this tab open — you'll paste them into a file in a minute.

1. In the Supabase dashboard, click the **gear icon** (Settings) in the left sidebar.
2. Click **API** (or **API Keys**, depending on the new UI).
3. You'll see three things you need:

   | What you need | Where it is on the page |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | The box labelled **Project URL** (looks like `https://abcdefg.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Under **Project API keys**, the one labelled **`anon` / `public`** |
   | `SUPABASE_SERVICE_ROLE_KEY` | Under **Project API keys**, the one labelled **`service_role` / `secret`**. Click **Reveal** to see it. |

> **Important:** The `service_role` key is **god mode** — it bypasses all security rules. Never paste it into the browser-side code, never commit it to GitHub, never share it in chat. It only ever lives in environment variables on the server.

### Step 1.4 — Run the database migrations

This creates all the tables (users, fixtures, predictions, etc.).

1. In the Supabase dashboard, click the **SQL Editor** icon in the left sidebar (looks like `>_`).
2. Click **New query**.
3. On your computer, open the file [supabase/migrations/001_core_schema.sql](supabase/migrations/001_core_schema.sql).
4. Copy **all** of its contents.
5. Paste into the SQL Editor and click **Run** (bottom right). Wait for "Success".
6. Repeat steps 2–5 for each of these files **in this exact order**:
   - [supabase/migrations/002_fixtures_gameweeks.sql](supabase/migrations/002_fixtures_gameweeks.sql)
   - [supabase/migrations/003_predictions_audit.sql](supabase/migrations/003_predictions_audit.sql)
   - [supabase/migrations/004_notifications.sql](supabase/migrations/004_notifications.sql)
   - [supabase/migrations/005_rls_policies.sql](supabase/migrations/005_rls_policies.sql)
   - [supabase/migrations/006_rpc_functions.sql](supabase/migrations/006_rpc_functions.sql)

> If any of these errors out, **stop**. Don't run the later ones. The error message will tell you what's wrong (usually a typo, or you ran them out of order).

### Step 1.5 — (Optional) Seed test data

If you want a fake season with sample fixtures to play with:

1. New query → paste contents of [supabase/seed.sql](supabase/seed.sql) → Run.

Skip this if you want a clean production database.

### Step 1.6 — Configure email auth

By default Supabase sends "confirm your email" links. For local dev this is annoying, so:

1. Settings → **Authentication** → **Sign In / Up** (or **Providers** → **Email**).
2. Find **Confirm email** and **turn it OFF** for now. (You can turn it back on for production.)
3. Save.

### Step 1.7 — Add the production URL (do this AFTER Render is set up)

You'll come back to this in **Step 2.7**. For now, move on to Render.

---

## Part 2 — Render (deploys the app to the internet)

Render takes your code from GitHub and runs it on a real server.

### Step 2.1 — Push your code to GitHub

If you haven't already:

1. Create a new repo on **https://github.com/new** (private is fine).
2. From your project folder in a terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/predictotronix.git
   git push -u origin main
   ```

> **Double-check:** `.env.local` is in `.gitignore` so your secret keys are NOT pushed. Open `.gitignore` and confirm you see `.env*.local`. If not, add it and re-commit.

### Step 2.2 — Create a Render account

1. Go to **https://render.com**.
2. Click **Get Started** and sign up with GitHub. This makes the next step easier.

### Step 2.3 — Create the Web Service

1. In the Render dashboard, click **New +** (top right) → **Web Service**.
2. Click **Connect** next to your `predictotronix` GitHub repo. (If you don't see it, click **Configure account** and grant Render access to the repo.)
3. Fill in the form:

   | Field | Value |
   |---|---|
   | **Name** | `predictotronix` (this becomes part of your URL) |
   | **Region** | Pick the same region as your Supabase project |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` to start (upgrade later if needed) |

4. **Don't click Create yet** — scroll down to **Environment Variables** first.

### Step 2.4 — Add environment variables

Still on the "Create Web Service" page, scroll to **Environment Variables**. Click **Add Environment Variable** for each one below.

> Some of these come from Supabase (Step 1.3). Others come from third-party services. If you don't have an account for Resend / Twilio / RapidAPI yet, you can put placeholder values for now and update them later — the app will boot, those features just won't work.

| Key | Value | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefg.supabase.co` | Supabase Step 1.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (long string) | Supabase Step 1.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (different long string) | Supabase Step 1.3 |
| `RAPIDAPI_KEY` | Your RapidAPI key | https://rapidapi.com → subscribe to API-Football |
| `RESEND_API_KEY` | `re_...` | https://resend.com → API Keys |
| `RESEND_FROM` | `Predictotronix <no-reply@yourdomain.com>` | The "from" address shown on outgoing emails. The domain part must be one you've **verified** in Resend → Domains. |
| `TWILIO_ACCOUNT_SID` | `AC...` | https://console.twilio.com |
| `TWILIO_AUTH_TOKEN` | hex string | https://console.twilio.com |
| `TWILIO_FROM_NUMBER` | `+447...` (E.164 format) | Your purchased Twilio number |
| `CRON_SECRET` | A long random string | Generate one: in a terminal run `openssl rand -hex 32` and paste the output |
| `NEXT_PUBLIC_APP_URL` | `https://predictotronix.onrender.com` | This is your Render URL — see note below |
| `NODE_ENV` | `production` | Just type it |

> **Note about `NEXT_PUBLIC_APP_URL`:** You don't know your Render URL yet because the service doesn't exist. Either guess based on the **Name** you picked above (Render usually gives you `<name>.onrender.com`), or set it to `https://example.com` for now and fix it after Step 2.5.

5. Now click **Create Web Service** at the bottom.

### Step 2.5 — Wait for the first deploy

Render will start building. Watch the **Logs** tab. You'll see:

```
==> Cloning from https://github.com/...
==> Running 'npm install && npm run build'
...
==> Your service is live 🎉
```

Once you see "live", your URL is at the top of the page (something like `https://predictotronix.onrender.com`).

If the build **fails**, read the error in the logs. Common causes:
- A missing environment variable → go back to Step 2.4.
- A typo in the build command → check Step 2.3.

### Step 2.6 — Fix the `NEXT_PUBLIC_APP_URL`

1. Copy the real URL Render gave you (top of the service page).
2. In your service → **Environment** tab (left sidebar) → find `NEXT_PUBLIC_APP_URL`.
3. Update it to the real URL. Save.
4. Render will redeploy automatically. Wait until "live" again.

### Step 2.7 — Tell Supabase about the new URL

Back in Supabase:

1. Settings → **Authentication** → **URL Configuration**.
2. **Site URL:** paste your Render URL (e.g. `https://predictotronix.onrender.com`).
3. **Redirect URLs:** add the same URL plus `/**` at the end (e.g. `https://predictotronix.onrender.com/**`). This lets login redirects work.
4. Save.

### Step 2.8 — Set up the three cron jobs

Predictotronix needs three scheduled tasks. On Render you create these as **Cron Jobs** (different from Web Services).

> **Heads up:** Render Cron Jobs are full build-and-run units, not "fire a webhook" toggles. Render will ask you to pick a **repo** and give a **build command** — that's normal. You're picking the repo just to give the job a Linux container with `curl` in it; the actual job is the one-line `curl` command in the table below. We'll set the build command to a no-op.

For **each** of the three jobs below: Render dashboard → **New +** → **Cron Job**.

1. **Connect a repository** — pick the **same `predictotronix` repo** as your web service. (It doesn't matter that the repo doesn't contain cron code — we only need `curl`, which the container has by default.)
2. Fill in the form:

   | Field | Value |
   |---|---|
   | **Name** | `sync-fixtures` (or whichever of the three you're creating) |
   | **Region** | Same region as your web service |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `echo "no build needed"` (literally — we don't need to build anything) |
   | **Schedule** | See table below |
   | **Command** | See table below |
   | **Instance Type** | `Starter` is the cheapest cron option (Render doesn't offer a free tier for cron). |

3. Scroll to **Environment Variables** and add **both** of these (same values as your web service):

   | Key | Value |
   |---|---|
   | `CRON_SECRET` | The same secret as your web service |
   | `NEXT_PUBLIC_APP_URL` | Your live Render URL (e.g. `https://predictotronix.onrender.com`) |

4. Click **Create Cron Job**.
5. Repeat for the other two.

The three jobs:

| Name | Schedule | Command |
|---|---|---|
| `sync-fixtures` | `0 6 * * *` (daily 06:00 UTC) | `curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" $NEXT_PUBLIC_APP_URL/api/cron/sync-fixtures` |
| `sync-results` | `*/15 * * * *` (every 15 min) | `curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" $NEXT_PUBLIC_APP_URL/api/cron/sync-results` |
| `send-reminders` | `*/30 * * * *` (every 30 min) | `curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" $NEXT_PUBLIC_APP_URL/api/cron/send-reminders` |

> **Why pick a repo at all?** Because Render's cron pricing is per-container, every cron job is a tiny disposable Linux container that Render builds from a repo. The build command runs once when the container image is created; the **Command** runs on every tick of the schedule. By making the build a no-op, the container is essentially "stock Node + curl", which is all we need.

> **Alternative if you'd rather not pay for cron:** use **GitHub Actions** scheduled workflows instead — free for public repos and generous for private ones. See the snippet at the bottom of [README.md](README.md).

> If a cron job fails (red ✗ in the dashboard), open its logs. The most common cause is a wrong `CRON_SECRET` or the app URL still being a placeholder.

### Step 2.9 — Test it

1. Open your Render URL in a browser. You should be redirected to `/login`.
2. Click **Register**, create an account.
3. Open Supabase → **Authentication** → **Users**. You should see your new user.

### Step 2.10 — Grant yourself super admin

You can't get into `/admin` until you're a super admin.

1. Supabase → **Authentication** → **Users** → click your user → copy the **User UID** (looks like `a1b2c3d4-...`).
2. Supabase → **SQL Editor** → **New query** → paste:
   ```sql
   insert into public.league_roles (user_id, league_id, role)
   values ('PASTE-YOUR-UID-HERE', null, 'super_admin');
   ```
3. Run.
4. Refresh the app — you should now see admin links.

---

## Part 3 — Sanity checklist

Tick these off before you call it done:

- [ ] Supabase project created, password saved
- [ ] All 6 migrations ran with "Success"
- [ ] You can register a user on the live Render URL
- [ ] You are a super admin
- [ ] `NEXT_PUBLIC_APP_URL` matches the real Render URL (no trailing slash)
- [ ] Supabase Site URL + Redirect URLs match the Render URL
- [ ] Three cron jobs exist and have run at least once successfully
- [ ] `.env.local` is in `.gitignore` and **not** in your GitHub repo

---

## Part 4 — Troubleshooting

**"Invalid API key" or login redirects keep looping**
→ The Supabase URL / anon key are wrong, OR the Supabase **Site URL** doesn't match your Render URL. Re-check Step 1.3 and Step 2.7.

**Build fails with "Module not found" on Render**
→ Make sure your **Build Command** is `npm install && npm run build`, not just `npm run build`. Render's default sometimes skips `npm install`.

**Cron job logs show `401 Unauthorized`**
→ The `CRON_SECRET` value on the cron job doesn't match the one on the web service. Make them identical.

**Cron job logs show `404 Not Found`**
→ `NEXT_PUBLIC_APP_URL` is wrong (probably has a trailing slash, or `http` instead of `https`).

**Admin pages show "forbidden"**
→ You haven't run the super-admin SQL from Step 2.10. Or you ran it with the wrong UID.

**Render free tier sleeps after 15 min of inactivity**
→ That's normal. First request after a sleep is slow (~30s) while it wakes up. Upgrade to a paid plan to stop this, or live with it for hobby use.

**Can't see emails landing**
→ Until you verify a domain on Resend, you can only send to the email address you signed up to Resend with. Verify a domain (in Resend → Domains) for real delivery.

---

## Part 5 — Future you: making changes

After the first setup, the loop is much simpler:

1. Make code changes locally.
2. `git push` to `main`.
3. Render auto-deploys.
4. For DB schema changes: write a new file `supabase/migrations/00X_description.sql`, then run it manually in the Supabase SQL editor in production (and locally if you run a local Supabase).

That's it. Welcome to ops.
