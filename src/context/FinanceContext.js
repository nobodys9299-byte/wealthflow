import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeStorage as AsyncStorage } from '../utils/safeStorage';
import { THEMES, CURRENCIES } from '../constants/theme';
import { DEFAULT_ACCOUNTS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_RECURRING } from '../constants/initialData';
import { generateFullAppCSV, parseFullAppCSV } from '../utils/formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: '@spendpulse_transactions_v1',
  ACCOUNTS: '@spendpulse_accounts_v1',
  BUDGETS: '@spendpulse_budgets_v1',
  RECURRING: '@spendpulse_recurring_v1',
  LENDING: '@spendpulse_lending_v1',
  CURRENCY: '@spendpulse_currency_v1',
  THEME_ID: '@spendpulse_theme_id_v2',
  SECURITY: '@spendpulse_security_v1',
  CATEGORIES: '@spendpulse_categories_v2',
  UPI_SETTINGS: '@spendpulse_upi_settings_v1',
  FRIEND_CATEGORIES: '@wealthflow_friend_categories_v1',
};

export const DEFAULT_FRIEND_CATEGORIES = [
  { id: 'fcat_dinner', name: 'Dinner & Food Split', emoji: '🍽️', color: '#F97316' },
  { id: 'fcat_travel', name: 'Travel & Cab', emoji: '🚗', color: '#06B6D4' },
  { id: 'fcat_outing', name: 'Movies & Outing', emoji: '🎬', color: '#8B5CF6' },
  { id: 'fcat_grocery', name: 'Groceries & Supplies', emoji: '🛒', color: '#10B981' },
  { id: 'fcat_rent', name: 'Rent & Bills', emoji: '⚡', color: '#EAB308' },
  { id: 'fcat_cash', name: 'Cash Advance / Loan', emoji: '💵', color: '#3B82F6' },
  { id: 'fcat_gift', name: 'Gifts & Treats', emoji: '🎁', color: '#EC4899' },
  { id: 'fcat_other', name: 'Shared Expense', emoji: '🤝', color: '#64748B' },
];

