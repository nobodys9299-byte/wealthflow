import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { formatCurrency, formatDateDisplay } from './formatters';

export const generateTransactionPDF = async (transaction, category, account, currencySymbol = '$') => {
  const isIncome = transaction.type === 'income';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Transaction Receipt</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
          .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
          .amount-box { text-align: center; margin: 30px 0; padding: 20px; background: ${isIncome ? '#ecfdf5' : '#fff1f2'}; border-radius: 16px; }
          .amount-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
          .amount { font-size: 38px; font-weight: 900; color: ${isIncome ? '#059669' : '#e11d48'}; margin-top: 6px; }
          .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .details-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .label { color: #64748b; font-weight: 600; width: 35%; }
          .value { font-weight: 700; color: #0f172a; text-align: right; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background: #f1f5f9; color: #334155; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">WealthFlow</div>
          <div class="sub">Official Transaction Receipt • Generated on ${formatDateDisplay(new Date().toISOString().split('T')[0])}</div>
        </div>

        <div class="amount-box">
          <div class="amount-label">${isIncome ? 'Payment Received' : 'Expense Recorded'}</div>
          <div class="amount">${isIncome ? '+' : '-'}${formatCurrency(transaction.amount, currencySymbol)}</div>
        </div>

        <table class="details-table">
          <tr>
            <td class="label">Title / Merchant</td>
            <td class="value">${transaction.title}</td>
          </tr>
          <tr>
            <td class="label">Category</td>
            <td class="value"><span class="badge">${category?.name || 'General'}</span></td>
          </tr>
          <tr>
            <td class="label">Account / Wallet</td>
            <td class="value">${account?.name || 'Default Account'}</td>
          </tr>
          <tr>
            <td class="label">Date</td>
            <td class="value">${formatDateDisplay(transaction.date)}</td>
          </tr>
          <tr>
            <td class="label">Transaction ID</td>
            <td class="value" style="font-family: monospace; font-size: 12px;">${transaction.id}</td>
          </tr>
          ${transaction.note ? `<tr><td class="label">Notes</td><td class="value">${transaction.note}</td></tr>` : ''}
          <tr>
            <td class="label">Status</td>
            <td class="value" style="color: #059669;">Verified & Logged</td>
          </tr>
        </table>

        <div class="footer">
          Recorded in WealthFlow Money Tracker • Designed for personal financial clarity
        </div>
      </body>
    </html>
  `;

  return await exportAndSharePDF(html, `receipt_${transaction.id}.pdf`);
};

export const generateAccountStatementPDF = async (account, transactions, currencySymbol = '$') => {
  const accTx = transactions.filter((t) => t.accountId === account.id);
  const totalIncome = accTx.filter((t) => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const totalExpense = accTx.filter((t) => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const currentBalance = (parseFloat(account.initialBalance) || 0) + totalIncome - totalExpense;

  const rows = accTx.map((t) => {
    const isInc = t.type === 'income';
    return `
      <tr>
        <td>${formatDateDisplay(t.date)}</td>
        <td><strong>${t.title}</strong><br><span style="font-size:11px;color:#64748b">${t.note || t.categoryId}</span></td>
        <td><span style="font-size:12px;background:#f1f5f9;padding:2px 8px;border-radius:4px">${t.categoryId}</span></td>
        <td style="text-align:right; font-weight:800; color:${isInc ? '#059669' : '#e11d48'}">
          ${isInc ? '+' : '-'}${formatCurrency(t.amount, currencySymbol)}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Account Statement - ${account.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 25px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .brand { font-size: 22px; font-weight: 900; color: #4f46e5; }
          .acc-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 5px; }
          .meta { font-size: 12px; color: #64748b; }
          .summary-cards { display: flex; gap: 12px; margin-bottom: 25px; }
          .card { flex: 1; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
          .card-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .card-value { font-size: 18px; font-weight: 900; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">WealthFlow</div>
            <div class="acc-title">${account.name} Statement</div>
            <div class="meta">${account.type?.toUpperCase()} ACCOUNT • As of ${new Date().toLocaleDateString()}</div>
          </div>
          <div style="text-align:right">
            <div class="meta">Total Records</div>
            <div style="font-size:18px;font-weight:800">${accTx.length} Transactions</div>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-label">Current Balance</div>
            <div class="card-value" style="color:#0f172a">${formatCurrency(currentBalance, currencySymbol)}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Inflows</div>
            <div class="card-value" style="color:#059669">+${formatCurrency(totalIncome, currencySymbol)}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Outflows</div>
            <div class="card-value" style="color:#e11d48">-${formatCurrency(totalExpense, currencySymbol)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:18%">Date</th>
              <th style="width:45%">Description</th>
              <th style="width:17%">Category</th>
              <th style="width:20%; text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px">No transactions recorded</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by WealthFlow Money Tracker • Shareable Statement
        </div>
      </body>
    </html>
  `;

  return await exportAndSharePDF(html, `statement_${account.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateLendingStatementPDF = async (friend, currencySymbol = '$') => {
  const isOwed = friend.balance >= 0;
  const rows = (friend.transactions || []).map((t) => {
    const isLent = t.type === 'lent';
    return `
      <tr>
        <td>${formatDateDisplay(t.date)}</td>
        <td><strong>${t.note || (isLent ? 'Money Lent' : 'Money Borrowed')}</strong></td>
        <td><span style="font-size:11px;padding:3px 8px;border-radius:4px;background:${isLent ? '#ecfdf5' : '#fff1f2'};color:${isLent ? '#059669' : '#e11d48'};font-weight:700">${isLent ? 'LENT' : 'BORROWED'}</span></td>
        <td style="text-align:right; font-weight:800; color:${isLent ? '#059669' : '#e11d48'}">
          ${formatCurrency(t.amount, currencySymbol)}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Friend Debt Summary - ${friend.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 25px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .brand { font-size: 22px; font-weight: 900; color: #4f46e5; }
          .hero-box { text-align: center; padding: 20px; background: ${isOwed ? '#ecfdf5' : '#fff1f2'}; border-radius: 16px; margin-bottom: 20px; }
          .hero-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .hero-amount { font-size: 36px; font-weight: 900; color: ${isOwed ? '#059669' : '#e11d48'}; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">WealthFlow</div>
          <div style="font-size:16px;font-weight:700;margin-top:4px">Lending Statement with ${friend.name}</div>
          <div style="font-size:12px;color:#64748b">Generated on ${formatDateDisplay(new Date().toISOString().split('T')[0])}</div>
        </div>

        <div class="hero-box">
          <div class="hero-title">${isOwed ? `${friend.name} Owes You` : `You Owe ${friend.name}`}</div>
          <div class="hero-amount">${formatCurrency(Math.abs(friend.balance), currencySymbol)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:20%">Date</th>
              <th style="width:45%">Description</th>
              <th style="width:15%">Type</th>
              <th style="width:20%; text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px">No debt transactions recorded</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated with WealthFlow Money Tracker • Shareable via WhatsApp
        </div>
      </body>
    </html>
  `;

  return await exportAndSharePDF(html, `debt_statement_${friend.name.replace(/\s+/g, '_')}.pdf`);
};

const exportAndSharePDF = async (html, filename) => {
  try {
    if (Platform.OS === 'web') {
      // In web browser, print dialog or opens printable window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
      return { success: true };
    }

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share PDF via WhatsApp',
      });
    }
    return { success: true, uri };
  } catch (err) {
    console.error('PDF error:', err);
    alert('Failed to generate PDF: ' + err.message);
    return { success: false, error: err.message };
  }
};
