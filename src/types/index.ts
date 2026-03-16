export type TransactionType = 'income' | 'expense' | 'transfer';
export type PayCycle = 'weekly' | 'fortnightly' | 'monthly';
export type BudgetFramework = 'fifty-thirty-twenty' | 'pay-yourself-first' | 'zero-based' | 'custom';
export type RecurringFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annual';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment';

export interface TransactionSplit {
  id: string;
  categoryId: string;
  amount: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  originalDescription?: string;
  amount: number; // positive = income, negative = expense
  categoryId: string;
  accountId: string;
  type: TransactionType;
  tags: string[];
  notes: string;
  isRecurring: boolean;
  recurringId?: string;
  importBatchId?: string;
  splits?: TransactionSplit[];
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hex
  keywords: string[];
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  isActive: boolean;
  institution?: string;
}

export interface BudgetBucket {
  id: string;
  name: string;
  color: string;
  icon: string;
  categoryIds: string[];
  monthlyLimit: number;
  rollover: boolean;
  order: number;
}

export interface AllocationItem {
  bucketId: string;
  percent: number;
}

export interface IncomeAllocation {
  framework: BudgetFramework;
  monthlyNetIncome: number;
  allocations: AllocationItem[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color: string;
  completed: boolean;
  completedDate?: string;
  createdAt: string;
  notes?: string;
}

export interface RecurringItem {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  nextExpectedDate: string;
  lastSeenDate?: string;
  active: boolean;
  type: TransactionType;
  linkedTransactionIds: string[];
}

export interface ImportBatch {
  id: string;
  filename: string;
  importedAt: string;
  transactionCount: number;
  accountId: string;
  dateFrom: string;
  dateTo: string;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  payCycle: PayCycle;
  payDay: number;
  theme: 'dark' | 'light';
  monthlyNetIncome: number;
  annualGrossIncome: number;
  superRate: number;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgetBuckets: BudgetBucket[];
  incomeAllocation: IncomeAllocation;
  savingsGoals: SavingsGoal[];
  recurringItems: RecurringItem[];
  importBatches: ImportBatch[];
  settings: AppSettings;
  keywordOverrides: Record<string, string>;
}
