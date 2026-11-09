export const formatCurrency = (amount, symbol = '$') => {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absFormatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${absFormatted}`;
};

export const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateString === todayStr) return 'Today';
  if (dateString === yesterdayStr) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

// Generates a comprehensive full-database CSV export
export const generateFullAppCSV = (transactions = [], accounts = [], categories = [], lendingRecords = []) => {
  const headers = ['RecordType', 'ID', 'Date', 'TypeOrFlow', 'CategoryOrAccount', 'TitleOrFriend', 'Amount', 'Note', 'Status'];
  const rows = [];

  // 1. Transactions
  transactions.forEach((t) => {
    const acc = accounts.find((a) => a.id === t.accountId);
    const cat = categories.find((c) => c.id === t.categoryId);
    const cleanNote = (t.note || '').replace(/"/g, '""');
    const cleanTitle = (t.title || '').replace(/"/g, '""');
    rows.push([
      'TRANSACTION',
      t.id,
      t.date,
      t.type,
      cat ? cat.name : t.categoryId,
      `"${cleanTitle}"`,
      t.amount,
      `"${cleanNote}"`,
      acc ? acc.name : t.accountId,
    ].join(','));
  });

  // 2. Accounts
  accounts.forEach((a) => {
    rows.push([
      'ACCOUNT',
      a.id,
      new Date().toISOString().split('T')[0],
      a.type,
      a.emoji || '🏦',
      `"${a.name.replace(/"/g, '""')}"`,
      a.currentBalance !== undefined ? a.currentBalance : a.initialBalance,
      `"Initial: ${a.initialBalance}"`,
      'ACTIVE',
    ].join(','));
  });

  // 3. Lending Records
  lendingRecords.forEach((l) => {
    rows.push([
      'LENDING_RECORD',
      l.id,
      l.date,
      l.type, // 'lent' or 'borrowed'
      'FRIEND_LOAN',
      `"${(l.friendName || '').replace(/"/g, '""')}"`,
      l.amount,
      `"${(l.note || '').replace(/"/g, '""')}"`,
      l.status || 'pending',
    ].join(','));
  });

  return [headers.join(','), ...rows].join('\n');
};

// Parses CSV export back into usable records
export const parseFullAppCSV = (csvString) => {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return { transactions: [], accounts: [], lending: [] };

  const transactions = [];
  const accounts = [];
  const lending = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Quoted CSV parser
    const parts = [];
    let cur = '';
    let inQuotes = false;
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    parts.push(cur.trim());

    const recordType = (parts[0] || '').toUpperCase();
    if (recordType === 'TRANSACTION' || parts.length >= 7) {
      if (recordType === 'ACCOUNT') {
        accounts.push({
          id: parts[1] || `acc_${Date.now()}_${i}`,
          type: parts[3] || 'bank',
          emoji: parts[4] || '🏦',
          name: parts[5] || 'Imported Account',
          initialBalance: parseFloat(parts[6]) || 0,
          color: '#3B82F6',
        });
      } else if (recordType === 'LENDING_RECORD') {
        lending.push({
          id: parts[1] || `lend_${Date.now()}_${i}`,
          date: parts[2] || new Date().toISOString().split('T')[0],
          type: parts[3] === 'borrowed' ? 'borrowed' : 'lent',
          friendName: parts[5] || 'Friend',
          amount: parseFloat(parts[6]) || 0,
          note: parts[7] || '',
          status: parts[8] || 'pending',
        });
      } else {
        transactions.push({
          id: parts[1] || `tx_${Date.now()}_${i}`,
          date: parts[2] || new Date().toISOString().split('T')[0],
          type: parts[3]?.toLowerCase() === 'income' ? 'income' : 'expense',
          categoryId: parts[4]?.toLowerCase().replace(/\s+/g, '_') || 'other_exp',
          title: parts[5] || 'Imported Transaction',
          amount: parseFloat(parts[6]) || 0,
          note: parts[7] || '',
          accountId: 'acc_checking',
        });
      }
    }
  }

  return { transactions, accounts, lending };
};

export const generateCSV = generateFullAppCSV;
export const parseCSV = parseFullAppCSV;
