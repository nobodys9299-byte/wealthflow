export const formatCurrency = (amount, symbol = '$') => {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absFormatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${absFormatted}`;
};

// Formats YYYY-MM-DD or Date object strictly into DD/MM/YY (e.g. 09/11/26)
export const formatDateDisplay = (dateString, includeRelative = false) => {
  if (!dateString) return '';
  
  // If in YYYY-MM-DD format
  const parts = String(dateString).split('-');
  if (parts.length === 3) {
    const year = parts[0].slice(-2); // last 2 digits
    const month = String(parts[1]).padStart(2, '0');
    const day = String(parts[2]).padStart(2, '0');

    if (includeRelative) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

      if (dateString === todayStr) return `Today (${day}/${month}/${year})`;
      if (dateString === yestStr) return `Yesterday (${day}/${month}/${year})`;
    }

    return `${day}/${month}/${year}`;
  }

  // Fallback
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
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
      acc ? acc.name : (t.accountId || 'acc_checking'),
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
      `"${(a.name || 'Account').replace(/"/g, '""')}"`,
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
  if (!csvString || typeof csvString !== 'string') {
    return { transactions: [], accounts: [], lending: [] };
  }
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return { transactions: [], accounts: [], lending: [] };

  const transactions = [];
  const accounts = [];
  const lending = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

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
    if (recordType === 'ACCOUNT') {
      accounts.push({
        id: parts[1] || `acc_${Date.now()}_${i}`,
        type: parts[3] || 'bank',
        emoji: parts[4] || '🏦',
        name: (parts[5] || 'Imported Account').replace(/^"|"$/g, ''),
        initialBalance: parseFloat(parts[6]) || 0,
        color: '#3B82F6',
      });
    } else if (recordType === 'LENDING_RECORD') {
      lending.push({
        id: parts[1] || `lend_${Date.now()}_${i}`,
        date: parts[2] || new Date().toISOString().split('T')[0],
        type: parts[3] === 'borrowed' ? 'borrowed' : 'lent',
        friendName: (parts[5] || 'Friend').replace(/^"|"$/g, ''),
        amount: parseFloat(parts[6]) || 0,
        note: (parts[7] || '').replace(/^"|"$/g, ''),
        status: parts[8] || 'pending',
      });
    } else if (parts.length >= 3) {
      // Handles TRANSACTION tagged WealthFlow rows, as well as 3-col and 4-col bank/Excel CSV formats
      const isTagged = recordType === 'TRANSACTION';
      const dateVal = isTagged ? parts[2] : parts[0];
      let typeVal = isTagged ? parts[3] : 'expense';
      const catVal = isTagged ? parts[4] : (parts[3] || 'other_exp');
      const titleVal = isTagged ? parts[5] : parts[1];
      const amtVal = isTagged ? parts[6] : parts[2];
      const noteVal = isTagged ? parts[7] : (parts[4] || '');

      let cleanAmt = parseFloat(String(amtVal || '').replace(/[^0-9.-]/g, '')) || 0;
      if (cleanAmt < 0) {
        typeVal = 'expense';
        cleanAmt = Math.abs(cleanAmt);
      }

      transactions.push({
        id: isTagged && parts[1] ? parts[1] : `tx_${Date.now()}_${i}`,
        date: dateVal || new Date().toISOString().split('T')[0],
        type: (typeVal || '').toLowerCase() === 'income' ? 'income' : 'expense',
        categoryId: (catVal || 'other_exp').toLowerCase().replace(/\s+/g, '_'),
        title: (titleVal || 'Imported Transaction').replace(/^"|"$/g, ''),
        amount: cleanAmt,
        note: (noteVal || '').replace(/^"|"$/g, ''),
        accountId: 'acc_checking',
      });
    }
  }

  return { transactions, accounts, lending };
};

export const generateCSV = generateFullAppCSV;
export const parseCSV = parseFullAppCSV;
