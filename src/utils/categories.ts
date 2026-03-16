import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // ── Income ──────────────────────────────────────────
  {
    id: 'cat_salary', name: 'Salary / Wages', icon: 'Banknote', color: '#10b981',
    keywords: ['salary', 'payroll', 'pay slip', 'wages', 'employer', 'ato', 'tax refund', 'centrelink', 'payg'],
    type: 'income', isDefault: true,
  },
  {
    id: 'cat_freelance', name: 'Freelance / Business', icon: 'Briefcase', color: '#34d399',
    keywords: ['invoice', 'freelance', 'consulting', 'client', 'business income', 'abn'],
    type: 'income', isDefault: true,
  },
  {
    id: 'cat_inv_income', name: 'Investment Income', icon: 'TrendingUp', color: '#6ee7b7',
    keywords: ['dividend', 'interest earned', 'distribution', 'capital gain', 'commsec income', 'investment return'],
    type: 'income', isDefault: true,
  },
  {
    id: 'cat_other_income', name: 'Other Income', icon: 'DollarSign', color: '#a7f3d0',
    keywords: ['refund', 'cashback', 'reward', 'rebate', 'reimbursement', 'gift received'],
    type: 'income', isDefault: true,
  },

  // ── Expenses ─────────────────────────────────────────
  {
    id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#f97316',
    keywords: ['woolworths', 'coles', 'aldi', 'iga', 'costco', 'harris farm', 'foodland', 'spar', 'liquorland', 'dans wines', 'bws'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_dining', name: 'Dining & Cafes', icon: 'UtensilsCrossed', color: '#fb923c',
    keywords: ['mcdonald', 'kfc', 'subway', 'domino', 'pizza', 'nandos', 'hungry jacks', 'grill', 'bistro',
      'uber eats', 'doordash', 'menulog', 'deliveroo', 'restaurant', 'cafe', 'coffee', 'thai', 'sushi',
      'ramen', 'burger', 'diner', 'takeaway', 'bakery', 'patisserie', 'espresso', 'barista', 'brunch'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_transport', name: 'Transport', icon: 'Car', color: '#3b82f6',
    keywords: ['uber', 'ola', 'didi', 'taxi', 'opal', 'myki', 'gocard', 'translink', 'bus', 'train', 'metro',
      'tram', 'ferry', 'parking', 'wilsons parking', 'secure parking', 'toll', 'eastlink', 'citylink',
      'bp', 'shell', 'caltex', 'ampol', 'puma', '7-eleven fuel', 'petrol', 'fuel', 'servo'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_health', name: 'Health & Medical', icon: 'HeartPulse', color: '#ef4444',
    keywords: ['chemist warehouse', 'priceline', 'pharmacy', 'chemist', 'doctor', 'hospital', 'dental',
      'dentist', 'medical', 'pathology', 'radiology', 'physio', 'physiotherapy', 'chiro', 'optometrist',
      'medibank', 'bupa', 'nib', 'ahm', 'anytime fitness', 'gym', 'fitness', 'yoga', 'pilates'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_entertainment', name: 'Entertainment', icon: 'Tv', color: '#8b5cf6',
    keywords: ['cinema', 'event cinema', 'hoyts', 'village cinema', 'movie', 'theatre', 'concert',
      'ticketek', 'ticketmaster', 'eventbrite', 'steam', 'playstation', 'xbox', 'nintendo', 'gaming'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_subscriptions', name: 'Subscriptions', icon: 'RefreshCw', color: '#a855f7',
    keywords: ['netflix', 'spotify', 'apple', 'google play', 'amazon prime', 'disney+', 'binge', 'stan',
      'youtube premium', 'icloud', 'dropbox', 'adobe', 'microsoft 365', 'office 365', 'canva',
      'subscription', 'membership', 'audible'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899',
    keywords: ['amazon', 'ebay', 'kmart', 'target', 'big w', 'myer', 'david jones', 'cotton on', 'h&m',
      'zara', 'uniqlo', 'jb hi-fi', 'harvey norman', 'officeworks', 'ikea', 'bunnings', 'adidas', 'nike'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_bills', name: 'Bills & Utilities', icon: 'Zap', color: '#eab308',
    keywords: ['electricity', 'agl', 'origin energy', 'energyaustralia', 'water', 'sydney water',
      'council rates', 'internet', 'aussie broadband', 'superloop', 'iinet', 'tpg', 'telstra',
      'optus', 'vodafone', 'jb wireless', 'phone', 'mobile plan'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_housing', name: 'Rent & Housing', icon: 'Home', color: '#06b6d4',
    keywords: ['rent', 'rental', 'lease', 'strata', 'body corporate', 'council', 'mortgage', 'loan repayment', 'home loan'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_insurance', name: 'Insurance', icon: 'Shield', color: '#94a3b8',
    keywords: ['insurance', 'nrma', 'aami', 'allianz', 'gio', 'racq', 'rac', 'car insurance', 'home insurance', 'life insurance', 'health insurance premium'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#38bdf8',
    keywords: ['university', 'tafe', 'tuition', 'school fees', 'udemy', 'coursera', 'linkedin learning',
      'textbook', 'hecs', 'help debt', 'course', 'workshop', 'training'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_travel', name: 'Travel', icon: 'Plane', color: '#f59e0b',
    keywords: ['qantas', 'jetstar', 'virgin australia', 'tigerair', 'airbnb', 'booking.com', 'hotels.com',
      'trivago', 'expedia', 'flight', 'hotel', 'accommodation', 'hostel', 'resort'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_personal', name: 'Personal Care', icon: 'Sparkles', color: '#f472b6',
    keywords: ['hair', 'salon', 'barber', 'beauty', 'makeup', 'skincare', 'nail', 'spa', 'massage'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_savings', name: 'Savings Transfer', icon: 'PiggyBank', color: '#4ade80',
    keywords: ['transfer to savings', 'savings account', 'ubank', 'macquarie savings', 'ing savings', 'ing direct'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_investments', name: 'Investments', icon: 'BarChart2', color: '#a3e635',
    keywords: ['commsec', 'stake', 'pearler', 'etoro', 'superhero invest', 'selfwealth', 'shares', 'etf',
      'asx', 'vanguard', 'blackrock', 'crypto', 'bitcoin', 'ethereum', 'coinspot', 'smsf', 'super'],
    type: 'expense', isDefault: true,
  },
  {
    id: 'cat_other', name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#64748b',
    keywords: [],
    type: 'both', isDefault: true,
  },
];

export function autoCategorize(description: string, amount: number, overrides: Record<string, string>): string {
  const desc = description.toLowerCase();

  // Check user keyword overrides first
  for (const [kw, catId] of Object.entries(overrides)) {
    if (desc.includes(kw)) return catId;
  }

  // Check built-in keywords
  for (const cat of DEFAULT_CATEGORIES) {
    if (cat.keywords.some(k => desc.includes(k.toLowerCase()))) return cat.id;
  }

  // Fallback by amount sign
  if (amount > 0) return 'cat_other_income';
  return 'cat_other';
}

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  DEFAULT_CATEGORIES.map(c => [c.id, c])
);

export const INCOME_CATEGORY_IDS = DEFAULT_CATEGORIES
  .filter(c => c.type === 'income')
  .map(c => c.id);

export const EXPENSE_CATEGORY_IDS = DEFAULT_CATEGORIES
  .filter(c => c.type === 'expense' || c.type === 'both')
  .map(c => c.id);
