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
  { id: 'wallet_cash', emoji: '💵', label: 'Cash / Wallet', color: '#10B981' },
  { id: 'bank_classic', emoji: '🏦', label: 'Main Bank', color: '#3B82F6' },
  { id: 'vault_savings', emoji: '🛡️', label: 'Savings Vault', color: '#8B5CF6' },
  { id: 'card_platinum', emoji: '💳', label: 'Credit Card', color: '#F43F5E' },
  { id: 'bank_digital', emoji: '🏛️', label: 'Central Bank', color: '#0284C7' },
  { id: 'crypto_coin', emoji: '🪙', label: 'Crypto / Web3', color: '#F59E0B' },
  { id: 'stock_growth', emoji: '📈', label: 'Brokerage', color: '#059669' },
  { id: 'piggy_bank', emoji: '🐷', label: 'Piggy Bank', color: '#EC4899' },
  { id: 'leather_wallet', emoji: '👛', label: 'Leather Pocket', color: '#D97706' },
  { id: 'safe_box', emoji: '🗄️', label: 'Bank Locker / Safe', color: '#475569' },
  { id: 'gold_bars', emoji: '🥇', label: 'Gold & Bullion', color: '#EAB308' },
  { id: 'diamond_asset', emoji: '💎', label: 'Precious Assets', color: '#06B6D4' },
  { id: 'business_briefcase', emoji: '💼', label: 'Business Account', color: '#6366F1' },
  { id: 'mobile_upi', emoji: '📱', label: 'UPI / Mobile Pay', color: '#10B981' },
  { id: 'real_estate', emoji: '🏠', label: 'Property / Mortgage', color: '#8B5CF6' },
  { id: 'emergency_fund', emoji: '🚨', label: 'Emergency Fund', color: '#EF4444' },
  { id: 'pension_fund', emoji: '🏖️', label: 'Retirement / Pension', color: '#14B8A6' },
];

export const DEFAULT_ACCOUNTS = [
  { id: 'acc_wallet', name: 'Cash Wallet', type: 'cash', emoji: '💵', initialBalance: 250, color: '#10B981', icon: 'wallet-outline' },
  { id: 'acc_checking', name: 'Main Checking', type: 'bank', emoji: '🏦', initialBalance: 3200, color: '#3B82F6', icon: 'business-outline' },
  { id: 'acc_savings', name: 'High Yield Savings', type: 'savings', emoji: '🛡️', initialBalance: 8500, color: '#8B5CF6', icon: 'vault-outline' },
  { id: 'acc_credit', name: 'Platinum Card', type: 'card', emoji: '💳', initialBalance: -450, color: '#F43F5E', icon: 'card-outline' },
];

export const getCategoryById = (id, type = 'expense') => {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = list.find((c) => c.id === id);
  if (found) return found;
  const any = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.id === id);
  return any || { id: 'unknown', name: 'General', icon: 'pricetag-outline', emoji: '🏷️', color: '#64748B', bg: '#F1F5F9', gradient: ['#64748B', '#475569'] };
};
