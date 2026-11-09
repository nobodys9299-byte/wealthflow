import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showTester, setShowTester] = useState(false);

  // Approve and Add to actual ledger
  const handleApprove = (item) => {
    addTransaction({
      type: item.type,
      amount: item.amount,
      title: item.title,
      categoryId: item.categoryId,
      accountId: accounts[0]?.id || 'acc_checking',
      date: item.date,
      note: `Auto-fetched from ${item.source}`,
    });

    // Remove from pending queue
    setPendingList((prev) => prev.filter((p) => p.id !== item.id));
  };

  // Dismiss without adding
  const handleDismiss = (id) => {
    setPendingList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleParseCustom = () => {
    if (!customText.trim()) return;
    const parsed = parseBankMessage(customText.trim(), 'Manual SMS Input');
    if (parsed && parsed.amount > 0) {
      setPendingList((prev) => [parsed, ...prev]);
      setCustomText('');
      setShowTester(false);
    } else {
      alert('Could not detect amount in this message. Try format like: "$45 debited at Starbucks"');
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Ionicons name="mail-unread-outline" size={22} color={theme.primaryLight} />
                <Text style={[styles.title, { color: theme.text }]}>SMS & Gmail Inbox</Text>
              </View>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {pendingList.length} transactions awaiting your confirmation
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Permissions Status Banner */}
          <View style={[styles.permBanner, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
            <View style={styles.permCol}>
              <View style={styles.permBadge}>
                <Ionicons name="chatbox-ellipses" size={14} color="#10B981" />
                <Text style={[styles.permText, { color: theme.text }]}>SMS Auto-Sync</Text>
              </View>
              <Text style={[styles.permSub, { color: theme.textMuted }]}>Connected (READ_SMS)</Text>
            </View>

            <View style={styles.dividerV} />

            <View style={styles.permCol}>
              <View style={styles.permBadge}>
                <Ionicons name="logo-google" size={14} color="#3B82F6" />
                <Text style={[styles.permText, { color: theme.text }]}>Gmail Alerts</Text>
              </View>
              <Text style={[styles.permSub, { color: theme.textMuted }]}>Connected (Bank filters)</Text>
            </View>
          </View>

          {/* Tester Toggle & Refresh */}
          <View style={styles.actionToolbar}>
            <TouchableOpacity
              onPress={() => setShowTester(!showTester)}
              style={[styles.toolBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
            >
              <Ionicons name="add-circle-outline" size={15} color={theme.primaryLight} />
              <Text style={[styles.toolBtnText, { color: theme.primaryLight }]}>
                {showTester ? 'Hide Parser' : 'Paste SMS to Test'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLoadSamples}
              style={[styles.toolBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
            >
              <Ionicons name="refresh-outline" size={15} color={theme.textMuted} />
              <Text style={[styles.toolBtnText, { color: theme.textMuted }]}>Load Sample Bank SMS</Text>
            </TouchableOpacity>
          </View>

          {/* Manual SMS Input Tester Box */}
          {showTester && (
            <View style={[styles.testerBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.testerLabel, { color: theme.textMuted }]}>
                Paste any bank SMS or email alert:
              </Text>
              <TextInput
                style={[styles.testerInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Alert: $52.00 debited from A/c *1234 at Apple Store"
                placeholderTextColor={theme.textMuted}
                value={customText}
                onChangeText={setCustomText}
                multiline
              />
              <TouchableOpacity
                onPress={handleParseCustom}
                style={[styles.parseBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.parseBtnText}>Parse & Preview</Text>
              </TouchableOpacity>
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
                    {/* Source Tag & Date */}
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

                    {/* Details Row */}
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

                    {/* Raw excerpt */}
                    {item.rawText && (
                      <Text style={[styles.rawText, { color: theme.textMuted }]} numberOfLines={2}>
                        "{item.rawText}"
                      </Text>
                    )}

                    {/* Confirmation Buttons */}
                    <View style={styles.confirmActions}>
                      <TouchableOpacity
                        onPress={() => handleDismiss(item.id)}
                        style={[styles.dismissBtn, { borderColor: theme.border }]}
                      >
                        <Ionicons name="close" size={16} color={theme.textMuted} />
                        <Text style={[styles.dismissText, { color: theme.textMuted }]}>Dismiss</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleApprove(item)}
                        style={[
                          styles.approveBtn,
                          { backgroundColor: isIncome ? theme.success : theme.primary },
                        ]}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                        <Text style={styles.approveText}>Confirm & Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
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
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 28,
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
    fontSize: 12,
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
});
