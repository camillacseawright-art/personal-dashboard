# Personal Dashboard — Setup & Deploy

## What's included
| Section | Features |
|---------|----------|
| **Tasks** | Create tasks with priority (high/med/low) & due dates, check off, delete |
| **Habits** | Daily habit tracking with 7-day streaks and color coding |
| **Notes** | Date-based journal with auto-save and history sidebar |
| **Goals** | Long-term goals with progress sliders and status tracking |
| **Dashboard** | Overview with live counts, habit streaks, goal bars, note preview |

---

## Step 1 — Create a Neon database (free)

1. Go to **https://neon.tech** → sign up (free tier is plenty)
2. Create a new project (any name, e.g. "personal-dashboard")
3. In your project → **Connection Details** → copy the **Pooled connection string**
   - It looks like: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## Step 2 — Set up local env

```bash
cd personal-dashboard
cp .env.local.example .env.local
# Edit .env.local and paste your Neon connection string as DATABASE_URL
```

---

## Step 3 — Push the database schema

```bash
npm run db:push
```

This creates all 5 tables (tasks, habits, habit_logs, notes, goals) in your Neon database.

---

## Step 4 — Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Step 5 — Deploy to Vercel

1. Push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial personal dashboard"
   git remote add origin https://github.com/YOUR_USERNAME/personal-dashboard.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** → Import project → select your repo

3. In Vercel project settings → **Environment Variables** → add:
   ```
   DATABASE_URL = <your Neon pooled connection string>
   ```

4. Click **Deploy** — it's live in ~60 seconds

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run db:push` | Push schema changes to Neon |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run build` | Production build |
