export const formatCurrency = (amount, symbol = '$') => {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absFormatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${absFormatted}`;
};

// Formats YYYY-MM-DD or Date object strictly into DD/MM/YY (e.g. 18/11/26)
export const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const str = String(dateString).trim();
  
  // If strictly in YYYY-MM-DD format (no time component)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-');
    const year = parts[0].slice(-2);
    const month = String(parts[1]).padStart(2, '0');
    const day = String(parts[2]).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Fallback for Date objects or ISO strings
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Formats date and time into clear, beautiful, human-readable format
export const formatDateTimeDisplay = (isoOrDate) => {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return String(isoOrDate);

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = monthNames[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${monthStr} ${year}, ${timeStr}`;
};

const csvEscape = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  const singleLine = str.replace(/\r\n|\r|\n/g, ' ');
  return `"${singleLine.replace(/"/g, '""')}"`;
};

const parseCSVLine = (line) => {
  const parts = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      if (cur === '') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur.trim());
  return parts;
};

const safeParseMetaJSON = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_e) {
    return null;
  }
};

// Generates a comprehensive full-database CSV export (Transactions, Accounts, Categories, Friend Categories, Lending, Budgets, Recurring)
export const generateFullAppCSV = (
  transactions = [],
  accounts = [],
  categoriesOrObj = [],
  lendingRecords = [],
  extra = {}
) => {
  const headers = [
    'RecordType',
    'ID',
    'Date',
    'TypeOrFlow',
    'CategoryOrAccount',
    'TitleOrFriend',
    'Amount',
    'Note',
    'Status',
    'AccountOrExtra',
    'MetaJSON',
  ];
  const rows = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const fullCats =
    extra?.fullCategories && typeof extra.fullCategories === 'object'
      ? extra.fullCategories
      : categoriesOrObj && !Array.isArray(categoriesOrObj) && typeof categoriesOrObj === 'object'
      ? categoriesOrObj
      : null;

  const expenseCategories = Array.isArray(fullCats?.expense) ? fullCats.expense : [];
  const incomeCategories = Array.isArray(fullCats?.income) ? fullCats.income : [];
  const flatCategories = Array.isArray(categoriesOrObj)
    ? categoriesOrObj
    : [...expenseCategories, ...incomeCategories];

  const friendCategories = Array.isArray(extra?.friendCategories) ? extra.friendCategories : [];
  const budgets = Array.isArray(extra?.budgets) ? extra.budgets : [];
  const recurring = Array.isArray(extra?.recurring) ? extra.recurring : [];

  // 1. Transactions
  transactions.forEach((t) => {
    const acc = accounts.find((a) => a.id === t.accountId);
    const cat = flatCategories.find((c) => c.id === t.categoryId);
    const meta = {
      categoryId: t.categoryId || 'other_exp',
      accountId: t.accountId || 'acc_checking',
      isTransfer: Boolean(t.isTransfer),
      isRecurring: Boolean(t.isRecurring),
    };
    rows.push(
      [
        'TRANSACTION',
        t.id,
        t.date || todayStr,
        t.type || 'expense',
        csvEscape(cat ? cat.name : t.categoryId),
        csvEscape(t.title || ''),
        t.amount || 0,
        csvEscape(t.note || ''),
        csvEscape(acc ? acc.name : t.accountId || 'acc_checking'),
        csvEscape(t.accountId || 'acc_checking'),
        csvEscape(JSON.stringify(meta)),
      ].join(',')
    );
  });

  // 2. Accounts
  accounts.forEach((a) => {
    const initialBal = a.initialBalance !== undefined ? a.initialBalance : 0;
    const meta = {
      id: a.id,
      type: a.type || 'bank',
      emoji: a.emoji || '🏦',
      color: a.color || '#3B82F6',
      initialBalance: initialBal,
      includeInNetWorth: a.includeInNetWorth !== false,
    };
    rows.push(
      [
        'ACCOUNT',
        a.id,
        todayStr,
        a.type || 'bank',
        a.emoji || '🏦',
        csvEscape(a.name || 'Account'),
        a.currentBalance !== undefined ? a.currentBalance : initialBal,
        csvEscape(`Initial: ${initialBal}`),
        'ACTIVE',
        csvEscape(a.color || '#3B82F6'),
        csvEscape(JSON.stringify(meta)),
      ].join(',')
    );
  });

  // 3. Expense & Income Categories
  const exportCategoryRows = (list, kind) => {
    list.forEach((c) => {
      if (!c || !c.id) return;
      const meta = {
        id: c.id,
        kind,
        name: c.name,
        emoji: c.emoji || '🏷️',
        icon: c.icon || 'pricetag-outline',
        color: c.color || '#3B82F6',
        bg: c.bg || `${c.color || '#3B82F6'}20`,
        gradient: Array.isArray(c.gradient) ? c.gradient : [c.color || '#3B82F6', c.color || '#3B82F6'],
        isCustom: Boolean(c.isCustom),
      };
      rows.push(
        [
          'CATEGORY',
          c.id,
          todayStr,
          kind,
          csvEscape(c.emoji || '🏷️'),
          csvEscape(c.name || 'Category'),
          0,
          csvEscape(c.color || '#3B82F6'),
          c.isCustom ? 'CUSTOM' : 'DEFAULT',
          csvEscape(c.icon || 'pricetag-outline'),
          csvEscape(JSON.stringify(meta)),
        ].join(',')
      );
    });
  };
  if (expenseCategories.length > 0 || incomeCategories.length > 0) {
    exportCategoryRows(expenseCategories, 'expense');
    exportCategoryRows(incomeCategories, 'income');
  } else {
    flatCategories.forEach((c) => {
      const guessedKind = c.type === 'income' || String(c.id || '').includes('inc') || ['salary', 'freelance', 'investment', 'gift'].includes(c.id) ? 'income' : 'expense';
      exportCategoryRows([c], guessedKind);
    });
  }

  // 4. Friend Categories
  friendCategories.forEach((fc) => {
    if (!fc || !fc.id) return;
    const meta = {
      id: fc.id,
      name: fc.name,
      emoji: fc.emoji || '🤝',
      color: fc.color || '#3B82F6',
    };
    rows.push(
      [
        'FRIEND_CATEGORY',
        fc.id,
        todayStr,
        'friend',
        csvEscape(fc.emoji || '🤝'),
        csvEscape(fc.name || 'Friend Category'),
        0,
        csvEscape(fc.color || '#3B82F6'),
        'ACTIVE',
        '',
        csvEscape(JSON.stringify(meta)),
      ].join(',')
    );
  });

  // 5. Monthly Budgets
  budgets.forEach((b) => {
    if (!b || !b.categoryId) return;
    const cat = flatCategories.find((c) => c.id === b.categoryId);
    const meta = {
      categoryId: b.categoryId,
      monthlyLimit: parseFloat(b.monthlyLimit) || 0,
    };
    rows.push(
      [
        'BUDGET',
        b.categoryId,
        todayStr,
        'monthly',
        csvEscape(cat ? cat.name : b.categoryId),
        csvEscape(cat ? `${cat.name} Budget` : 'Monthly Budget'),
        parseFloat(b.monthlyLimit) || 0,
        '',
        'ACTIVE',
        csvEscape(b.categoryId),
        csvEscape(JSON.stringify(meta)),
      ].join(',')
    );
  });

  // 6. Recurring Bills & Subscriptions
  recurring.forEach((r) => {
    if (!r || !r.id) return;
    const cat = flatCategories.find((c) => c.id === r.categoryId);
    const meta = {
      id: r.id,
      title: r.title,
      amount: parseFloat(r.amount) || 0,
      type: r.type || 'expense',
      categoryId: r.categoryId || 'bills',
      accountId: r.accountId || 'acc_checking',
      frequency: r.frequency || 'monthly',
      dayOfMonth: r.dayOfMonth || 1,
      nextDueDate: r.nextDueDate || todayStr,
      lastLoggedDate: r.lastLoggedDate || null,
    };
    rows.push(
      [
        'RECURRING',
        r.id,
        r.nextDueDate || todayStr,
        r.type || 'expense',
        csvEscape(cat ? cat.name : r.categoryId || 'bills'),
        csvEscape(r.title || 'Recurring Bill'),
        parseFloat(r.amount) || 0,
        csvEscape(`Frequency: ${r.frequency || 'monthly'}`),
        r.frequency || 'monthly',
        csvEscape(r.accountId || 'acc_checking'),
        csvEscape(JSON.stringify(meta)),
      ].join(',')
    );
  });

  // 7. Lending / Friend Tab Records
  lendingRecords.forEach((l) => {
    const meta = {
      friendCategoryId: l.friendCategoryId || null,
      friendCategoryName: l.friendCategoryName || null,
      friendCategoryEmoji: l.friendCategoryEmoji || null,
      avatarEmoji: l.avatarEmoji || null,
      photoUri: l.photoUri || null,
      settledDate: l.settledDate || null,
    };
    rows.push(
      [
        'LENDING_RECORD',
        l.id,
        l.date || todayStr,
        l.type === 'borrowed' ? 'borrowed' : 'lent',
        csvEscape(l.friendCategoryName || 'FRIEND_LOAN'),
        csvEscape(l.friendName || ''),
        parseFloat(l.amount) || 0,
        csvEscape(l.note || ''),
        l.status || 'pending',
        csvEscape(l.friendCategoryId || ''),
        csvEscape(JSON.stringify(meta)),
      ].join(',')
    );
  });

  return [headers.join(','), ...rows].join('\n');
};

