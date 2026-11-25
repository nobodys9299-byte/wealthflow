import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import QRCode from 'qrcode';
import { Platform } from 'react-native';
import { formatCurrency, formatDateDisplay } from './formatters';

export const encodeUpiParam = (val) =>
  encodeURIComponent(String(val || '').trim()).replace(/%20/g, '+');

export const UPI_HTTPS_BRIDGE_BASE = 'https://nobodys9299-byte.github.io/wealthflow/pay.html';

export const buildUpiPaymentLinks = ({ upiId, payeeName, amount = 0, note = '' }) => {
  const numAmount = Number(amount) || 0;
  const query =
    numAmount > 0
      ? `pa=${encodeUpiParam(upiId)}&cu=INR&pn=${encodeUpiParam(payeeName)}&am=${numAmount.toFixed(2)}&tn=${encodeUpiParam(note)}`
      : `pa=${encodeUpiParam(upiId)}&cu=INR&pn=${encodeUpiParam(payeeName)}&tn=${encodeUpiParam(note)}`;
  return {
    upiUrl: `upi://pay?${query}`,
    httpsBridgeUrl: `${UPI_HTTPS_BRIDGE_BASE}?${query}`,
  };
};

export async function loadPhotoAsBase64DataUri(uri) {
  if (!uri || typeof uri !== 'string') return null;
  if (uri.startsWith('data:image/')) return uri;

  const isPng = uri.toLowerCase().includes('.png');
  const mime = isPng ? 'image/png' : 'image/jpeg';

  if (Platform.OS !== 'web') {
    try {
      const raw = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });
      if (raw) return `data:${mime};base64,${raw}`;
    } catch (_readErr) {
      // Fallback for content:// URIs on Android: copy into cacheDirectory first
      try {
        if (FileSystem.cacheDirectory && FileSystem.copyAsync) {
          const tempPath = `${FileSystem.cacheDirectory}pdf_avatar_${Date.now()}.${isPng ? 'png' : 'jpg'}`;
          await FileSystem.copyAsync({ from: uri, to: tempPath });
          const rawCopied = await FileSystem.readAsStringAsync(tempPath, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
          });
          await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
          if (rawCopied) return `data:${mime};base64,${rawCopied}`;
        }
      } catch (_copyErr) {
        // Ignore copy failure and try fetch fallback below
      }
    }
  }

  try {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    if (typeof FileReader !== 'undefined') {
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (_fetchErr) {
    // Ignore fetch failure
  }

  return null;
}

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const generateTransactionPDF = async (
  transaction,
  category,
  account,
  currencySymbol = '$',
  options = {}
) => {
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

  return await exportAndSharePDF(
    html,
    `receipt_${transaction.id}.pdf`,
    options?.runWithSystemPicker
  );
};

export const generateAccountStatementPDF = async (
  account,
  transactions,
  currencySymbol = '$',
  options = {}
) => {
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

  return await exportAndSharePDF(
    html,
    `statement_${account.name.replace(/\s+/g, '_')}.pdf`,
    options?.runWithSystemPicker
  );
};

export const generateLendingStatementPDF = async (
  friend,
  currencySymbol = '$',
  options = {}
) => {
  const isOwed = (friend?.balance || 0) >= 0;
  const friendName = friend?.name || 'Friend';
  const txs = friend?.transactions || [];
  const targetAmount = Math.abs(parseFloat(friend?.balance) || 0);

  const upiId = (options?.userUpiSettings?.upiId || 'wealthflow@upi').trim();
  const payeeName = (options?.userUpiSettings?.payeeName || 'WealthFlow User').trim();
  const latestNote = txs.find((tx) => tx?.note && tx.note.trim())?.note?.trim();
  const rawNote = friend?.note?.trim() || latestNote || 'Pending balance settlement';
  const cleanNote = (
    rawNote.toLowerCase().startsWith('loan')
      ? rawNote
      : `Loan to ${friendName}: ${rawNote}`
  ).slice(0, 80);

  // Exact UPI deep-link format for QR scanner + HTTPS bridge URL so Google Drive PDF Viewer launches UPI reliably
  const { upiUrl: dynamicUpiUrl, httpsBridgeUrl } = buildUpiPaymentLinks({
    upiId,
    payeeName,
    amount: targetAmount,
    note: cleanNote,
  });

  const resolvedPhotoUri =
    friend?.photoUri ||
    txs.find((tx) => tx?.photoUri)?.photoUri ||
    null;

  let friendPhotoBase64 = null;
  if (resolvedPhotoUri) {
    friendPhotoBase64 = await loadPhotoAsBase64DataUri(resolvedPhotoUri);
  }

  let qrSvg = '';
  try {
    qrSvg = await QRCode.toString(dynamicUpiUrl, {
      type: 'svg',
      width: 110,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (_qrErr) {
    qrSvg = '';
  }

  const friendEmoji = friend?.avatarEmoji || '👤';

  const rows = txs.map((t) => {
    const isLent = t.type === 'lent';
    return `
      <tr>
        <td>${formatDateDisplay(t.date)}</td>
        <td><strong>${escapeHtml(t.note || (isLent ? 'Money Lent' : 'Money Borrowed'))}</strong></td>
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
        <title>Friend Debt Summary - ${escapeHtml(friendName)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 25px; color: #1e293b; background: #fff; -webkit-print-color-adjust: exact; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .brand { font-size: 22px; font-weight: 900; color: #4f46e5; }
          .friend-card { display: flex; align-items: center; gap: 14px; }
          .friend-photo { width: 54px; height: 54px; border-radius: 27px; object-fit: cover; border: 2px solid #3B82F6; }
          .friend-avatar { width: 54px; height: 54px; border-radius: 27px; background: #E2E8F0; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 26px; }
          .hero-box { text-align: center; padding: 20px; background: ${isOwed ? '#ecfdf5' : '#fff1f2'}; border-radius: 16px; margin-bottom: 20px; }
          .hero-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .hero-amount { font-size: 36px; font-weight: 900; color: ${isOwed ? '#059669' : '#e11d48'}; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .pay-box { margin-top: 22px; padding: 16px 18px; background: #F8FAFC; border: 1.5px dashed #0284C7; border-radius: 12px; page-break-inside: avoid; }
          .pay-btn { display: inline-block; background-color: #0284C7; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 0.5px; border: 1px solid #0284C7; }
          .footer { margin-top: 28px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="friend-card">
            ${
              friendPhotoBase64
                ? `<img src="${friendPhotoBase64}" class="friend-photo" alt="${escapeHtml(friendName)}" />`
                : `<div class="friend-avatar">${escapeHtml(friendEmoji)}</div>`
            }
            <div>
              <div class="brand">WealthFlow</div>
              <div style="font-size:16px;font-weight:700;margin-top:2px">Lending Statement with ${escapeHtml(friendName)}</div>
              <div style="font-size:12px;color:#64748b">Generated on ${formatDateDisplay(new Date().toISOString().split('T')[0])} • ${txs.length} records</div>
            </div>
          </div>
        </div>

        <div class="hero-box">
          <div class="hero-title">${isOwed ? `${escapeHtml(friendName)} Owes You` : `You Owe ${escapeHtml(friendName)}`}</div>
          <div class="hero-amount">${formatCurrency(targetAmount, currencySymbol)}</div>
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

        <div class="pay-box">
          <table style="width:100%;border-collapse:collapse;margin:0;">
            <tr>
              <td style="border:none;padding:0 16px 0 0;vertical-align:middle;">
                <div style="font-size:11px;font-weight:800;color:#0284C7;text-transform:uppercase;letter-spacing:0.5px;">⚡ Instant UPI Payment Details</div>
                <div style="font-size:16px;font-weight:800;color:#0F172A;margin-top:3px;">Amount: ${escapeHtml(currencySymbol)}${targetAmount.toFixed(2)}</div>
                <div style="font-size:12px;color:#475569;margin-top:4px;"><strong>UPI ID:</strong> <span style="font-family:monospace;color:#0F172A;">${escapeHtml(upiId)}</span></div>
                <div style="font-size:12px;color:#475569;margin-top:2px;"><strong>Payee:</strong> ${escapeHtml(payeeName)}</div>
                <div style="margin-top:12px;margin-bottom:8px;">
                  <a href="${httpsBridgeUrl}" class="pay-btn">⚡ PAY NOW (${escapeHtml(currencySymbol)}${targetAmount.toFixed(2)}) &rarr;</a>
                </div>
                <div style="font-size:10px;color:#64748B;margin-top:6px;">Tap the blue 'PAY NOW' button to launch your UPI app with amount &amp; details pre-filled, or scan the QR code.</div>
              </td>
              <td style="border:none;padding:0;width:124px;text-align:center;vertical-align:middle;">
                <a href="${httpsBridgeUrl}" style="text-decoration:none;display:inline-block;">
                  <div style="width:110px;height:110px;display:inline-block;border-radius:8px;border:1px solid #CBD5E1;padding:4px;background:#FFFFFF;overflow:hidden;">
                    ${qrSvg}
                  </div>
                  <div style="font-size:9px;font-weight:800;color:#0284C7;margin-top:4px;">SCAN &amp; PAY</div>
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div class="footer">
          Generated with WealthFlow Money Tracker • Shareable via WhatsApp
        </div>
      </body>
    </html>
  `;

  return await exportAndSharePDF(
    html,
    `debt_statement_${friendName.replace(/\s+/g, '_')}.pdf`,
    options?.runWithSystemPicker
  );
};

const exportAndSharePDF = async (html, filename, runWithSystemPicker = null) => {
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

    const printPromise = Print.printToFileAsync({ html });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timed out. Please try again.')), 10000)
    );
    const { uri } = await Promise.race([printPromise, timeoutPromise]);
    if (await Sharing.isAvailableAsync()) {
      const doShare = () =>
        Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share PDF via WhatsApp',
        });
      if (typeof runWithSystemPicker === 'function') {
        await runWithSystemPicker(doShare);
      } else {
        await doShare();
      }
    }
    return { success: true, uri };
  } catch (err) {
    console.error('PDF error:', err);
    return { success: false, error: err?.message || 'Failed to generate PDF' };
  }
};
