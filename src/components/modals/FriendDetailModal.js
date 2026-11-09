import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { generateLendingStatementPDF } from '../../utils/pdfGenerator';

export const FriendDetailModal = ({
  visible,
  onClose,
  friend,
  onOpenAddEntry,
}) => {
  const {
    theme,
    currency,
    settleFriendDebt,
    deleteFriendAccount,
    deleteLendingRecord,
    userUpiSettings,
  } = useFinance();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmountType, setRequestAmountType] = useState('full'); // 'full' | 'custom'
  const [customAmount, setCustomAmount] = useState('');

  if (!friend) return null;

  const isOwed = friend.balance >= 0;
  const absBalance = Math.abs(friend.balance);

  const handleShareStatementPDF = async () => {
    await generateLendingStatementPDF(friend, currency.symbol);
  };

  const handleSendWhatsAppRequest = async () => {
    const upiId = userUpiSettings?.upiId || '';
    const payeeName = userUpiSettings?.payeeName || 'WealthFlow User';

    let amountToRequest = absBalance;
    if (requestAmountType === 'custom') {
      const num = parseFloat(customAmount);
      if (isNaN(num) || num <= 0) {
        alert('Please enter a valid request amount');
        return;
      }
      amountToRequest = num;
    }

    if (amountToRequest <= 0) {
      alert('There is no unsettled balance to request');
      return;
    }

    // Build standard UPI intent URI
    const upiLink = upiId
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountToRequest}&cu=INR`
      : '';

    // WhatsApp Message
    const message = `Hi ${friend.name}! 👋\n\nfriendly reminder regarding our pending balance:\n💵 *Amount Due: ${currency.symbol}${amountToRequest}*\n\n${
      upiId ? `💳 *Pay via UPI ID:* ${upiId}\n📱 *Pay Directly:* ${upiLink}\n\n` : ''
    }Thank you!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(whatsappUrl);
      } else {
        alert('Could not open WhatsApp directly. You can copy the message.');
      }
    } catch (e) {
      console.warn(e);
      window.open && window.open(whatsappUrl, '_blank');
    }

    setShowRequestModal(false);
  };

  const handleSendDirectSMS = async () => {
    let amountToRequest = absBalance;
    if (requestAmountType === 'custom') {
      const num = parseFloat(customAmount);
      if (isNaN(num) || num <= 0) {
        alert('Please enter a valid request amount');
        return;
      }
      amountToRequest = num;
    }

    if (amountToRequest <= 0) {
      alert('There is no unsettled balance to request');
      return;
    }

    const upiId = userUpiSettings?.upiId || '';
    const payeeName = userUpiSettings?.payeeName || 'WealthFlow User';
    const upiLink = upiId
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountToRequest}&cu=INR`
      : '';

    const message = `Hi ${friend.name}, friendly reminder regarding our pending balance: ${currency.symbol}${amountToRequest}.${upiId ? ` Pay via UPI: ${upiId} (${upiLink})` : ''} Thank you!`;
    const smsUrl = Platform.OS === 'ios'
      ? `sms:&body=${encodeURIComponent(message)}`
      : `sms:?body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(smsUrl);
      } else {
        alert('Could not launch SMS app.');
      }
    } catch (e) {
      console.warn(e);
      alert('Could not launch SMS app: ' + e.message);
    }

    setShowRequestModal(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.friendInfo}>
              <View style={[styles.avatar, { backgroundColor: `${theme.primary}25` }]}>
                <Text style={[styles.avatarText, { color: theme.primaryLight }]}>
                  {friend.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.friendName, { color: theme.text }]}>{friend.name}</Text>
                <Text style={[styles.friendStatus, { color: isOwed ? theme.success : theme.danger }]}>
                  {isOwed ? 'Owes you money' : 'You owe this contact'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Hero Balance Box */}
          <View
            style={[
              styles.heroBox,
              {
                backgroundColor: isOwed ? theme.successBg : theme.dangerBg,
                borderColor: isOwed ? theme.success : theme.danger,
              },
            ]}
          >
            <Text style={[styles.heroLabel, { color: isOwed ? theme.success : theme.danger }]}>
              {isOwed ? 'TOTAL RECEIVABLE' : 'TOTAL PAYABLE'}
            </Text>
            <Text style={[styles.heroAmount, { color: isOwed ? theme.success : theme.danger }]}>
              {isOwed ? '+' : '-'}{formatCurrency(absBalance, currency.symbol)}
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionsRow}>
            {/* Request Money via WhatsApp & Direct SMS */}
            {isOwed && absBalance > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => setShowRequestModal(true)}
                  style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowRequestModal(true)}
                  style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>Direct SMS</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Share PDF Statement */}
            <TouchableOpacity
              onPress={handleShareStatementPDF}
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFF" />
              <Text style={styles.actionBtnText}>PDF Statement</Text>
            </TouchableOpacity>
          </View>

          {/* New Entry and Settle controls */}
          <View style={styles.subActionsRow}>
            <TouchableOpacity
              onPress={() => {
                onClose();
                onOpenAddEntry(friend.name);
              }}
              style={[styles.subBtn, { backgroundColor: theme.cardAlt }]}
            >
              <Ionicons name="add" size={16} color={theme.text} />
              <Text style={[styles.subBtnText, { color: theme.text }]}>Add Loan Record</Text>
            </TouchableOpacity>

            {absBalance > 0 && (
              <TouchableOpacity
                onPress={() => settleFriendDebt(friend.name)}
                style={[styles.subBtn, { backgroundColor: `${theme.success}25` }]}
              >
                <Ionicons name="checkmark-done" size={16} color={theme.success} />
                <Text style={[styles.subBtnText, { color: theme.success }]}>Mark Settled</Text>
              </TouchableOpacity>
            )}

            {/* Delete Friend Account after settlement */}
            <TouchableOpacity
              onPress={() => {
                deleteFriendAccount(friend.name);
                onClose();
              }}
              style={[styles.subBtn, { backgroundColor: theme.dangerBg }]}
            >
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
              <Text style={[styles.subBtnText, { color: theme.danger }]}>Delete Friend</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction History Section */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Transaction History ({friend.transactions.length})
          </Text>

          <ScrollView style={styles.txList} showsVerticalScrollIndicator={false}>
            {friend.transactions.map((t) => {
              const isLent = t.type === 'lent';
              return (
                <View
                  key={t.id}
                  style={[
                    styles.txItem,
                    { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txBadge, { backgroundColor: isLent ? theme.successBg : theme.dangerBg }]}>
                      <Ionicons
                        name={isLent ? 'arrow-up-circle' : 'arrow-down-circle'}
                        size={16}
                        color={isLent ? theme.success : theme.danger}
                      />
                    </View>
                    <View>
                      <Text style={[styles.txTitle, { color: theme.text }]}>
                        {t.note || (isLent ? 'Money Lent' : 'Money Borrowed')}
                      </Text>
                      <Text style={[styles.txDate, { color: theme.textMuted }]}>
                        {formatDateDisplay(t.date)} • {t.status?.toUpperCase() || 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isLent ? theme.success : theme.danger },
                      ]}
                    >
                      {isLent ? '+' : '-'}{formatCurrency(t.amount, currency.symbol)}
                    </Text>
                    <TouchableOpacity onPress={() => deleteLendingRecord(t.id)}>
                      <Ionicons name="trash-outline" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* UPI WhatsApp Request Modal */}
          <Modal visible={showRequestModal} transparent animationType="fade">
            <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
              <View style={[styles.requestCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.text }]}>Request Payment via UPI</Text>
                  <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                    <Ionicons name="close" size={22} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.reqHelp, { color: theme.textMuted }]}>
                  Choose how much to request from <Text style={{ fontWeight: '700', color: theme.text }}>{friend.name}</Text>:
                </Text>

                {/* Amount options */}
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    onPress={() => setRequestAmountType('full')}
                    style={[
                      styles.optChip,
                      requestAmountType === 'full' && { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={[styles.optText, { color: requestAmountType === 'full' ? '#FFF' : theme.text }]}>
                      Full Balance ({formatCurrency(absBalance, currency.symbol)})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRequestAmountType('custom')}
                    style={[
                      styles.optChip,
                      requestAmountType === 'custom' && { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={[styles.optText, { color: requestAmountType === 'custom' ? '#FFF' : theme.text }]}>
                      Custom Amount
                    </Text>
                  </TouchableOpacity>
                </View>

                {requestAmountType === 'custom' && (
                  <TextInput
                    style={[
                      styles.customInput,
                      { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder="Enter amount"
                    placeholderTextColor={theme.textMuted}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    autoFocus
                  />
                )}

                {/* UPI ID Info */}
                <View style={[styles.upiInfoBox, { backgroundColor: theme.cardAlt }]}>
                  <Ionicons name="qr-code-outline" size={18} color={theme.primaryLight} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.upiLabel, { color: theme.textMuted }]}>Your Payment UPI ID:</Text>
                    <Text style={[styles.upiValue, { color: theme.text }]}>
                      {userUpiSettings?.upiId || 'Not set (You can set in Settings)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.reqBtnRow}>
                  <TouchableOpacity
                    onPress={handleSendWhatsAppRequest}
                    style={[styles.sendReqBtn, { backgroundColor: '#25D366' }]}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                    <Text style={styles.sendReqBtnText}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendDirectSMS}
                    style={[styles.sendReqBtn, { backgroundColor: '#3B82F6' }]}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
                    <Text style={styles.sendReqBtnText}>Direct SMS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
    alignItems: 'center',
    marginBottom: 14,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  friendName: {
    fontSize: 18,
    fontWeight: '800',
  },
  friendStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  heroBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    marginVertical: 10,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  subBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  txList: {
    maxHeight: 220,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  requestCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  reqHelp: {
    fontSize: 12,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  optChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#64748B30',
  },
  optText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  upiInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  upiLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  upiValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  reqBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sendReqBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  sendReqBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
