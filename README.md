# Income Planner

**Live app → https://jiarui-zh.github.io/Income_Planner/**

A private, browser-based personal finance dashboard built with React 19, TypeScript, Vite, and Tailwind CSS v4.

All data is stored **locally in your browser** — nothing is ever sent to a server.

---

## Features

- Import CommBank / ANZ / NAB / Westpac CSV bank statements
- Auto-categorization with 200+ built-in keywords + a learning smart-rules engine
- Budget buckets with monthly limits and rollover
- Income allocation across frameworks (50/30/20, Pay Yourself First, Zero-Based, Custom)
- Savings goals with contribution tracking
- Recurring income & expense tracker with auto-detection
- Reports & analytics (cash flow, spending trends, net worth, savings rate)
- Australian ATO 2024–25 tax calculator with super-included toggle
- Dark and light mode
- Full data export / import / reset

See [USER_GUIDE.md](./USER_GUIDE.md) for a complete feature reference.

---

## Running locally

**Requirements:** Node.js 18 or later.

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Deploying so you can access it from anywhere

The app is a static site (pure HTML + JS after building), so it can be hosted for **free** on several platforms. Choose one:

---

### Option A — Netlify (easiest, recommended)

1. Push your code to GitHub.
2. Go to [netlify.com](https://netlify.com) and sign in with your GitHub account.
3. Click **Add new site → Import an existing project** and select your repo.
4. Set the build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**.

Netlify gives you a free URL like `https://your-site-name.netlify.app`. Every time you push to GitHub, it re-deploys automatically.

---

### Option B — Vercel (also very easy)

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
3. Click **Add New → Project** and import your repo.
4. Vercel auto-detects Vite — just click **Deploy**.

You'll get a URL like `https://your-repo-name.vercel.app`. Auto-deploys on every push.

---

### Option C — GitHub Pages (free, manual setup)

GitHub Pages requires a small config change because it serves the app from a subdirectory path (`/your-repo-name/` instead of `/`).

**Step 1 — Set the base path in `vite.config.ts`:**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/YOUR_REPO_NAME/',   // <-- add this line
  plugins: [react(), tailwindcss()],
})
```

**Step 2 — Add a GitHub Actions workflow.**

Create the file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Step 3 — Enable GitHub Pages in your repo settings:**

Go to your repo → **Settings → Pages → Source** → select **Deploy from a branch** → branch: `gh-pages`.

**Step 4 — Push to `main`.** The Actions workflow runs, builds the app, and publishes it.

Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

> **Note:** Netlify and Vercel are simpler because they handle the base path automatically. Use GitHub Pages only if you want everything in one place.

---

## Building manually

```bash
npm run build
```

Output goes to the `dist/` folder. You can host those files on any static web host (S3, Cloudflare Pages, your own server, etc.).

To preview the production build locally:

```bash
npm run preview
```

---

## Tech stack

| Layer | Library |
|-------|---------|
| UI framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| CSV parsing | PapaParse |
| Icons | Lucide React |
| Routing | React Router v7 |

---

## Data & privacy

- All data is stored in your browser's `localStorage` key `ultimate_finance_v3`.
- No backend, no accounts, no telemetry.
- Clearing your browser's site data will erase the app data — use **Settings → Data → Export Backup** regularly.
- Data is tied to the browser + device you use. To move data to another browser/device, export a backup and import it there.
