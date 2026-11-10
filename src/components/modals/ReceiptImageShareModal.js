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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';

export const ReceiptImageShareModal = ({
  visible,
  onClose,
  data,
  type = 'transaction', // 'transaction' | 'friend' | 'account'
}) => {
  const { theme, currency, accounts, categories, userUpiSettings } = useFinance();
  const cardRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!visible || !data) return null;

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
          alert('Sharing is not available on this device');
        }
      }
    } catch (e) {
      console.warn('Capture error:', e);
      alert('Could not generate receipt image: ' + (e.message || 'Unknown error'));
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
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
              <Text style={[styles.dialogTitle, { color: theme.text }]}>Share as WhatsApp Image</Text>
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
                        +{formatCurrency(data.totalLent || 0, currency.symbol)}
                      </Text>
                    </View>
                    <View style={styles.summaryCol}>
                      <Text style={styles.summaryColKey}>Total Borrowed</Text>
                      <Text style={[styles.summaryColVal, { color: '#F87171' }]}>
                        -{formatCurrency(data.totalBorrowed || 0, currency.symbol)}
                      </Text>
                    </View>
                  </View>

                  {/* UPI Pay Note if owed */}
                  {userUpiSettings?.upiId && data.balance > 0 && (
                    <View style={styles.upiCard}>
                      <Text style={styles.upiLabel}>Pay Directly via UPI ID:</Text>
                      <Text style={styles.upiIdText}>{userUpiSettings.upiId}</Text>
                    </View>
                  )}

                  {/* Recent transactions list */}
                  <Text style={styles.recentTxHeading}>
                    LENDING LEDGER ({data.transactions?.length || 0} RECORDS)
                  </Text>
                  {(data.transactions || []).slice(0, 4).map((tx, idx) => (
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
                    (data.transactions || []).slice(0, 15).map((tx, idx) => (
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
                    (data.transactions || []).slice(0, 15).map((tx, idx) => (
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

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleShareImage}
              disabled={isCapturing}
              style={[styles.shareWhatsAppBtn, { backgroundColor: '#25D366' }]}
            >
              {isCapturing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                  <Text style={styles.shareWhatsAppText}>Share Image to WhatsApp</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  shareWhatsAppBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  shareWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 15,
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
