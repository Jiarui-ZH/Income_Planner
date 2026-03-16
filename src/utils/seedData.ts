import type { AppState } from '../types';
import { DEFAULT_CATEGORIES } from './categories';

export const SEED_STATE: AppState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  accounts: [],
  budgetBuckets: [],
  incomeAllocation: {
    framework: 'fifty-thirty-twenty',
    monthlyNetIncome: 0,
    allocations: [],
  },
  savingsGoals: [],
  recurringItems: [],
  importBatches: [],
  settings: {
    currency: 'AUD', currencySymbol: '$',
    payCycle: 'fortnightly', payDay: 1,
    theme: 'dark', monthlyNetIncome: 0,
    annualGrossIncome: 0, superRate: 11.5,
  },
  keywordOverrides: {},
};
