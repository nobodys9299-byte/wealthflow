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

export const generateCSV = (transactions, accounts, categories) => {
  const headers = ['ID', 'Date', 'Type', 'Category', 'Account', 'Amount', 'Title', 'Note'];
  
  const rows = transactions.map((t) => {
    const acc = accounts.find((a) => a.id === t.accountId);
    const cat = categories.find((c) => c.id === t.categoryId);
    const cleanNote = (t.note || '').replace(/"/g, '""');
    const cleanTitle = (t.title || '').replace(/"/g, '""');
    return [
      t.id,
      t.date,
      t.type,
      cat ? cat.name : t.categoryId,
      acc ? acc.name : t.accountId,
      t.amount,
      `"${cleanTitle}"`,
      `"${cleanNote}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const parseCSV = (csvString) => {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];
  
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parser supporting quoted values
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

    if (parts.length >= 6) {
      results.push({
        id: parts[0] || `tx_imported_${Date.now()}_${i}`,
        date: parts[1] || new Date().toISOString().split('T')[0],
        type: parts[2]?.toLowerCase() === 'income' ? 'income' : 'expense',
        categoryId: parts[3]?.toLowerCase() || 'other_exp',
        accountId: parts[4] || 'acc_checking',
        amount: parseFloat(parts[5]) || 0,
        title: parts[6] || 'Imported Transaction',
        note: parts[7] || '',
      });
    }
  }
  return results;
};
