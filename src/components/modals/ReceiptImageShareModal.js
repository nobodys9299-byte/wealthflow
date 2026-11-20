import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import QRCode from 'qrcode';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { getCategoryById } from '../../constants/categories';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const ReceiptImageShareModal = ({
  visible,
  onClose,
  data,
  type = 'transaction', // 'transaction' | 'friend' | 'account'
}) => {
  const { theme, currency, accounts, categories, userUpiSettings, t } = useFinance();
  const cardRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);

  if (!visible || !data) return null;

  const targetAmount = Math.abs(parseFloat(data?.amount !== undefined ? data.amount : (data?.balance !== undefined ? data.balance : 0))) || 0;
  const upiId = userUpiSettings?.upiId || 'wealthflow@upi';
  const payeeName = userUpiSettings?.payeeName || 'WealthFlow';
  const txTitle = data?.title || data?.note || data?.name || 'WealthFlow Payment';
  const upiLink = targetAmount > 0
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${targetAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(txTitle)}`
    : `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
  const pdfPayLink = targetAmount > 0
    ? `https://upi.pe/${upiId}/${targetAmount.toFixed(2)}?pn=${encodeURIComponent(payeeName)}&cu=INR&tn=${encodeURIComponent(txTitle)}`
    : `https://upi.pe/${upiId}?pn=${encodeURIComponent(payeeName)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&margin=2`;

  const friendTxs = data?.transactions || [];
  const totalLentAmount = friendTxs.length > 0
    ? friendTxs.filter((t) => t.type === 'lent').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
    : (parseFloat(data?.totalLent) || 0);
  const totalBorrowedAmount = friendTxs.length > 0
    ? friendTxs.filter((t) => t.type === 'borrowed').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
    : (parseFloat(data?.totalBorrowed) || 0);

  const handleShareImage = async () => {
    try {
      setIsCapturing(true);

      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Receipt Image to WhatsApp',
            UTI: 'public.png',
          });
        } else {
          setModalAlert({ title: 'Sharing Notice', message: 'Sharing is not available on this device', type: 'info' });
        }
      }
    } catch (e) {
      console.warn('Capture error:', e);
      setModalAlert({ title: 'Receipt Error', message: 'Could not generate receipt image: ' + (e.message || 'Unknown error'), type: 'danger' });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportA4Pdf = async () => {
    try {
      setIsGeneratingPdf(true);

      // Generate vector SVG QR code offline (pure JS in memory, no remote HTTP request)
      let qrSvg = '';
      try {
        qrSvg = await QRCode.toString(upiLink, {
          type: 'svg',
          width: 115,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
      } catch (qrErr) {
        console.warn('QR SVG generation fallback:', qrErr);
      }

      const title = type === 'friend'
        ? `Lending Statement - ${data.name || 'Friend'}`
        : type === 'account'
        ? `Account Statement - ${data.name || 'Account'}`
        : type === 'category'
        ? `Category Statement - ${data.name || data.categoryId}`
        : `Transaction Receipt - ${data.title || 'Record'}`;

      const txs = data.transactions || (type === 'transaction' ? [data] : []);

      const rowsHtml = txs.map((tx, idx) => {
        const isLent = tx.type === 'lent';
        const isIncome = tx.type === 'income';
        const isPositive = isLent || isIncome;
        const color = isPositive ? '#10B981' : '#EF4444';
        const sign = isPositive ? '+' : '-';
        const catName = tx.friendCategoryName || tx.categoryName || (tx.categoryId ? getCategoryById(tx.categoryId, tx.type)?.name : '') || tx.type?.toUpperCase() || '-';
        const desc = tx.title || tx.note || (isLent ? 'Money Lent' : 'Money Borrowed');

        return `
          <tr style="border-bottom: 1px solid #E2E8F0; page-break-inside: avoid;">
            <td style="padding: 10px 8px; font-size: 11px; color: #64748B;">#${idx + 1}</td>
            <td style="padding: 10px 8px; font-size: 12px; font-weight: 600; color: #1E293B;">${formatDateDisplay(tx.date)}</td>
            <td style="padding: 10px 8px; font-size: 12px; font-weight: 500; color: #334155;">${desc}</td>
            <td style="padding: 10px 8px; font-size: 11px; color: #64748B;">${catName}</td>
            <td style="padding: 10px 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748B;">${tx.type || '-'}</td>
            <td style="padding: 10px 8px; font-size: 13px; font-weight: 700; text-align: right; color: ${color};">
              ${sign}${formatCurrency(tx.amount, currency.symbol)}
            </td>
          </tr>
        `;
      }).join('');

      const balanceText = type === 'friend'
        ? `${data.balance >= 0 ? 'Owed to you: +' : 'You owe: -'}${formatCurrency(Math.abs(data.balance || 0), currency.symbol)}`
        : type === 'account'
        ? `Balance: ${formatCurrency(data.currentBalance !== undefined ? data.currentBalance : data.balance || 0, currency.symbol)}`
        : type === 'category'
        ? `Total Spent/Received: ${formatCurrency(data.totalAmount || data.amount || 0, currency.symbol)}`
        : `Amount: ${formatCurrency(data.amount, currency.symbol)}`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #0F172A;
                margin: 0;
                padding: 0;
                background-color: #FFFFFF;
                -webkit-print-color-adjust: exact;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0F172A;
                padding-bottom: 14px;
                margin-bottom: 20px;
              }
              .brand {
                font-size: 20px;
                font-weight: 900;
                letter-spacing: 1px;
                color: #0F172A;
              }
              .doc-type {
                font-size: 11px;
                font-weight: 800;
                background-color: #0F172A;
                color: #FFFFFF;
                padding: 4px 10px;
                border-radius: 4px;
                letter-spacing: 0.5px;
              }
              .meta-box {
                background-color: #F8FAFC;
                border: 1px solid #E2E8F0;
                border-radius: 8px;
                padding: 14px 18px;
                margin-bottom: 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .meta-title {
                font-size: 18px;
                font-weight: 800;
                color: #0F172A;
              }
              .meta-sub {
                font-size: 12px;
                color: #64748B;
                margin-top: 4px;
              }
              .meta-bal {
                font-size: 20px;
                font-weight: 900;
                color: #0F172A;
                text-align: right;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th {
                background-color: #F1F5F9;
                color: #475569;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 10px 8px;
                text-align: left;
                border-bottom: 2px solid #CBD5E1;
              }
              .footer {
                margin-top: 20px;
                border-top: 1px solid #E2E8F0;
                padding-top: 12px;
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #94A3B8;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">WEALTHFLOW FINANCE</div>
              <div class="doc-type">${type.toUpperCase()} STATEMENT</div>
            </div>

            <div class="meta-box">
              <div>
                <div class="meta-title">${data.name || data.title || 'Statement'}</div>
                <div class="meta-sub">Generated on ${formatDateDisplay(new Date().toISOString().split('T')[0])} • ${txs.length} total records</div>
              </div>
              <div class="meta-bal">${balanceText}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 35px;">#</th>
                  <th style="width: 85px;">Date</th>
                  <th>Description / Note</th>
                  <th style="width: 120px;">Category</th>
                  <th style="width: 75px;">Type</th>
                  <th style="width: 110px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94A3B8;">No records found</td></tr>'}
              </tbody>
            </table>

            <!-- Instant UPI Payment Details with Payment Link & Dynamic QR Code -->
            <div style="margin-top: 20px; padding: 16px 18px; background-color: #F8FAFC; border: 1.5px dashed #0284C7; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; page-break-inside: avoid;">
              <div style="flex: 1; padding-right: 18px;">
                <div style="font-size: 11px; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Instant UPI Payment Details</div>
                <div style="font-size: 16px; font-weight: 800; color: #0F172A; margin-top: 3px;">Amount: ${currency.symbol}${targetAmount.toFixed(2)}</div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px;"><strong>UPI ID:</strong> <span style="font-family: monospace; color: #0F172A;">${upiId}</span></div>
                <div style="font-size: 12px; color: #475569; margin-top: 2px;"><strong>Payee:</strong> ${payeeName}</div>
                <div style="margin-top: 12px; margin-bottom: 8px;">
                  <a href="${pdfPayLink}" target="_blank" style="display: inline-block; background-color: #0284C7; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 0.5px; border: 1px solid #0284C7; cursor: pointer;">
                    ⚡ PAY NOW (${currency.symbol}${targetAmount.toFixed(2)}) &rarr;
                  </a>
                </div>
                <div style="font-size: 10px; color: #64748B; margin-top: 6px;">Tap 'PAY NOW' to open the secure UPI payment page, or scan the QR code directly with Google Pay, PhonePe, or Paytm.</div>
              </div>
              <div style="text-align: center;">
                <a href="${pdfPayLink}" target="_blank" style="text-decoration: none; display: inline-block;">
                  <div style="width: 115px; height: 115px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #CBD5E1; padding: 4px; background: #FFFFFF; overflow: hidden;">
                    ${qrSvg || `<img src="${qrCodeUrl}" width="115" height="115" onerror="this.style.display='none'" alt="UPI QR" />`}
                  </div>
                  <div style="font-size: 9px; font-weight: 800; color: #0284C7; margin-top: 4px;">SCAN &amp; PAY</div>
                </a>
              </div>
            </div>

            <div class="footer">
              <div>WealthFlow Personal Finance App</div>
              <div>All transactions included • Valid Financial Statement</div>
            </div>
          </body>
        </html>
      `;

      const printPromise = Print.printToFileAsync({ html });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timed out. Please try again.')), 10000)
      );
      const { uri } = await Promise.race([printPromise, timeoutPromise]);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${title} (A4 PDF)`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        setModalAlert({ title: 'Sharing Notice', message: 'Sharing is not available on this device', type: 'info' });
      }
    } catch (e) {
      console.warn('PDF export error:', e);
      setModalAlert({ title: 'PDF Export Error', message: 'Could not export PDF: ' + (e.message || 'Unknown error'), type: 'danger' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        <View style={[styles.dialogCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Drag / Grab Bar Pill for Uniform Presentation */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.dialogHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.shareIconBadge, { backgroundColor: '#25D36625' }]}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </View>
              <Text style={[styles.dialogTitle, { color: theme.text }]}>
                {t('share_as_image', 'Share as WhatsApp Image')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* The Actual Rendered Card that gets captured into a PNG image */}
            <View
              ref={cardRef}
              collapsable={false}
              style={[
                styles.captureCard,
                {
                  backgroundColor: '#0F172A', // Slate 900 for premium contrast
                  borderColor: '#334155',
                },
              ]}
            >
              {/* Brand Header */}
              <View style={styles.receiptBrandRow}>
                <View style={styles.brandLeft}>
                  <View style={styles.brandIcon}>
                    <Ionicons name="wallet" size={16} color="#38BDF8" />
                  </View>
                  <Text style={styles.brandText}>WEALTHFLOW FINANCE</Text>
                </View>
                <Text style={styles.receiptTypeTag}>
                  {type === 'transaction'
                    ? 'RECEIPT'
                    : type === 'friend'
                    ? 'LENDING STATEMENT'
                    : type === 'category'
                    ? 'CATEGORY STATEMENT'
                    : 'ACCOUNT STATEMENT'}
                </Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* 1. Transaction Card Layout */}
              {type === 'transaction' && (
                <View style={styles.receiptBody}>
                  <Text style={styles.receiptLabel}>TRANSACTION AMOUNT</Text>
                  <Text
                    style={[
                      styles.amountText,
                      { color: data.type === 'income' ? '#34D399' : '#F87171' },
                    ]}
                  >
                    {data.type === 'income' ? '+' : '-'}
                    {formatCurrency(data.amount, currency.symbol)}
                  </Text>

                  <Text style={styles.titleText}>{data.title}</Text>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Date</Text>
                      <Text style={styles.metaVal}>{formatDateDisplay(data.date)}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Flow Type</Text>
                      <Text style={styles.metaVal}>{data.type?.toUpperCase()}</Text>
                    </View>

                    {data.accountId && (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaKey}>Wallet / Account</Text>
                        <Text style={styles.metaVal}>
                          {accounts.find((a) => a.id === data.accountId)?.name || 'Main Account'}
                        </Text>
                      </View>
                    )}

                    {data.note ? (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaKey}>Note</Text>
                        <Text style={styles.metaVal}>{data.note}</Text>
                      </View>
                    ) : null}

                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Status</Text>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text style={styles.verifiedText}>Recorded & Verified</Text>
                      </View>
                    </View>
                  </View>

                  {/* Instant UPI Payment Box & Dynamic QR */}
                  <View style={styles.paymentBox}>
                    <View style={styles.paymentBoxHeader}>
                      <Ionicons name="flash" size={13} color="#38BDF8" />
                      <Text style={styles.paymentBoxHeaderTitle}>INSTANT UPI PAYMENT</Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <View style={styles.paymentDetailsCol}>
                        <Text style={styles.paymentAmountLabel}>Amount to Pay</Text>
                        <Text style={styles.paymentAmountValue}>
                          {currency.symbol}{targetAmount.toFixed(2)}
                        </Text>
                        <Text style={styles.paymentUpiLabel}>UPI ID: <Text style={styles.paymentUpiText}>{upiId}</Text></Text>
                        <Text style={styles.paymentPayeeLabel}>Payee: <Text style={styles.paymentUpiText}>{payeeName}</Text></Text>
                        <Text style={styles.paymentScanHint}>Scan QR with Google Pay, PhonePe, or Paytm to pay</Text>
                      </View>
                      <View style={styles.qrCol}>
                        <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                        <Text style={styles.qrTag}>SCAN & PAY</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* 2. Friend Lending Statement Layout */}
              {type === 'friend' && (
                <View style={styles.receiptBody}>
                  <Text style={styles.receiptLabel}>CONTACT STATEMENT</Text>
                  <Text style={styles.friendName}>{data.name}</Text>

                  <View
                    style={[
                      styles.friendBalanceBox,
                      {
                        backgroundColor:
                          data.balance === 0
                            ? '#33415540'
                            : data.balance > 0
                            ? '#065F4640'
                            : '#991B1B40',
                      },
                    ]}
                  >
                    <Text style={styles.balanceStatusLabel}>
                      {data.balance === 0
                        ? 'FULLY SETTLED'
                        : data.balance > 0
                        ? 'OWES YOU MONEY'
                        : 'YOU OWE THIS CONTACT'}
                    </Text>
                    <Text
                      style={[
                        styles.friendBalanceVal,
                        {
                          color:
                            data.balance === 0
                              ? '#94A3B8'
                              : data.balance > 0
                              ? '#34D399'
                              : '#F87171',
                        },
                      ]}
                    >
                      {data.balance === 0 ? '' : data.balance > 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(data.balance), currency.symbol)}
                    </Text>
                  </View>

                  {/* Summary row */}
                  <View style={styles.friendSummaryRow}>
                    <View style={styles.summaryCol}>
                      <Text style={styles.summaryColKey}>Total Lent</Text>
                      <Text style={[styles.summaryColVal, { color: '#34D399' }]}>
                        +{formatCurrency(totalLentAmount, currency.symbol)}
                      </Text>
                    </View>
                    <View style={styles.summaryCol}>
                      <Text style={styles.summaryColKey}>Total Borrowed</Text>
                      <Text style={[styles.summaryColVal, { color: '#F87171' }]}>
                        -{formatCurrency(totalBorrowedAmount, currency.symbol)}
                      </Text>
                    </View>
                  </View>

                  {/* Instant UPI Payment Box & Dynamic QR */}
                  {targetAmount > 0 && (
                    <View style={styles.paymentBox}>
                      <View style={styles.paymentBoxHeader}>
                        <Ionicons name="flash" size={13} color="#38BDF8" />
                        <Text style={styles.paymentBoxHeaderTitle}>INSTANT UPI PAYMENT</Text>
                      </View>
                      <View style={styles.paymentRow}>
                        <View style={styles.paymentDetailsCol}>
                          <Text style={styles.paymentAmountLabel}>Amount Due / Settle</Text>
                          <Text style={styles.paymentAmountValue}>
                            {currency.symbol}{targetAmount.toFixed(2)}
                          </Text>
                          <Text style={styles.paymentUpiLabel}>UPI ID: <Text style={styles.paymentUpiText}>{upiId}</Text></Text>
                          <Text style={styles.paymentPayeeLabel}>Payee: <Text style={styles.paymentUpiText}>{payeeName}</Text></Text>
                          <Text style={styles.paymentScanHint}>Scan QR with Google Pay, PhonePe, or Paytm to pay</Text>
                        </View>
                        <View style={styles.qrCol}>
                          <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                          <Text style={styles.qrTag}>SCAN & PAY</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Recent transactions list */}
                  <Text style={styles.recentTxHeading}>
                    LENDING LEDGER ({data.transactions?.length || 0} RECORDS)
                  </Text>
                  {(data.transactions || []).map((tx, idx) => (
                    <View key={`tx_${idx}`} style={styles.ledgerRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.ledgerNote} numberOfLines={1}>
                          {tx.friendCategoryEmoji ? `${tx.friendCategoryEmoji} ` : ''}{tx.note || (tx.type === 'lent' ? 'Money Lent' : 'Money Borrowed')}
                        </Text>
                        <Text style={styles.ledgerDate}>
                          {formatDateDisplay(tx.date)} • {tx.friendCategoryName ? `${tx.friendCategoryName} • ` : ''}{tx.type?.toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ledgerAmt,
                          { color: tx.type === 'lent' ? '#34D399' : '#F87171' },
                        ]}
                      >
                        {tx.type === 'lent' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency.symbol)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 3. Account Statement Layout with Full Transaction Ledger */}
              {type === 'account' && (
                <View style={styles.receiptBody}>
                  <Text style={styles.receiptLabel}>WALLET / ACCOUNT STATEMENT</Text>
                  <Text style={styles.friendName}>
                    {data.emoji ? `${data.emoji} ` : ''}{data.name}
                  </Text>
                  <Text style={[styles.amountText, { color: '#38BDF8', marginTop: 4 }]}>
                    {formatCurrency(data.currentBalance !== undefined ? data.currentBalance : data.balance || 0, currency.symbol)}
                  </Text>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Account Type</Text>
                      <Text style={styles.metaVal}>{data.type?.toUpperCase() || 'WALLET'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Total Inflows</Text>
                      <Text style={[styles.metaVal, { color: '#34D399' }]}>
                        +{formatCurrency(data.totalIncome || data.inflows || 0, currency.symbol)}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Total Outflows</Text>
                      <Text style={[styles.metaVal, { color: '#F87171' }]}>
                        -{formatCurrency(data.totalExpense || data.outflows || 0, currency.symbol)}
                      </Text>
                    </View>
                  </View>

                  {/* Account Transactions Ledger */}
                  <Text style={styles.recentTxHeading}>
                    ACCOUNT TRANSACTIONS ({data.transactions?.length || 0} RECORDS)
                  </Text>
                  {(data.transactions || []).length === 0 ? (
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontStyle: 'italic', marginVertical: 4 }}>
                      No transactions recorded in this account yet.
                    </Text>
                  ) : (
                    (data.transactions || []).map((tx, idx) => (
                      <View key={`acc_tx_${idx}`} style={styles.ledgerRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.ledgerNote} numberOfLines={1}>
                            {tx.title || tx.note || 'Transaction'}
                          </Text>
                          <Text style={styles.ledgerDate}>
                            {formatDateDisplay(tx.date)} • {tx.type?.toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.ledgerAmt,
                            { color: tx.type === 'income' ? '#34D399' : '#F87171' },
                          ]}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, currency.symbol)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* 4. Category Statement Layout with Full Transaction Ledger */}
              {type === 'category' && (
                <View style={styles.receiptBody}>
                  <Text style={styles.receiptLabel}>CATEGORY STATEMENT</Text>
                  <Text style={styles.friendName}>
                    {data.emoji ? `${data.emoji} ` : ''}{data.name || data.categoryId}
                  </Text>
                  <Text
                    style={[
                      styles.amountText,
                      { color: data.type === 'income' ? '#34D399' : '#F87171', marginTop: 4 },
                    ]}
                  >
                    {data.type === 'income' ? '+' : '-'}
                    {formatCurrency(data.totalAmount || data.amount || 0, currency.symbol)}
                  </Text>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Category Type</Text>
                      <Text style={styles.metaVal}>
                        {data.type === 'income' ? 'Income Stream' : 'Expense Category'}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Total Records</Text>
                      <Text style={styles.metaVal}>{data.transactions?.length || 0} Transactions</Text>
                    </View>
                  </View>

                  {/* Category Transactions Ledger */}
                  <Text style={styles.recentTxHeading}>
                    ALL CATEGORY TRANSACTIONS ({data.transactions?.length || 0} RECORDS)
                  </Text>
                  {(data.transactions || []).length === 0 ? (
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontStyle: 'italic', marginVertical: 4 }}>
                      No transactions recorded in this category yet.
                    </Text>
                  ) : (
                    (data.transactions || []).map((tx, idx) => (
                      <View key={`cat_tx_${idx}`} style={styles.ledgerRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.ledgerNote} numberOfLines={1}>
                            {tx.title || tx.note || 'Record'}
                          </Text>
                          <Text style={styles.ledgerDate}>
                            {formatDateDisplay(tx.date)} • {accounts.find((a) => a.id === tx.accountId)?.name || 'Wallet'}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.ledgerAmt,
                            { color: tx.type === 'income' ? '#34D399' : '#F87171' },
                          ]}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, currency.symbol)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Footer */}
              <View style={styles.receiptFooter}>
                <Text style={styles.footerDate}>
                  Generated on {formatDateDisplay(new Date().toISOString().split('T')[0])}
                </Text>
                <Text style={styles.footerWatermark}>WealthFlow • Personal Finance Tracker</Text>
              </View>
            </View>

            {/* Action Buttons: WhatsApp Image & Multi-Page A4 PDF Export */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                onPress={handleShareImage}
                disabled={isCapturing || isGeneratingPdf}
                style={[styles.shareWhatsAppBtn, { backgroundColor: '#25D366' }]}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                    <Text style={styles.shareWhatsAppText}>{t('share_image', 'Share Image')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportA4Pdf}
                disabled={isCapturing || isGeneratingPdf}
                style={[styles.exportPdfBtn, { backgroundColor: theme.primary }]}
              >
                {isGeneratingPdf ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={18} color="#FFF" />
                    <Text style={styles.exportPdfText}>{t('export_a4_pdf', 'Export A4 PDF')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Photo 2 Styled Dialog for In-Modal Alerts */}
        <ConfirmDeleteModal
          useModal={false}
          visible={!!modalAlert}
          onClose={() => setModalAlert(null)}
          onConfirm={() => setModalAlert(null)}
          title={modalAlert?.title || 'Notice'}
          message={modalAlert?.message || ''}
          type={modalAlert?.type || 'info'}
          showCancel={false}
          confirmText="OK"
          confirmIcon={modalAlert?.type === 'success' ? 'checkmark-circle-outline' : modalAlert?.type === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dialogCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  shareIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 10,
    alignItems: 'center',
  },
  captureCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  receiptBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#0284C725',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  receiptTypeTag: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  receiptBody: {
    alignItems: 'center',
  },
  receiptLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  titleText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  metaGrid: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaKey: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  metaVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  friendName: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  friendBalanceBox: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  balanceStatusLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  friendBalanceVal: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  friendSummaryRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColKey: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  summaryColVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  paymentBox: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#38BDF850',
  },
  paymentBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  paymentBoxHeaderTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  paymentDetailsCol: {
    flex: 1,
  },
  paymentAmountLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  paymentAmountValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  paymentUpiLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  paymentPayeeLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  paymentUpiText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  paymentScanHint: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 13,
  },
  qrCol: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 10,
  },
  qrImage: {
    width: 95,
    height: 95,
  },
  qrTag: {
    color: '#0F172A',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  upiCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF840',
  },
  upiLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  upiIdText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  recentTxHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginTop: 14,
    marginBottom: 6,
  },
  ledgerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  ledgerNote: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  ledgerDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  ledgerAmt: {
    fontSize: 12,
    fontWeight: '800',
  },
  receiptFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerDate: {
    color: '#64748B',
    fontSize: 10,
  },
  footerWatermark: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  shareWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  exportPdfBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exportPdfText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shareOtherBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  shareOtherText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
