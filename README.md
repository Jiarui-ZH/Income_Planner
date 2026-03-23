# FinanceOS

**Live app → https://income-planner.vercel.app**

A multi-user personal finance platform built with React 19, TypeScript, Vite, Tailwind CSS v4, and Supabase. Each user has a private account — data is stored securely in the cloud and accessible from any device.

---

## Features

- Multi-user authentication (email/password via Supabase Auth)
- Cloud data storage — access your data from any device, any browser
- Import CommBank / ANZ / NAB / Westpac CSV bank statements
- Auto-categorization with 200+ built-in keywords + smart-rules engine
- Budget buckets with monthly limits and rollover
- Income allocation frameworks (50/30/20, Pay Yourself First, Zero-Based, Custom)
- Savings goals with contribution tracking
- Recurring income & expense tracker with auto-detection
- Reports & analytics (cash flow, spending trends, net worth, savings rate)
- Australian ATO 2024–25 tax calculator
- Professional light theme — clean, sharp interface
- Full data export / import / reset

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Auth & database | Supabase |
| Charts | Recharts |
| CSV parsing | PapaParse |
| Icons | Lucide React |
| Routing | React Router v7 |
| Hosting | Vercel |

---

## Running Locally

**Requirements:** Node.js 18+, a Supabase project.

```bash
# 1. Clone the repo
git clone https://github.com/Jiarui-ZH/Income_Planner.git
cd Income_Planner

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Add environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

Create `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
# 4. Run the database schema
# Paste supabase/schema.sql into Supabase Dashboard → SQL Editor → Run

# 5. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon public** key from **Project Settings → API**
4. Add them to `.env.local` as shown above

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add environment variables in **Vercel → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — every future `git push` auto-deploys

---

## Data & Privacy

- All data is stored in your Supabase PostgreSQL database, isolated per user via Row Level Security (RLS)
- No user can access another user's data
- You as the project owner have full access via the Supabase dashboard
- Export your data anytime via **Settings → Data → Export Backup**
