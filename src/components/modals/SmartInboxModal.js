import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryById } from '../../constants/categories';
import { parseBankMessage, SAMPLE_BANK_MESSAGES } from '../../utils/smsParser';

export const SmartInboxModal = ({ visible, onClose }) => {
  const { theme, currency, accounts, addTransaction } = useFinance();

  const [pendingList, setPendingList] = useState([
    parseBankMessage(SAMPLE_BANK_MESSAGES[0].body, SAMPLE_BANK_MESSAGES[0].source),
    parseBankMessage(SAMPLE_BANK_MESSAGES[1].body, SAMPLE_BANK_MESSAGES[1].source),
    parseBankMessage(SAMPLE_BANK_MESSAGES[2].body, SAMPLE_BANK_MESSAGES[2].source),
  ].filter(Boolean));

  const [customText, setCustomText] = useState('');
  const [showTester, setShowTester] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  // Auto-detect copied bank SMS from clipboard when inbox modal opens
  useEffect(() => {
    if (visible) {
      (async () => {
        try {
          const hasStr = await Clipboard.hasStringAsync();
          if (hasStr) {
            const clipText = await Clipboard.getStringAsync();
            if (clipText && clipText.trim().length > 10) {
              const lower = clipText.toLowerCase();
              const isBankLike = ['debited', 'credited', 'spent', 'paid', 'vpa', 'upi', 'inr', 'rs.', 'a/c', 'account', 'card', 'bank'].some((k) => lower.includes(k));
              if (isBankLike) {
                const parsed = parseBankMessage(clipText.trim(), 'Copied Bank SMS');
                if (parsed && parsed.amount > 0) {
                  setPendingList((prev) => {
                    if (prev.some((p) => p.rawText === parsed.rawText)) return prev;
                    return [parsed, ...prev];
                  });
                }
              }
            }
          }
        } catch (e) {
          // ignore background clipboard check issues
        }
      })();
    }
  }, [visible]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text || !text.trim()) {
        alert('Your clipboard is empty! Copy any bank SMS alert from your SMS or bank notification, then tap this button.');
        return;
      }
      const parsed = parseBankMessage(text.trim(), 'SMS Clipboard');
      if (parsed && parsed.amount > 0) {
        setPendingList((prev) => {
          if (prev.some((p) => p.rawText === parsed.rawText)) {
            alert('This SMS is already in your pending queue below!');
            return prev;
          }
          return [parsed, ...prev];
        });
        alert(`Success! Detected ${currency.symbol}${parsed.amount} at "${parsed.title}".\n\nReview, edit, or approve below.`);
      } else {
        setCustomText(text.trim());
        setShowTester(true);
        alert('Copied text pasted into input box below. Check the amount and adjust if needed.');
      }
    } catch (err) {
      alert('Could not read clipboard: ' + err.message);
    }
  };

  const handleApproveAll = () => {
    if (pendingList.length === 0) return;
    pendingList.forEach((item) => {
      addTransaction({
        type: item.type,
        amount: item.amount,
        title: item.title,
        categoryId: item.categoryId,
        accountId: item.accountId || accounts[0]?.id || 'acc_checking',
        date: item.date,
        note: `Auto-fetched from ${item.source}`,
      });
    });
    setPendingList([]);
    alert(`Added all ${pendingList.length} transactions to your Home Tab transaction history!`);
  };

  const handleApprove = (item) => {
    addTransaction({
      type: item.type,
      amount: item.amount,
      title: item.title,
      categoryId: item.categoryId,
      accountId: item.accountId || accounts[0]?.id || 'acc_checking',
      date: item.date,
      note: `Auto-fetched from ${item.source}`,
    });

    setPendingList((prev) => prev.filter((p) => p.id !== item.id));
    alert(`Success! "${item.title}" (${currency.symbol}${item.amount}) has been moved to your Transaction History in Home tab.`);
  };

  const handleSaveAndMoveToHistory = () => {
    if (!editingItem) return;
    const parsedAmount = parseFloat(editingItem.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    addTransaction({
      type: editingItem.type || 'expense',
      amount: parsedAmount,
      title: editingItem.title?.trim() || 'Bank Transaction',
      categoryId: editingItem.categoryId || 'other',
      accountId: editingItem.accountId || accounts[0]?.id || 'acc_checking',
      date: editingItem.date || new Date().toISOString().split('T')[0],
      note: `Detected from ${editingItem.source || 'Bank SMS'}`,
    });

    setPendingList((prev) => prev.filter((p) => p.id !== editingItem.id));
    const titleSaved = editingItem.title || 'Transaction';
    setEditingItem(null);
    alert(`Success! "${titleSaved}" (${currency.symbol}${parsedAmount}) has been moved to your Transaction History in Home tab.`);
  };

  const handleDismiss = (id) => {
    setPendingList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleParseCustom = () => {
    if (!customText.trim()) return;
    const parsed = parseBankMessage(customText.trim(), 'Manual Bank SMS');
    if (parsed && parsed.amount > 0) {
      setPendingList((prev) => [parsed, ...prev]);
      setCustomText('');
      setShowTester(false);
    } else {
      alert('Could not detect amount in this message. Example: "$52.00 debited at Starbucks"');
    }
  };

  const handleLoadSamples = () => {
    const fresh = SAMPLE_BANK_MESSAGES.map((s) => parseBankMessage(s.body, s.source)).filter(Boolean);
    setPendingList(fresh);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Drag / Grab Bar Pill for Uniform Presentation */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Ionicons name="mail-unread-outline" size={22} color={theme.primaryLight} />
                <Text style={[styles.title, { color: theme.text }]}>SMS & Bank Inbox</Text>
              </View>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {pendingList.length} transactions pending your approval
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Permissions / Privacy Status Banner */}
          <View style={[styles.permBanner, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
            <View style={styles.permCol}>
              <View style={styles.permBadge}>
                <Ionicons name="sparkles" size={14} color="#10B981" />
                <Text style={[styles.permText, { color: theme.text }]}>Smart SMS Parser</Text>
              </View>
              <Text style={[styles.permSub, { color: theme.primaryLight }]}>
                Auto-extracts Amount & Category
              </Text>
            </View>

            <View style={styles.dividerV} />

            <View style={styles.permCol}>
              <View style={styles.permBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
                <Text style={[styles.permText, { color: theme.text }]}>100% Confirmation</Text>
              </View>
              <Text style={[styles.permSub, { color: theme.textMuted }]}>Nothing added without approval</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionToolbar}>
            <TouchableOpacity
              onPress={handlePasteFromClipboard}
              style={[styles.toolBtn, { backgroundColor: '#3B82F6' }]}
            >
              <Ionicons name="clipboard" size={15} color="#FFF" />
              <Text style={[styles.toolBtnText, { color: '#FFF' }]}>
                Paste Clipboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTester(!showTester)}
              style={[styles.toolBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
            >
              <Ionicons name={showTester ? "chevron-up" : "create-outline"} size={15} color={theme.text} />
              <Text style={[styles.toolBtnText, { color: theme.text }]}>
                {showTester ? 'Hide' : 'Type SMS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLoadSamples}
              style={[styles.toolBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
            >
              <Ionicons name="refresh-outline" size={15} color={theme.primaryLight} />
              <Text style={[styles.toolBtnText, { color: theme.primaryLight }]}>
                Samples
              </Text>
            </TouchableOpacity>

            {pendingList.length > 0 && (
              <TouchableOpacity
                onPress={handleApproveAll}
                style={[styles.toolBtn, { backgroundColor: '#10B981' }]}
              >
                <Ionicons name="checkmark-done" size={15} color="#FFF" />
                <Text style={[styles.toolBtnText, { color: '#FFF' }]}>
                  Approve ({pendingList.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Manual SMS Input Box */}
          {showTester && (
            <View style={[styles.testerBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.testerLabel, { color: theme.textMuted }]}>
                Paste any real bank SMS message:
              </Text>
              <TextInput
                style={[styles.testerInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Your A/c *1234 debited INR 750.00 at Swiggy on 10-Nov"
                placeholderTextColor={theme.textMuted}
                value={customText}
                onChangeText={setCustomText}
                multiline
              />
              <TouchableOpacity
                onPress={handleParseCustom}
                style={[styles.parseBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="flash" size={15} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.parseBtnText}>Detect & Add to Pending</Text>
              </TouchableOpacity>

              {/* Indian Bank Presets Chips */}
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 10, marginBottom: 6 }}>
                Or test with sample Indian bank alerts (1-Tap):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {SAMPLE_BANK_MESSAGES.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      const parsed = parseBankMessage(s.body, s.source);
                      if (parsed) {
                        setPendingList((prev) => [parsed, ...prev]);
                        alert(`Detected ${s.source}! Review, edit, or approve below.`);
                      }
                    }}
                    style={[styles.bankChip, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                  >
                    <Ionicons name="business-outline" size={12} color={theme.primaryLight} style={{ marginRight: 4 }} />
                    <Text style={[styles.bankChipText, { color: theme.text }]}>
                      {s.source.replace('SMS (', '').replace(')', '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Pending List */}
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {pendingList.length === 0 ? (
              <View style={[styles.emptyWrap, { borderColor: theme.border }]}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.success} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Inbox Clean!</Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  All detected bank transactions have been reviewed and confirmed.
                </Text>
              </View>
            ) : (
              pendingList.map((item) => {
                const isIncome = item.type === 'income';
                const cat = getCategoryById(item.categoryId, item.type);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: theme.cardAlt,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={[styles.sourcePill, { backgroundColor: isIncome ? theme.successBg : theme.dangerBg }]}>
                        <Ionicons
                          name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                          size={12}
                          color={isIncome ? theme.success : theme.danger}
                        />
                        <Text
                          style={[
                            styles.sourceText,
                            { color: isIncome ? theme.success : theme.danger },
                          ]}
                        >
                          {item.source}
                        </Text>
                      </View>
                      <Text style={[styles.itemDate, { color: theme.textMuted }]}>{item.date}</Text>
                    </View>

                    <View style={styles.itemMain}>
                      <View style={[styles.iconWrap, { backgroundColor: `${cat.color}25` }]}>
                        <Text style={{ fontSize: 20 }}>{cat.emoji || '🏷️'}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.itemCat, { color: theme.textMuted }]}>
                          Category: <Text style={{ color: cat.color, fontWeight: '700' }}>{cat.name}</Text>
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.itemAmount,
                          { color: isIncome ? theme.success : theme.danger },
                        ]}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency.symbol)}
                      </Text>
                    </View>

                    {item.rawText && (
                      <Text style={[styles.rawText, { color: theme.textMuted }]} numberOfLines={2}>
                        "{item.rawText}"
                      </Text>
                    )}

                    <View style={styles.confirmActions}>
                      <TouchableOpacity
                        onPress={() => handleDismiss(item.id)}
                        style={[styles.dismissBtn, { borderColor: theme.border }]}
                      >
                        <Ionicons name="close" size={15} color={theme.textMuted} />
                        <Text style={[styles.dismissText, { color: theme.textMuted }]}>Dismiss</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setEditingItem({ ...item, accountId: item.accountId || accounts[0]?.id || 'acc_checking' })}
                        style={[styles.editBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                      >
                        <Ionicons name="create-outline" size={15} color={theme.primaryLight} />
                        <Text style={[styles.editText, { color: theme.primaryLight }]}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleApprove(item)}
                        style={[
                          styles.approveBtn,
                          { backgroundColor: isIncome ? theme.success : theme.primary },
                        ]}
                      >
                        <Ionicons name="checkmark" size={15} color="#FFF" />
                        <Text style={styles.approveText}>Approve & Move to History</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Edit Detected Transaction Sub-Modal */}
      <Modal visible={!!editingItem} animationType="slide" transparent={true} onRequestClose={() => setEditingItem(null)}>
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.editCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.dragPillWrap}>
              <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Edit Bank Transaction</Text>
                <Text style={[styles.subText, { color: theme.textMuted }]}>
                  Adjust details before moving to Home Tab History
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingItem(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <View style={[styles.typeRow, { backgroundColor: theme.cardAlt }]}>
                <TouchableOpacity
                  onPress={() => setEditingItem((prev) => ({ ...prev, type: 'expense' }))}
                  style={[
                    styles.typeBtn,
                    editingItem?.type === 'expense' && { backgroundColor: theme.danger },
                  ]}
                >
                  <Text style={[styles.typeBtnText, { color: editingItem?.type === 'expense' ? '#FFF' : theme.textMuted }]}>
                    Expense (-)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setEditingItem((prev) => ({ ...prev, type: 'income' }))}
                  style={[
                    styles.typeBtn,
                    editingItem?.type === 'income' && { backgroundColor: theme.success },
                  ]}
                >
                  <Text style={[styles.typeBtnText, { color: editingItem?.type === 'income' ? '#FFF' : theme.textMuted }]}>
                    Income (+)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title / Merchant */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Merchant / Payee Name</Text>
              <TextInput
                style={[styles.inputField, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                value={editingItem?.title || ''}
                onChangeText={(t) => setEditingItem((prev) => ({ ...prev, title: t }))}
                placeholder="e.g. Swiggy, Starbucks, Salary"
                placeholderTextColor={theme.textMuted}
              />

              {/* Amount */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Amount ({currency.symbol})</Text>
              <TextInput
                style={[styles.inputField, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                value={String(editingItem?.amount || '')}
                onChangeText={(a) => setEditingItem((prev) => ({ ...prev, amount: a }))}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
              />

              {/* Account Selector */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Deposit / Deduction Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {accounts.map((acc) => {
                  const isSel = (editingItem?.accountId || accounts[0]?.id) === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setEditingItem((prev) => ({ ...prev, accountId: acc.id }))}
                      style={[
                        styles.accPill,
                        {
                          backgroundColor: isSel ? `${theme.primary}25` : theme.cardAlt,
                          borderColor: isSel ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 13, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
                      <Text style={[styles.accPillText, { color: isSel ? theme.primaryLight : theme.text }]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Date */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.inputField, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                value={editingItem?.date || new Date().toISOString().split('T')[0]}
                onChangeText={(d) => setEditingItem((prev) => ({ ...prev, date: d }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </ScrollView>

            {/* Save & Move to History Action Button */}
            <TouchableOpacity
              onPress={handleSaveAndMoveToHistory}
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Save & Move to Transaction History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 28,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 4,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  permCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerV: {
    width: 1,
    height: 28,
    backgroundColor: '#64748B30',
  },
  permBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  permText: {
    fontSize: 11,
    fontWeight: '700',
  },
  permSub: {
    fontSize: 10,
    marginTop: 1,
  },
  actionToolbar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  testerBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  testerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  testerInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    minHeight: 44,
  },
  parseBtn: {
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  parseBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  list: {
    paddingBottom: 20,
    gap: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  itemCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemDate: {
    fontSize: 11,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemCat: {
    fontSize: 12,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  rawText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dismissBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  approveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  bankChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
  },
  typeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 14,
  },
  accPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  accPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