// Parses CSV export back into usable records
export const parseFullAppCSV = (csvString) => {
  const emptyResult = {
    transactions: [],
    accounts: [],
    lending: [],
    budgets: [],
    recurring: [],
    categories: { expense: [], income: [] },
    friendCategories: [],
  };

  if (!csvString || typeof csvString !== 'string') {
    return emptyResult;
  }

  const normalized = csvString.replace(/^\uFEFF/, '').trim();
  const lines = normalized.split(/\r?\n/);
  if (lines.length < 2) return emptyResult;

  const transactions = [];
  const accounts = [];
  const lending = [];
  const budgets = [];
  const recurring = [];
  const categories = { expense: [], income: [] };
  const friendCategories = [];

  // Track dynamic name->id lookup maps so legacy or user-edited CSVs still match cleanly
  const accountNameToId = {};
  const categoryNameToId = {};

  const parsedRows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    parsedRows.push({ index: i, parts: parseCSVLine(line) });
  }

  // Pass 1: Accounts, Categories, Friend Categories, Budgets, Recurring, Lending
  parsedRows.forEach(({ index: i, parts }) => {
    const recordType = (parts[0] || '').toUpperCase();
    const meta = safeParseMetaJSON(parts[10]) || safeParseMetaJSON(parts[9]) || {};

    if (recordType === 'ACCOUNT') {
      let parsedInitial = meta.initialBalance;
      if (parsedInitial === undefined || parsedInitial === null) {
        const initMatch = String(parts[7] || '').match(/initial:\s*(-?[\d.]+)/i);
        parsedInitial = initMatch ? parseFloat(initMatch[1]) : parseFloat(parts[6]);
      }
      const acc = {
        id: parts[1] || meta.id || `acc_${Date.now()}_${i}`,
        type: meta.type || parts[3] || 'bank',
        emoji: meta.emoji || parts[4] || '🏦',
        name: parts[5] || 'Imported Account',
        initialBalance: Number.isFinite(parseFloat(parsedInitial)) ? parseFloat(parsedInitial) : 0,
        color: meta.color || (parts[9] && parts[9].startsWith('#') ? parts[9] : '#3B82F6'),
        includeInNetWorth: meta.includeInNetWorth !== false,
      };
      accounts.push(acc);
      if (acc.name) accountNameToId[acc.name.trim().toLowerCase()] = acc.id;
    } else if (recordType === 'CATEGORY') {
      const kind = (meta.kind || parts[3] || '').toLowerCase() === 'income' ? 'income' : 'expense';
      const color = meta.color || (parts[7] && parts[7].startsWith('#') ? parts[7] : '#3B82F6');
      const cat = {
        id: meta.id || parts[1] || `cat_${Date.now()}_${i}`,
        name: meta.name || parts[5] || 'Category',
        emoji: meta.emoji || parts[4] || '🏷️',
        icon: meta.icon || parts[9] || 'pricetag-outline',
        color,
        bg: meta.bg || `${color}20`,
        gradient: Array.isArray(meta.gradient) ? meta.gradient : [color, color],
        isCustom: meta.isCustom !== undefined ? Boolean(meta.isCustom) : parts[8] === 'CUSTOM',
      };
      categories[kind].push(cat);
      if (cat.name) categoryNameToId[cat.name.trim().toLowerCase()] = cat.id;
    } else if (recordType === 'FRIEND_CATEGORY') {
      friendCategories.push({
        id: meta.id || parts[1] || `fcat_${Date.now()}_${i}`,
        name: meta.name || parts[5] || 'Shared Expense',
        emoji: meta.emoji || parts[4] || '🤝',
        color: meta.color || (parts[7] && parts[7].startsWith('#') ? parts[7] : '#3B82F6'),
      });
    } else if (recordType === 'BUDGET') {
      const categoryId = meta.categoryId || parts[1] || parts[9];
      const monthlyLimit = parseFloat(meta.monthlyLimit !== undefined ? meta.monthlyLimit : parts[6]) || 0;
      if (categoryId && monthlyLimit > 0) {
        budgets.push({ categoryId, monthlyLimit });
      }
    } else if (recordType === 'RECURRING') {
      recurring.push({
        id: meta.id || parts[1] || `rec_${Date.now()}_${i}`,
        title: meta.title || parts[5] || 'Recurring Bill',
        amount: parseFloat(meta.amount !== undefined ? meta.amount : parts[6]) || 0,
        type: (meta.type || parts[3] || '').toLowerCase() === 'income' ? 'income' : 'expense',
        categoryId: meta.categoryId || 'bills',
        accountId: meta.accountId || parts[9] || 'acc_checking',
        frequency: meta.frequency || parts[8] || 'monthly',
        dayOfMonth: parseInt(meta.dayOfMonth, 10) || 1,
        nextDueDate: meta.nextDueDate || parts[2] || new Date().toISOString().split('T')[0],
        ...(meta.lastLoggedDate ? { lastLoggedDate: meta.lastLoggedDate } : {}),
      });
    } else if (recordType === 'LENDING_RECORD') {
      const rec = {
        id: parts[1] || `lend_${Date.now()}_${i}`,
        date: parts[2] || new Date().toISOString().split('T')[0],
        type: parts[3] === 'borrowed' ? 'borrowed' : 'lent',
        friendName: parts[5] || 'Friend',
        amount: parseFloat(parts[6]) || 0,
        note: parts[7] || '',
        status: parts[8] || 'pending',
        ...(meta.friendCategoryId || parts[9] ? { friendCategoryId: meta.friendCategoryId || parts[9] } : {}),
        ...(meta.friendCategoryName ? { friendCategoryName: meta.friendCategoryName } : {}),
        ...(meta.friendCategoryEmoji ? { friendCategoryEmoji: meta.friendCategoryEmoji } : {}),
        ...(meta.avatarEmoji ? { avatarEmoji: meta.avatarEmoji } : {}),
        ...(meta.photoUri ? { photoUri: meta.photoUri } : {}),
        ...(meta.settledDate ? { settledDate: meta.settledDate } : {}),
      };
      lending.push(rec);
    }
  });

  // Pass 2: Transactions (using MetaJSON + lookup maps from Pass 1)
  parsedRows.forEach(({ index: i, parts }) => {
    const recordType = (parts[0] || '').toUpperCase();
    if (
      recordType === 'ACCOUNT' ||
      recordType === 'CATEGORY' ||
      recordType === 'FRIEND_CATEGORY' ||
      recordType === 'BUDGET' ||
      recordType === 'RECURRING' ||
      recordType === 'LENDING_RECORD'
    ) {
      return;
    }

    if (parts.length >= 3) {
      const isTagged = recordType === 'TRANSACTION';
      const meta = safeParseMetaJSON(parts[10]) || {};
      const dateVal = isTagged ? parts[2] : parts[0];
      let typeVal = isTagged ? parts[3] : 'expense';
      const catVal = isTagged ? parts[4] : parts[3] || 'other_exp';
      const titleVal = isTagged ? parts[5] : parts[1];
      const amtVal = isTagged ? parts[6] : parts[2];
      const noteVal = isTagged ? parts[7] : parts[4] || '';

      let cleanAmt = parseFloat(String(amtVal || '').replace(/[^0-9.-]/g, '')) || 0;
      if (cleanAmt < 0) {
        typeVal = 'expense';
        cleanAmt = Math.abs(cleanAmt);
      }

      const resolvedCategoryId =
        meta.categoryId ||
        categoryNameToId[String(catVal || '').trim().toLowerCase()] ||
        (catVal || 'other_exp').toLowerCase().replace(/\s+/g, '_');

      const resolvedAccountId =
        meta.accountId ||
        (isTagged && parts[9] && !parts[9].startsWith('{') ? parts[9] : null) ||
        accountNameToId[String((isTagged ? parts[8] : '') || '').trim().toLowerCase()] ||
        'acc_checking';

      transactions.push({
        id: isTagged && parts[1] ? parts[1] : `tx_${Date.now()}_${i}`,
        date: dateVal || new Date().toISOString().split('T')[0],
        type: (typeVal || '').toLowerCase() === 'income' ? 'income' : 'expense',
        categoryId: resolvedCategoryId,
        title: titleVal || 'Imported Transaction',
        amount: cleanAmt,
        note: noteVal || '',
        accountId: resolvedAccountId,
        ...(meta.isTransfer ? { isTransfer: true } : {}),
        ...(meta.isRecurring ? { isRecurring: true } : {}),
      });
    }
  });

  return {
    transactions,
    accounts,
    lending,
    budgets,
    recurring,
    categories,
    friendCategories,
  };
};

export const generateCSV = generateFullAppCSV;
export const parseCSV = parseFullAppCSV;
