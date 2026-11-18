export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant-outline', emoji: '🍔', color: '#F59E0B', bg: '#FEF3C7', gradient: ['#F59E0B', '#D97706'] },
  { id: 'groceries', name: 'Groceries', icon: 'cart-outline', emoji: '🥦', color: '#10B981', bg: '#D1FAE5', gradient: ['#10B981', '#059669'] },
  { id: 'housing', name: 'Housing & Rent', icon: 'home-outline', emoji: '🏡', color: '#8B5CF6', bg: '#EDE9FE', gradient: ['#8B5CF6', '#7C3AED'] },
  { id: 'transport', name: 'Transport & Fuel', icon: 'car-sport-outline', emoji: '🚗', color: '#3B82F6', bg: '#DBEAFE', gradient: ['#3B82F6', '#2563EB'] },
  { id: 'bills', name: 'Bills & Utilities', icon: 'flash-outline', emoji: '⚡', color: '#EAB308', bg: '#FEF9C3', gradient: ['#EAB308', '#CA8A04'] },
  { id: 'shopping', name: 'Shopping & Clothes', icon: 'bag-handle-outline', emoji: '🛍️', color: '#EC4899', bg: '#FCE7F3', gradient: ['#EC4899', '#DB2777'] },
  { id: 'entertainment', name: 'Entertainment', icon: 'film-outline', emoji: '🎬', color: '#A855F7', bg: '#F3E8FF', gradient: ['#A855F7', '#9333EA'] },
  { id: 'health', name: 'Health & Medical', icon: 'medkit-outline', emoji: '🩺', color: '#14B8A6', bg: '#CCFBF1', gradient: ['#14B8A6', '#0D9488'] },
  { id: 'education', name: 'Education', icon: 'school-outline', emoji: '🎓', color: '#06B6D4', bg: '#CFFAFE', gradient: ['#06B6D4', '#0891B2'] },
  { id: 'travel', name: 'Travel & Vacation', icon: 'airplane-outline', emoji: '✈️', color: '#6366F1', bg: '#E0E7FF', gradient: ['#6366F1', '#4F46E5'] },
  { id: 'personal', name: 'Personal Care', icon: 'sparkles-outline', emoji: '✨', color: '#F43F5E', bg: '#FFE4E6', gradient: ['#F43F5E', '#E11D48'] },
  { id: 'other_exp', name: 'Other Expense', icon: 'ellipsis-horizontal-circle-outline', emoji: '🏷️', color: '#64748B', bg: '#F1F5F9', gradient: ['#64748B', '#475569'] },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salary & Wage', icon: 'cash-outline', emoji: '💰', color: '#10B981', bg: '#D1FAE5', gradient: ['#10B981', '#059669'] },
  { id: 'freelance', name: 'Freelance & Side Gig', icon: 'laptop-outline', emoji: '💻', color: '#059669', bg: '#A7F3D0', gradient: ['#059669', '#047857'] },
  { id: 'investment', name: 'Investments & Dividends', icon: 'trending-up-outline', emoji: '📈', color: '#3B82F6', bg: '#DBEAFE', gradient: ['#3B82F6', '#1D4ED8'] },
  { id: 'business', name: 'Business Profits', icon: 'briefcase-outline', emoji: '🏢', color: '#6366F1', bg: '#E0E7FF', gradient: ['#6366F1', '#4338CA'] },
  { id: 'gifts', name: 'Gifts & Grants', icon: 'gift-outline', emoji: '🎁', color: '#EC4899', bg: '#FCE7F3', gradient: ['#EC4899', '#BE185D'] },
  { id: 'refunds', name: 'Refunds & Cashback', icon: 'refresh-outline', emoji: '🔄', color: '#EAB308', bg: '#FEF9C3', gradient: ['#EAB308', '#A16207'] },
  { id: 'other_inc', name: 'Other Income', icon: 'add-circle-outline', emoji: '💵', color: '#14B8A6', bg: '#CCFBF1', gradient: ['#14B8A6', '#0F766E'] },
];