const INITIAL_LENDING = [
  {
    id: 'lend_1',
    friendName: 'Alex Johnson',
    type: 'lent',
    amount: 150,
    date: new Date().toISOString().split('T')[0],
    note: 'Weekend group dinner bill split',
    friendCategoryId: 'fcat_dinner',
    friendCategoryName: 'Dinner & Food Split',
    status: 'pending',
  },
  {
    id: 'lend_2',
    friendName: 'Sarah Miller',
    type: 'borrowed',
    amount: 45,
    date: new Date().toISOString().split('T')[0],
    note: 'Concert ticket advance',
    friendCategoryId: 'fcat_outing',
    friendCategoryName: 'Movies & Outing',
    status: 'pending',
  },
];

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [lendingRecords, setLendingRecords] = useState([]);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [themeId, setThemeId] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Dedicated Friend Categories (specific only to the Friends tab)
  const [friendCategories, setFriendCategories] = useState(DEFAULT_FRIEND_CATEGORIES);

  // Custom Categories
  const [categories, setCategories] = useState({
    expense: EXPENSE_CATEGORIES,
    income: INCOME_CATEGORIES,
  });

  // User UPI Settings for WhatsApp requests & QR code
  const [userUpiSettings, setUserUpiSettings] = useState({
    upiId: '',
    payeeName: 'WealthFlow User',
    qrCodeUri: '',
  });

  // Security state
  const [securitySettings, setSecuritySettings] = useState({
    enabled: false,
    pin: '1234',
    pinLength: 4,
    biometrics: true,
  });
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [
          savedTx,
          savedAcc,
          savedBudgets,
          savedRecurring,
          savedLending,
          savedCurr,
          savedTheme,
          savedSecurity,
          savedCategories,
          savedUpi,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
          AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS),
          AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
          AsyncStorage.getItem(STORAGE_KEYS.RECURRING),
          AsyncStorage.getItem(STORAGE_KEYS.LENDING),
          AsyncStorage.getItem(STORAGE_KEYS.CURRENCY),
          AsyncStorage.getItem(STORAGE_KEYS.THEME_ID),
          AsyncStorage.getItem(STORAGE_KEYS.SECURITY),
          AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
          AsyncStorage.getItem(STORAGE_KEYS.UPI_SETTINGS),
        ]);

        let loadedTx = INITIAL_TRANSACTIONS;
        if (savedTx) {
          loadedTx = JSON.parse(savedTx);
          setTransactions(loadedTx);
        } else {
          setTransactions(INITIAL_TRANSACTIONS);
          await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
        }

        let loadedAcc = DEFAULT_ACCOUNTS;
        if (savedAcc) {
          loadedAcc = JSON.parse(savedAcc);
          setAccounts(loadedAcc);
        } else {
          setAccounts(DEFAULT_ACCOUNTS);
          await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        }

        if (savedBudgets) {
          setBudgets(JSON.parse(savedBudgets));
        } else {
          setBudgets(INITIAL_BUDGETS);
          await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
        }

        let loadedRecurring = INITIAL_RECURRING;
        if (savedRecurring) {
          loadedRecurring = JSON.parse(savedRecurring);
          setRecurring(loadedRecurring);
        } else {
          setRecurring(INITIAL_RECURRING);
          await AsyncStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(INITIAL_RECURRING));
        }

        if (savedLending) {
          setLendingRecords(JSON.parse(savedLending));
        } else {
          setLendingRecords(INITIAL_LENDING);
          await AsyncStorage.setItem(STORAGE_KEYS.LENDING, JSON.stringify(INITIAL_LENDING));
        }

        if (savedCurr) {
          const parsed = JSON.parse(savedCurr);
          const match = CURRENCIES.find((c) => c.code === parsed.code);
          if (match) setCurrency(match);
        }

        if (savedTheme && THEMES[savedTheme]) {
          setThemeId(savedTheme);
        }

        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        }

        if (savedUpi) {
          setUserUpiSettings(JSON.parse(savedUpi));
        }

        const savedFriendCats = await AsyncStorage.getItem(STORAGE_KEYS.FRIEND_CATEGORIES);
        if (savedFriendCats) {
          setFriendCategories(JSON.parse(savedFriendCats));
        } else {
          setFriendCategories(DEFAULT_FRIEND_CATEGORIES);
        }

        if (savedSecurity) {
          const parsedSec = JSON.parse(savedSecurity);
          setSecuritySettings(parsedSec);
          if (!parsedSec.enabled) {
            setIsAppUnlocked(true);
          }
        } else {
          setIsAppUnlocked(true);
        }

        // Automatic logging of due recurring bills
        checkAndLogRecurringBills(loadedRecurring, loadedTx, loadedAcc);
      } catch (err) {
        console.error('Failed to load local storage data:', err);
        setTransactions(INITIAL_TRANSACTIONS);
        setAccounts(DEFAULT_ACCOUNTS);
        setBudgets(INITIAL_BUDGETS);
        setRecurring(INITIAL_RECURRING);
        setLendingRecords(INITIAL_LENDING);
        setIsAppUnlocked(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Sync state mutations to AsyncStorage
  const persistTransactions = async (newTx) => {
    setTransactions(newTx);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTx));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistAccounts = async (newAcc) => {
    setAccounts(newAcc);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(newAcc));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistBudgets = async (newBudgets) => {
    setBudgets(newBudgets);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(newBudgets));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistRecurring = async (newRec) => {
    setRecurring(newRec);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(newRec));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistLending = async (newLending) => {
    setLendingRecords(newLending);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LENDING, JSON.stringify(newLending));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistCurrency = async (newCurr) => {
    setCurrency(newCurr);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, JSON.stringify(newCurr));
    } catch (e) {
      console.warn(e);
    }
  };

  const changeTheme = async (newThemeId) => {
    if (THEMES[newThemeId]) {
      setThemeId(newThemeId);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME_ID, newThemeId);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const persistCategories = async (newCats) => {
    setCategories(newCats);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCats));
    } catch (e) {
      console.warn(e);
    }
  };

  const addCategory = ({ name, emoji, color, type }) => {
    const cleanType = type === 'income' ? 'income' : 'expense';
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newCat = {
      id,
      name,
      emoji: emoji || '🏷️',
      icon: 'pricetag-outline',
      color: color || '#3B82F6',
      bg: `${color || '#3B82F6'}20`,
      gradient: [color || '#3B82F6', color || '#3B82F6'],
      isCustom: true,
    };
    const updated = {
      ...categories,
      [cleanType]: [...(categories[cleanType] || []), newCat],
    };
    persistCategories(updated);
  };

  const deleteCategory = (type, categoryId) => {
    const cleanType = type === 'income' ? 'income' : 'expense';
    setConfirmDialog({
      visible: true,
      title: 'Delete Category?',
      message: 'Are you sure you want to delete this custom category?',
      onConfirm: () => {
        const updated = {
          ...categories,
          [cleanType]: (categories[cleanType] || []).filter((c) => c.id !== categoryId),
        };
        persistCategories(updated);
      },
    });
  };

  const updateUpiSettings = async (newSettings) => {
    const merged = { ...userUpiSettings, ...newSettings };
    setUserUpiSettings(merged);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.UPI_SETTINGS, JSON.stringify(merged));
    } catch (e) {
      console.warn(e);
    }
  };

  const deleteFriendAccount = (friendName) => {
    setConfirmDialog({
      visible: true,
      title: `Delete Friend Account (${friendName})?`,
      message: `Are you sure you want to delete all loan & debt records for ${friendName}? This clears their balance and removes the contact.`,
      onConfirm: () => {
        const updated = lendingRecords.filter(
          (r) => r.friendName?.toLowerCase() !== friendName?.toLowerCase()
        );
        persistLending(updated);
      },
    });
  };

  const checkAndLogRecurringBills = (recList, currentTxList, accList) => {
    if (!recList || recList.length === 0) return;
    const today = new Date();
    const currentDay = today.getDate();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    let createdTx = [];
    let updatedRec = recList.map((r) => {
      const dueDay = parseInt(r.dayOfMonth || r.dueDay, 10) || 1;
      const lastLogged = r.lastLoggedDate || '';
      const alreadyLoggedThisMonth = lastLogged.startsWith(currentMonthStr);

      if (currentDay >= dueDay && !alreadyLoggedThisMonth) {
        const autoTx = {
          id: `tx_rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: r.type || 'expense',
          amount: parseFloat(r.amount) || 0,
          title: r.title || 'Recurring Bill',
          categoryId: r.categoryId || 'bills',
          accountId: r.accountId || accList[0]?.id || 'acc_checking',
          date: todayStr,
          note: `Auto-logged recurring bill (${r.frequency || 'Monthly'})`,
          isRecurring: true,
        };
        createdTx.push(autoTx);
        return { ...r, lastLoggedDate: todayStr };
      }
      return r;
    });

    if (createdTx.length > 0) {
      persistTransactions([...createdTx, ...currentTxList]);
      persistRecurring(updatedRec);
    }
  };

  const updateSecurity = async (newSettings) => {
    const merged = { ...securitySettings, ...newSettings };
    setSecuritySettings(merged);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(merged));
    } catch (e) {
      console.warn(e);
    }
  };

  // Transaction CRUD with confirmation
  const addTransaction = (tx) => {
    const newTx = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      amount: parseFloat(tx.amount) || 0,
      date: tx.date || new Date().toISOString().split('T')[0],
    };
    const updated = [newTx, ...transactions];
    persistTransactions(updated);
  };

  const editTransaction = (id, updatedFields) => {
    const updated = transactions.map((t) =>
      t.id === id
        ? { ...t, ...updatedFields, amount: parseFloat(updatedFields.amount ?? t.amount) }
        : t
    );
    persistTransactions(updated);
  };

  const requestDeleteTransaction = (id) => {
    const target = transactions.find((t) => t.id === id);
    setConfirmDialog({
      visible: true,
      title: 'Delete Transaction?',
      message: `Are you sure you want to delete "${target ? target.title : 'this transaction'}"? This cannot be undone.`,
      onConfirm: () => {
        const updated = transactions.filter((t) => t.id !== id);
        persistTransactions(updated);
      },
    });
  };

  // Transfer Money between accounts
  const transferMoney = ({ fromAccountId, toAccountId, amount, note, date }) => {
    const transferAmount = parseFloat(amount) || 0;
    if (transferAmount <= 0) return;

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    const fromName = fromAcc ? fromAcc.name : 'Account';
    const toName = toAcc ? toAcc.name : 'Account';

    const txDate = date || new Date().toISOString().split('T')[0];

    const outTx = {
      id: `tx_tr_out_${Date.now()}`,
      type: 'expense',
      title: `Transfer to ${toName}`,
      amount: transferAmount,
      categoryId: 'other_exp',
      accountId: fromAccountId,
      date: txDate,
      note: note || `Transferred to ${toName}`,
      isTransfer: true,
    };

    const inTx = {
      id: `tx_tr_in_${Date.now() + 1}`,
      type: 'income',
      title: `Transfer from ${fromName}`,
      amount: transferAmount,
      categoryId: 'other_inc',
      accountId: toAccountId,
      date: txDate,
      note: note || `Received from ${fromName}`,
      isTransfer: true,
    };

    const updated = [outTx, inTx, ...transactions];
    persistTransactions(updated);
  };

  // Account CRUD with confirmation
  const addAccount = (acc) => {
    const newAcc = {
      ...acc,
      id: `acc_${Date.now()}`,
      initialBalance: parseFloat(acc.initialBalance) || 0,
      emoji: acc.emoji || '🏦',
    };
    persistAccounts([...accounts, newAcc]);
  };

  const editAccount = (id, fields) => {
    const updated = accounts.map((a) =>
      a.id === id
        ? {
            ...a,
            ...fields,
            initialBalance:
              fields.initialBalance !== undefined
                ? parseFloat(fields.initialBalance)
                : a.initialBalance,
          }
        : a
    );
    persistAccounts(updated);
  };

  const requestDeleteAccount = (id) => {
    const target = accounts.find((a) => a.id === id);
    setConfirmDialog({
      visible: true,
      title: 'Delete Account?',
      message: `Are you sure you want to delete the account "${target ? target.name : 'Account'}"?`,
      onConfirm: () => {
        persistAccounts(accounts.filter((a) => a.id !== id));
      },
    });
  };

  // Budget management with confirmation
  const setCategoryBudget = (categoryId, monthlyLimit) => {
    const limit = parseFloat(monthlyLimit) || 0;
    const exists = budgets.find((b) => b.categoryId === categoryId);
    let updated;
    if (exists) {
      if (limit <= 0) {
        updated = budgets.filter((b) => b.categoryId !== categoryId);
      } else {
        updated = budgets.map((b) =>
          b.categoryId === categoryId ? { ...b, monthlyLimit: limit } : b
        );
      }
    } else if (limit > 0) {
      updated = [...budgets, { categoryId, monthlyLimit: limit }];
    } else {
      updated = budgets;
    }
    persistBudgets(updated);
  };

  const requestDeleteBudget = (categoryId) => {
    setConfirmDialog({
      visible: true,
      title: 'Delete Category Budget?',
      message: `Are you sure you want to delete this monthly budget limit?`,
      onConfirm: () => {
        persistBudgets(budgets.filter((b) => b.categoryId !== categoryId));
      },
    });
  };

  // Recurring Transactions with confirmation
  const addRecurring = (item) => {
    const newItem = {
      ...item,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      amount: parseFloat(item.amount) || 0,
      frequency: item.frequency || 'monthly',
      dayOfMonth: parseInt(item.dayOfMonth, 10) || 1,
      type: item.type || 'expense',
      nextDueDate: item.nextDueDate || new Date().toISOString().split('T')[0],
    };
    persistRecurring([...recurring, newItem]);
  };

  const editRecurring = (id, fields) => {
    const updated = recurring.map((r) =>
      r.id === id
        ? {
            ...r,
            ...fields,
            amount: fields.amount !== undefined ? parseFloat(fields.amount) : r.amount,
            dayOfMonth: fields.dayOfMonth !== undefined ? (parseInt(fields.dayOfMonth, 10) || 1) : r.dayOfMonth,
          }
        : r
    );
    persistRecurring(updated);
  };

  const requestDeleteRecurring = (id) => {
    const target = recurring.find((r) => r.id === id);
    setConfirmDialog({
      visible: true,
      title: 'Delete Recurring Item?',
      message: `Delete recurring subscription "${target ? target.title : 'this item'}"?`,
      onConfirm: () => {
        persistRecurring(recurring.filter((r) => r.id !== id));
      },
    });
  };

  // Lending & Borrowing Actions
  const addLendingRecord = (item) => {
    const newRecord = {
      ...item,
      id: `lend_${Date.now()}`,
      amount: parseFloat(item.amount) || 0,
      status: 'pending',
    };
    persistLending([newRecord, ...lendingRecords]);
  };

  const settleFriendDebt = (friendName) => {
    setConfirmDialog({
      visible: true,
      title: `Settle Balance with ${friendName}?`,
      message: `Mark all active loans and borrowings with ${friendName} as fully settled?`,
      onConfirm: () => {
        const updated = lendingRecords.map((r) =>
          r.friendName.toLowerCase() === friendName.toLowerCase()
            ? { ...r, status: 'settled' }
            : r
        );
        persistLending(updated);
      },
    });
  };

  const requestDeleteLendingRecord = (id) => {
    setConfirmDialog({
      visible: true,
      title: 'Delete Loan Record?',
      message: 'Are you sure you want to delete this loan transaction?',
      onConfirm: () => {
        persistLending(lendingRecords.filter((r) => r.id !== id));
      },
    });
  };

  // Friend Category Management (Specific only to Friends tab)
  const addFriendCategory = async (cat) => {
    const newCat = {
      id: `fcat_${Date.now()}`,
      name: cat.name.trim(),
      emoji: cat.emoji || '🤝',
      color: cat.color || '#3B82F6',
    };
    const updated = [...friendCategories, newCat];
    setFriendCategories(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_CATEGORIES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return newCat;
  };

  const deleteFriendCategory = async (id) => {
    const updated = friendCategories.filter((c) => c.id !== id);
    setFriendCategories(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_CATEGORIES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Lending Summary & Friend Groups
  const lendingSummary = useMemo(() => {
    const pending = lendingRecords.filter((r) => r.status === 'pending');
    const totalLent = pending
      .filter((r) => r.type === 'lent')
      .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const totalBorrowed = pending
      .filter((r) => r.type === 'borrowed')
      .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

    const map = {};
    lendingRecords.forEach((r) => {
      const name = r.friendName;
      if (!map[name]) {
        map[name] = {
          name,
          balance: 0,
          pendingCount: 0,
          transactions: [],
        };
      }
      map[name].transactions.push(r);
      if (r.status === 'pending') {
        map[name].pendingCount++;
        const amt = parseFloat(r.amount) || 0;
        if (r.type === 'lent') {
          map[name].balance += amt; // they owe me (+)
        } else {
          map[name].balance -= amt; // I owe them (-)
        }
      }
    });

    const friends = Object.values(map);

    return {
      totalLent,
      totalBorrowed,
      netBalance: totalLent - totalBorrowed,
      friends,
    };
  }, [lendingRecords]);

  // Calculated Account Balances
  const accountsWithBalances = useMemo(() => {
    return accounts.map((acc) => {
      const accTx = transactions.filter((t) => t.accountId === acc.id);
      const totalIncome = accTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const totalExpense = accTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const currentBalance = (parseFloat(acc.initialBalance) || 0) + totalIncome - totalExpense;
      return {
        ...acc,
        currentBalance,
        totalIncome,
        totalExpense,
        txCount: accTx.length,
      };
    });
  }, [accounts, transactions]);

  const netWorth = useMemo(() => {
    return accountsWithBalances.reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [accountsWithBalances]);

  // Current Month Summary
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthTransactions = transactions.filter((t) => t.date && t.date.startsWith(currentYearMonth));

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const saved = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((saved / income) * 100)) : 0;

    return {
      income,
      expense,
      saved,
      savingsRate,
      transactionCount: monthTransactions.length,
      monthName: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [transactions]);

  // Budget calculations with alerts
  const budgetStatusList = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date && t.date.startsWith(currentYearMonth)
    );

    return budgets.map((b) => {
      const spent = monthExpenses
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const percent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      const remaining = Math.max(0, b.monthlyLimit - spent);
      let status = 'safe';
      if (percent >= 100) {
        status = 'exceeded';
      } else if (percent >= 75) {
        status = 'warning';
      }

      return {
        categoryId: b.categoryId,
        limit: b.monthlyLimit,
        spent,
        remaining,
        percent: Math.min(100, Math.round(percent)),
        rawPercent: Math.round(percent),
        status,
      };
    });
  }, [budgets, transactions]);

  // Comprehensive Export & Import (JSON & CSV)
  const exportAsJSON = () => {
    return JSON.stringify(
      {
        version: '3.0',
        exportedAt: new Date().toISOString(),
        currency,
        themeId,
        accounts,
        budgets,
        recurring,
        lendingRecords,
        transactions,
      },
      null,
      2
    );
  };

  const importFromJSON = async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.transactions && Array.isArray(data.transactions)) {
        await persistTransactions(data.transactions);
      }
      if (data.accounts && Array.isArray(data.accounts)) {
        await persistAccounts(data.accounts);
      }
      if (data.budgets && Array.isArray(data.budgets)) {
        await persistBudgets(data.budgets);
      }
      if (data.recurring && Array.isArray(data.recurring)) {
        await persistRecurring(data.recurring);
      }
      if (data.lendingRecords && Array.isArray(data.lendingRecords)) {
        await persistLending(data.lendingRecords);
      }
      if (data.currency) {
        await persistCurrency(data.currency);
      }
      if (data.themeId) {
        await changeTheme(data.themeId);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Complete App CSV Export
  const exportFullCSV = () => {
    const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    return generateFullAppCSV(transactions, accounts, allCategories, lendingRecords);
  };

  // Complete App CSV Import
  const importFromCSV = async (csvText) => {
    try {
      const parsed = parseFullAppCSV(csvText);
      let count = 0;
      if (parsed.transactions.length > 0) {
        await persistTransactions([...parsed.transactions, ...transactions]);
        count += parsed.transactions.length;
      }
      if (parsed.accounts.length > 0) {
        await persistAccounts([...accounts, ...parsed.accounts]);
      }
      if (parsed.lending.length > 0) {
        await persistLending([...parsed.lending, ...lendingRecords]);
        count += parsed.lending.length;
      }
      return { success: true, count };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const requestResetToSampleData = () => {
    setConfirmDialog({
      visible: true,
      title: 'Reset to Sample Data?',
      message: 'This will populate demo transactions, accounts, and friends.',
      onConfirm: async () => {
        await persistTransactions(INITIAL_TRANSACTIONS);
        await persistAccounts(DEFAULT_ACCOUNTS);
        await persistBudgets(INITIAL_BUDGETS);
        await persistRecurring(INITIAL_RECURRING);
        await persistLending(INITIAL_LENDING);
      },
    });
  };

  const requestClearAllData = () => {
    setConfirmDialog({
      visible: true,
      title: 'Clear All Data?',
      message: 'Are you sure you want to erase all your logged transactions, budgets, and lending records? This cannot be undone.',
      onConfirm: async () => {
        await persistTransactions([]);
        await persistBudgets([]);
        await persistRecurring([]);
        await persistLending([]);
      },
    });
  };

  const theme = THEMES[themeId] || THEMES.dark;

  return (
    <FinanceContext.Provider
      value={{
        isLoading,
        theme,
        themeId,
        changeTheme,
        currency,
        setCurrency: persistCurrency,
        transactions,
        addTransaction,
        editTransaction,
        deleteTransaction: requestDeleteTransaction,
        accounts: accountsWithBalances,
        rawAccounts: accounts,
        addAccount,
        editAccount,
        deleteAccount: requestDeleteAccount,
        transferMoney,
        budgets,
        budgetStatusList,
        setCategoryBudget,
        deleteCategoryBudget: requestDeleteBudget,
        recurring,
        addRecurring,
        editRecurring,
        deleteRecurring: requestDeleteRecurring,
        lendingRecords,
        lendingSummary,
        addLendingRecord,
        settleFriendDebt,
        deleteFriendAccount,
        deleteLendingRecord: requestDeleteLendingRecord,
        // Dedicated Friend Categories (Friends tab only)
        friendCategories,
        addFriendCategory,
        deleteFriendCategory,
        // Categories Management
        categories,
        addCategory,
        deleteCategory,
        // UPI Settings for WhatsApp requests
        userUpiSettings,
        updateUpiSettings,
        // Recurring processing
        processDueRecurringTransactions: () => checkAndLogRecurringBills(recurring, transactions, accounts),
        netWorth,
        currentMonthStats,
        exportAsJSON,
        importFromJSON,
        exportCSVString: exportFullCSV,
        importFromCSV,
        resetToSampleData: requestResetToSampleData,
        clearAllData: requestClearAllData,
        // Security
        securitySettings,
        updateSecurity,
        isAppUnlocked,
        setIsAppUnlocked,
        // Confirmation dialog
        confirmDialog,
        closeConfirmDialog: () => setConfirmDialog((prev) => ({ ...prev, visible: false })),
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return ctx;
};
