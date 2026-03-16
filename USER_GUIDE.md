# Personal Finance Tool — User Guide

A complete reference for every feature in the app.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Importing Bank Statements](#3-importing-bank-statements)
4. [Transactions](#4-transactions)
5. [Budget Buckets](#5-budget-buckets)
6. [Income Allocation](#6-income-allocation)
7. [Savings Goals](#7-savings-goals)
8. [Recurring Items](#8-recurring-items)
9. [Reports & Analytics](#9-reports--analytics)
10. [Settings](#10-settings)
11. [Smart Categorization Rules](#11-smart-categorization-rules)
12. [Data Management](#12-data-management)
13. [Tips & Workflows](#13-tips--workflows)

---

## 1. Getting Started

### Running the app

```bash
cd "PERSONAL FINANCE TOOL"
npm run dev
```

Open `http://localhost:5173` (or the port shown in the terminal) in your browser.

### First-time setup (recommended order)

1. **Settings → General** — set your currency and pay cycle
2. **Settings → Income & Super** — enter your salary so the tax calculator works
3. **Settings → Accounts** — add your bank accounts (NAB, CommBank, etc.)
4. **Import** — upload your first CSV bank statement
5. **Transactions** — review and fix any mis-categorized transactions
6. **Budget** — create budget buckets for your spending categories
7. **Goals** — set up any savings goals you're working toward

---

## 2. Dashboard

The dashboard gives you an at-a-glance view of your financial health.

### Stat cards (top row)
| Card | What it shows |
|------|--------------|
| Monthly Income | Total income transactions this calendar month |
| Monthly Expenses | Total spending this calendar month |
| Net this Month | Income minus expenses (green = surplus, red = deficit) |
| Net Worth | Sum of all account opening balances plus all transaction amounts |

### Charts
- **Cash Flow** — side-by-side income/expense bars with a net line for the last 6 months
- **Spending by Category** — donut chart of your top 8 expense categories this month

### Budget Buckets snapshot
Horizontal cards showing each bucket's spend vs limit. Red = over budget.

### Savings Goals snapshot
Progress bars for each active goal.

### Recent Transactions
Your 10 most recent transactions. Click any row to jump to the full Transactions page.

### Upcoming Recurring
Bills and subscriptions due in the next 14 days.

---

## 3. Importing Bank Statements

The Import page walks you through a 4-step process.

### Supported formats
- **CommBank** (Commonwealth Bank) — headerless CSV: `Date, Amount, Description, Balance`
- **ANZ, NAB, Westpac, Macquarie** — standard CSV with header row
- Any CSV with columns named: date, description, amount (or debit/credit)

### How to export from CommBank
1. Log in to NetBank
2. Go to your account → **Transaction History**
3. Click **Export** → choose **CSV** format
4. Select your date range and download

### Import steps

**Step 1 — Upload**
- Select the account the statement belongs to (required first)
- Drag and drop your `.csv` file onto the upload area, or click to browse
- The parser automatically detects column positions — no configuration needed

**Step 2 — Configure**
- Review how many transactions were found, skipped, or had errors
- Errors are usually rows with unreadable dates — these are skipped safely
- Change the account if you selected the wrong one

**Step 3 — Review**
- Every transaction is shown with its auto-assigned category
- **Duplicates** (transactions already in the app with the same date/amount/description) are pre-unchecked and shown in amber — import them again only if needed
- Change any category using the dropdown in that row
- Uncheck any rows you don't want to import
- Use the **All / New / Duplicates** filter tabs to focus your review

**Step 4 — Success**
- A summary shows how many were imported
- Click **Import Another File** to repeat, or **View Transactions** to see them

### Import History
Below the import flow, a table shows every past import batch with its filename, date, account, and transaction count. You can delete a batch (which also removes all its transactions) if you imported incorrectly.

---

## 4. Transactions

The full transaction ledger with search, filter, and edit capabilities.

### Searching and filtering

| Filter | How to use |
|--------|-----------|
| Search | Type any part of a description — matches instantly |
| Date range | Pick a from/to date to narrow the period |
| Category | Filter to one category |
| Account | Filter to one account |
| Type | All / Income / Expense / Transfer pills |
| Amount range | Min and max dollar amounts |

Active filters appear as **chips** below the search bar. Click × on any chip to remove just that filter. Click **Clear all** to reset everything.

### Editing a transaction

Click the **pencil icon** on any row to open inline editing:
- Change the date, description, amount, category, account, tags, or notes
- Press **Enter** or click **Save** to confirm
- Press **Escape** or click **Cancel** to discard

After saving a category change, a **"Remember this?"** toast appears in the bottom-right corner. If you click **Yes, remember**, the app extracts the key merchant name and saves it as a Smart Rule — future CSV imports will automatically assign that category.

### Bulk actions

Check multiple rows (or use **Select all N**) to:
- **Categorize** — assign one category to all selected transactions at once
- **Delete** — remove all selected transactions

### Adding a transaction manually

Click **+ Add Transaction** (top right) to open the modal:
- Choose Income or Expense
- Enter date, amount, description, category, account
- Add tags (press Enter or comma after each tag)
- Add notes for context
- Click **Save**

### Exporting

Click **Export CSV** to download the currently-filtered transactions as a spreadsheet.

### Smart Rules panel

If you have saved keyword rules, a collapsible **Smart Rules** section appears at the bottom of the page. It shows all active `keyword → category` mappings as chips. Click × on any chip to delete that rule.

---

## 5. Budget Buckets

Buckets group spending categories together and give them a monthly limit.

### How buckets work
Each bucket contains one or more expense categories. Transactions in those categories count toward the bucket's monthly spend. A progress bar fills from green → amber → red as you approach and exceed the limit.

### Month navigation
Use the **← →** arrows to browse past months and see historical spending. Click **This Month** to return to the current month.

### Creating a bucket

Click **+ New Bucket**:
- **Name** — e.g. "Food & Dining"
- **Icon** — choose from the icon grid
- **Color** — choose a color dot
- **Monthly Limit** — your spending target in dollars
- **Categories** — tick all expense categories that belong in this bucket (e.g. Groceries + Dining Out)
- **Rollover** — if enabled, any unspent amount from last month is added to this month's limit

### Stat cards (top row)
| Card | What it shows |
|------|--------------|
| Total Budgeted | Sum of all bucket monthly limits |
| Total Spent | Actual spending across all bucket categories this month |
| Remaining | Budget minus spent (green if positive) |
| Over Limit | Number of buckets that have exceeded their monthly limit |

---

## 6. Income Allocation

Plan how your income is divided across spending categories using a budgeting framework.

### Frameworks

| Framework | Description |
|-----------|-------------|
| 50/30/20 | 50% needs, 30% wants, 20% savings |
| Pay Yourself First | Savings come first, then divide the rest |
| Zero-Based | Every dollar is allocated — income minus allocations = 0 |
| Custom | Set your own percentages freely |

Clicking a framework auto-fills the allocation percentages using that framework's logic. You can then fine-tune each bucket's percentage manually.

### Allocation table
Each row corresponds to a budget bucket. The **%** column is editable (type or drag the slider). The **$ Amount** column shows the dollar value based on your monthly net income. The running total badge at the top turns green when allocations add up to exactly 100%.

### Actual vs Planned chart
A horizontal bar chart compares your planned allocation (bucket color) against your actual spending (emerald if under, rose if over) for the current month.

### Income setup
At the top of the page, enter your **monthly net income** (after tax). This drives all the dollar calculations. Use Settings → Income & Super to calculate this automatically from your gross salary.

---

## 7. Savings Goals

Track progress toward financial milestones.

### Creating a goal

Click **+ New Goal**:
- **Emoji** — pick a visual icon for the goal
- **Name** — e.g. "Emergency Fund", "Europe Trip", "House Deposit"
- **Target Amount** — the dollar amount you're saving toward
- **Current Savings** — how much you've already saved
- **Target Date** (optional) — a deadline; the app calculates required monthly savings
- **Color** — for the progress bar
- **Notes** (optional) — any context

### Goal cards
Each card shows:
- Progress bar filling toward the target
- How much saved vs target, and percentage complete
- Days remaining until target date (shown in amber if close, red if overdue)
- Monthly savings required to hit the target date

### Adding a contribution

Click **Add Contribution** on any card:
- Enter a positive amount to add savings
- Enter a negative amount to withdraw
- A preview bar shows the new balance before you confirm
- When the balance reaches the target, the goal is automatically marked complete

### Completed goals
Completed goals collapse into a separate **Completed Goals** section. You can expand it to review past achievements or edit them.

---

## 8. Recurring Items

Track regular income and expenses (salary, rent, subscriptions, etc.).

### Upcoming cards
The top section shows all active recurring items due in the **next 30 days**, sorted by date. Overdue items are highlighted in amber.

**Mark Paid** button: clicking it records an actual transaction in your ledger for that item and advances its next expected date by one frequency period.

### All recurring items table

| Column | Description |
|--------|-------------|
| Description | Name of the recurring item |
| Amount | Positive for income, negative for expense |
| Category | Assigned category |
| Account | Which account it affects |
| Frequency | Weekly / Fortnightly / Monthly / Quarterly / Annual |
| Next Due | Next expected date (red if overdue) |
| Active | Toggle to pause/resume without deleting |

Use the filter tabs (All / Income / Expenses / Active / Paused) and the search box to find items quickly.

### Auto-detection
The app scans your transaction history for patterns — descriptions that appear 3+ times with similar amounts at regular intervals. Detected patterns appear as suggestions with an **Add as Recurring** button.

### Monthly summary cards (top)
- **Recurring Income** — total monthly equivalent of all active income items
- **Recurring Expenses** — total monthly equivalent of all active expense items
- **Net** — difference (how much is left after fixed commitments)

---

## 9. Reports & Analytics

Deep-dive analytics across your transaction history.

### Period selector
Use the **3M / 6M / 12M** buttons to change the analysis window.

### Summary stats
| Stat | Description |
|------|-------------|
| Total Income | All income in the period |
| Total Expenses | All expenses in the period |
| Net Saved | Income minus expenses |
| Savings Rate | Net saved as a percentage of income |

### Charts

| Chart | Description |
|-------|-------------|
| Cash Flow | Monthly income vs expenses bars with net line |
| Spending by Category | Donut chart of expense categories |
| Spending Trend | Line chart showing top 5 categories over time |
| Savings Rate | Area chart of your monthly savings rate % with a 20% reference line |
| Net Worth | Cumulative area chart showing your net worth growing over time |

### Top Merchants
A table of your biggest spending merchants (by description), ranked by total amount spent. Shows transaction count, total, and category badge.

### Monthly Comparison
Two month selectors let you compare any two months side-by-side. Shows income, expenses, net, and savings rate for each, with color-coded variance indicators.

---

## 10. Settings

### General tab
- **Currency** — sets the symbol used throughout the app (AUD, USD, EUR, etc.)
- **Pay Cycle** — Weekly / Fortnightly / Monthly; used by recurring items and allocation calculations
- **Pay Day** — which day of the cycle you get paid
- **Theme** — 🌙 Dark or ☀️ Light mode; click Save to apply

### Income & Super tab
- **Annual Salary** — enter your gross figure
- **Super included toggle** — choose whether your figure is:
  - **OFF** (default): Base salary + employer pays super on top (e.g. $90k base, $10,350 super extra)
  - **ON**: Total package includes super (e.g. $90k package = ~$80,717 base + ~$9,283 super)
- **Super rate slider** — drag or type your superannuation rate (ATO minimum is 11.5% for 2024–25)
- **Tax breakdown** — live ATO 2024–25 estimate showing income tax, LITO offset, Medicare levy, and net take-home (annual / monthly / fortnightly / weekly)
- **Monthly Net override** — if your actual take-home differs from the estimate, enter the real figure here

### Categories tab
- View all 20 default categories plus any custom ones you've created
- **Edit** any category's name, icon, color, type, or auto-categorization keywords
- **Add** custom categories with your own icon and color
- **Remove rules** from the keyword list to fine-tune auto-categorization
- Default categories cannot be deleted (they have a lock icon)

### Accounts tab
- Add bank accounts, savings accounts, credit cards, or investment accounts
- Set the opening balance for each (used for net worth calculation)
- Toggle accounts inactive to hide them from dropdowns without losing history

### Data tab
- **Export** — downloads all your data as a JSON backup file (timestamped filename)
- **Import** — restores from a previously exported JSON backup
- **Reset** — clears all data and restores to a blank slate (requires confirmation)

---

## 11. Smart Categorization Rules

The app learns from your corrections to auto-categorize future imports.

### How it works

1. Import a CSV — transactions are auto-categorized using 200+ built-in keywords
2. In the Transactions page, change any mis-categorized transaction's category
3. The **"Remember this?"** toast appears — click **Yes, remember**
4. The app extracts the key merchant name (e.g. "coles", "spotify", "club lime") and saves a rule
5. Next time you import, that keyword is matched first before the built-in rules

### Managing rules

The **Smart Rules** panel at the bottom of the Transactions page shows all saved rules as chips:
```
coles → Groceries    spotify → Subscriptions    club lime → Health & Fitness
```
Click × on any chip to remove the rule.

### Built-in keywords (examples)

| Category | Keywords matched |
|----------|-----------------|
| Groceries | woolworths, coles, aldi, harris farm, iga |
| Dining Out | uber eats, menulog, doordash, mcdonald, hungry jack |
| Transport | uber, bp, shell, opal, translink, taxi |
| Subscriptions | netflix, spotify, apple, disney, amazon prime |
| Health | chemist warehouse, pharmacy, medicare, gym |
| Investments | commsec, stake, raiz, etf, vanguard |

---

## 12. Data Management

### Backup your data

Go to **Settings → Data → Export Backup**. This downloads a `.json` file with all your transactions, settings, categories, goals, and rules. Store it somewhere safe (cloud storage, email to yourself).

**Tip:** Export a backup before making major changes like bulk-deleting transactions.

### Restore from backup

Go to **Settings → Data → Import Backup**. Select your `.json` file. All data is replaced with the backup contents.

### Reset to blank

Go to **Settings → Data → Reset to Sample Data**. This wipes everything and starts fresh. Type to confirm — this cannot be undone without a backup.

### Where data is stored

All data is stored in your browser's **localStorage** under the key `ultimate_finance_v3`. This means:
- Data persists between browser sessions
- Data is specific to this browser on this computer
- Clearing browser storage will erase the data (always keep a backup)
- Data is never sent to any server — fully private and local

---

## 13. Tips & Workflows

### Monthly review workflow

1. **Import** this month's bank statement CSV
2. Go to **Transactions** → filter to this month → fix any mis-categorized items (and save Smart Rules)
3. Check **Budget** to see which buckets are over/under
4. Review **Dashboard** for the overall picture
5. Update **Goals** with any contributions you made
6. Export a backup

### Getting accurate net worth

1. Go to **Settings → Accounts**
2. Set the **Opening Balance** for each account to its balance on the date you started tracking
3. As you import transactions, the net worth chart in Reports will grow correctly

### Tracking investments (e.g. ETFs, crypto)

- Create an account of type **Investment** with your portfolio value as the opening balance
- When you buy more, import or manually add a transaction categorized as **Investments** (negative = money leaving your bank to buy assets)
- When the portfolio grows in value, manually add an income transaction categorized as **Investment Income** to reflect the gain

### Pay yourself first

1. Go to **Allocation** → select the **Pay Yourself First** framework
2. Set your savings/investment buckets to their percentages first (e.g. 20%)
3. Divide the remaining 80% across your spending buckets
4. Create a **Recurring Item** for your savings transfer so it shows up as upcoming each pay cycle

### Using tags

Tags are free-form labels you can add to any transaction (e.g. "deductible", "reimbursable", "holiday"). Use the search bar in Transactions to filter by typing a tag name in the search box.

### Dealing with transfers between your own accounts

When you transfer money from your everyday account to savings:
- Categorize as **Savings Transfer** (type: Transfer)
- This prevents it from distorting your income/expense totals
- The money still appears in your net worth correctly via both account balances

---

*Built with React 19, TypeScript, Vite, Tailwind CSS v4, and Recharts. All data stored locally in your browser.*