export const ACCOUNT_ICONS_GALLERY = [
  { id: 'bank_main', emoji: '🏦', label: 'Primary Bank (Blue)', color: '#2563EB' },
  { id: 'bank_national', emoji: '🏛️', label: 'National Bank (Indigo)', color: '#4F46E5' },
  { id: 'bank_corp', emoji: '🏢', label: 'Corporate Bank (Purple)', color: '#7C3AED' },
  { id: 'bank_branch', emoji: '🏧', label: 'ATM & Branch (Emerald)', color: '#059669' },
  { id: 'card_credit', emoji: '💳', label: 'Credit Card (Rose)', color: '#E11D48' },
  { id: 'card_debit', emoji: '💳', label: 'Debit Card (Cyan)', color: '#0891B2' },
  { id: 'bank_online', emoji: '🌐', label: 'Net Banking (Teal)', color: '#0D9488' },
  { id: 'bank_locker', emoji: '🔒', label: 'Bank Locker / Vault (Slate)', color: '#475569' },
  { id: 'bank_reserve', emoji: '🛡️', label: 'Reserve Account (Amber)', color: '#D97706' },
  { id: 'bank_salary', emoji: '📑', label: 'Salary Bank (Sky)', color: '#0284C7' },
  { id: 'bank_current', emoji: '🧾', label: 'Current Account (Violet)', color: '#6366F1' },
  { id: 'cash_reserve', emoji: '💵', label: 'Cash Reserve (Green)', color: '#10B981' },
  { id: 'bank_global', emoji: '🏛️', label: 'Forex / Global Bank (Navy)', color: '#1E3A8A' },
  { id: 'bank_regional', emoji: '🏦', label: 'Regional Bank (Orange)', color: '#EA580C' },
  { id: 'bank_priority', emoji: '🏦', label: 'Priority Wealth (Gold)', color: '#CA8A04' },
  { id: 'bank_digital', emoji: '💳', label: 'Digital Neo-Bank (Fuchsia)', color: '#C026D3' },
];

export const DEFAULT_ACCOUNTS = [
  { id: 'acc_wallet', name: 'Cash Wallet', type: 'cash', emoji: '💵', initialBalance: 250, color: '#10B981', icon: 'wallet-outline' },
  { id: 'acc_checking', name: 'Main Account', type: 'bank', emoji: '🏦', initialBalance: 3200, color: '#3B82F6', icon: 'business-outline' },
  { id: 'acc_savings', name: 'High Yield Savings', type: 'savings', emoji: '🛡️', initialBalance: 8500, color: '#8B5CF6', icon: 'vault-outline' },
  { id: 'acc_credit', name: 'Platinum Card', type: 'card', emoji: '💳', initialBalance: -450, color: '#F43F5E', icon: 'card-outline' },
];

let dynamicCategoriesRegistry = null;

export const setDynamicCategoriesRegistry = (cats) => {
  dynamicCategoriesRegistry = cats;
};

export const getCategoryById = (id, type = 'expense') => {
  if (dynamicCategoriesRegistry) {
    const list = type === 'income' ? dynamicCategoriesRegistry.income : dynamicCategoriesRegistry.expense;
    if (list && Array.isArray(list)) {
      const found = list.find((c) => c.id === id);
      if (found) return found;
    }
    const all = [
      ...(dynamicCategoriesRegistry.expense || []),
      ...(dynamicCategoriesRegistry.income || []),
    ];
    const anyCustom = all.find((c) => c.id === id);
    if (anyCustom) return anyCustom;
  }

  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = list.find((c) => c.id === id);
  if (found) return found;
  const any = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.id === id);
  return any || { id: 'unknown', name: 'General', icon: 'pricetag-outline', emoji: '🏷️', color: '#64748B', bg: '#F1F5F9', gradient: ['#64748B', '#475569'] };
};
