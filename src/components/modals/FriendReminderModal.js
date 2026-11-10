import React, { useState, useEffect } from 'react';
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
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const FriendReminderModal = ({
  visible,
  onClose,
  friend,
  onBackToDetails,
}) => {
  const {
    theme,
    currency,
    userUpiSettings,
    updateUpiSettings,
  } = useFinance();

  const [reminderChannel, setReminderChannel] = useState('whatsapp'); // 'whatsapp' | 'sms'
  const [requestAmountType, setRequestAmountType] = useState('full'); // 'full' | 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [showEditUpi, setShowEditUpi] = useState(false);
  const [reminderUpiId, setReminderUpiId] = useState(userUpiSettings?.upiId || 'wealthflow@okaxis');
  const [reminderPayee, setReminderPayee] = useState(userUpiSettings?.payeeName || 'WealthFlow User');

  useEffect(() => {
    if (userUpiSettings?.upiId) {
      setReminderUpiId(userUpiSettings.upiId);
    }
    if (userUpiSettings?.payeeName) {
      setReminderPayee(userUpiSettings.payeeName);
    }
  }, [userUpiSettings]);

  if (!visible || !friend) return null;

  const isOwed = (friend?.balance || 0) >= 0;
  const absBalance = Math.abs(friend?.balance || 0);

  const getAmountToRequest = () => {
    if (requestAmountType === 'custom') {
      const num = parseFloat(customAmount);
      return !isNaN(num) && num > 0 ? num : 0;
    }
    return absBalance;
  };

  const currentRequestAmount = getAmountToRequest();
  const upiIdToSend = (reminderUpiId.trim() || userUpiSettings?.upiId || 'wealthflow@okaxis').trim();
  const payeeToSend = (reminderPayee.trim() || userUpiSettings?.payeeName || 'WealthFlow User').trim();
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiIdToSend)}&pn=${encodeURIComponent(payeeToSend)}&am=${currentRequestAmount > 0 ? currentRequestAmount : absBalance}&cu=INR`;

  const handleSendWhatsApp = async () => {
    if (currentRequestAmount <= 0) {
      alert('Please enter a valid request amount');
      return;
    }

    if (updateUpiSettings) {
      updateUpiSettings({ upiId: upiIdToSend, payeeName: payeeToSend });
    }

    const message = `Hi ${friend.name}! 👋\n\nFriendly reminder regarding our pending balance:\n💵 *Amount Due: ${currency.symbol}${currentRequestAmount}*\n\n💳 *Pay via UPI ID:* ${upiIdToSend}\n📱 *Direct Payment Link:* ${upiLink}\n\nThank you!`;
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

    onClose();
  };

  const handleSendSMS = async () => {
    if (currentRequestAmount <= 0) {
      alert('Please enter a valid request amount');
      return;
    }

    if (updateUpiSettings) {
      updateUpiSettings({ upiId: upiIdToSend, payeeName: payeeToSend });
    }

    const message = `Hi ${friend.name}, Friendly reminder regarding our pending balance: ${currency.symbol}${currentRequestAmount}. Pay via UPI: ${upiIdToSend} (Direct Link: ${upiLink}). Thank you!`;
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

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Drag Pill */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              {onBackToDetails ? (
                <TouchableOpacity
                  onPress={() => onBackToDetails(friend)}
                  style={[styles.backBtn, { backgroundColor: theme.cardAlt }]}
                  accessibilityLabel="Back to contact details"
                >
                  <Ionicons name="arrow-back" size={18} color={theme.text} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.channelIconBadge, { backgroundColor: reminderChannel === 'whatsapp' ? '#25D36625' : '#3B82F625' }]}>
                  <Ionicons
                    name={reminderChannel === 'whatsapp' ? 'logo-whatsapp' : 'chatbubble-ellipses-outline'}
                    size={18}
                    color={reminderChannel === 'whatsapp' ? '#25D366' : '#3B82F6'}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  Payment Reminder
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
                  Direct UPI link for {friend.name}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Top Channel Switcher Tabs */}
            <View style={[styles.channelSegmentedWrap, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => setReminderChannel('whatsapp')}
                style={[
                  styles.channelTab,
                  reminderChannel === 'whatsapp' && { backgroundColor: '#25D366' },
                ]}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={15}
                  color={reminderChannel === 'whatsapp' ? '#FFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.channelTabText,
                    { color: reminderChannel === 'whatsapp' ? '#FFF' : theme.textMuted },
                  ]}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReminderChannel('sms')}
                style={[
                  styles.channelTab,
                  reminderChannel === 'sms' && { backgroundColor: '#3B82F6' },
                ]}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={15}
                  color={reminderChannel === 'sms' ? '#FFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.channelTabText,
                    { color: reminderChannel === 'sms' ? '#FFF' : theme.textMuted },
                  ]}
                >
                  Direct SMS
                </Text>
              </TouchableOpacity>
            </View>

            {/* Friend Balance Hero Banner */}
            <View style={[styles.requestHeroCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.friendAvatarSmall, { backgroundColor: `${theme.primary}25` }]}>
                  <Text style={{ fontSize: 16 }}>👤</Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.requestFriendName, { color: theme.text }]} numberOfLines={1}>
                    {friend.name}
                  </Text>
                  <Text style={[styles.requestFriendStatus, { color: theme.textMuted }]} numberOfLines={1}>
                    Pending Owed Balance
                  </Text>
                </View>
                <View style={[styles.amountDueBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Text style={[styles.amountDueText, { color: theme.primaryLight }]}>
                    {formatCurrency(absBalance, currency.symbol)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount Selection Options */}
            <View style={styles.amountOptions}>
              <TouchableOpacity
                onPress={() => setRequestAmountType('full')}
                style={[
                  styles.amountOption,
                  {
                    backgroundColor: requestAmountType === 'full' ? theme.primary : theme.cardAlt,
                    borderColor: requestAmountType === 'full' ? theme.primaryLight : theme.border,
                  },
                ]}
              >
                <Text style={[styles.amountOptionLabel, { color: requestAmountType === 'full' ? '#FFF' : theme.textMuted }]}>
                  Full Due Balance
                </Text>
                <Text style={[styles.amountOptionVal, { color: requestAmountType === 'full' ? '#FFF' : theme.text }]}>
                  {formatCurrency(absBalance, currency.symbol)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRequestAmountType('custom')}
                style={[
                  styles.amountOption,
                  {
                    backgroundColor: requestAmountType === 'custom' ? theme.primary : theme.cardAlt,
                    borderColor: requestAmountType === 'custom' ? theme.primaryLight : theme.border,
                  },
                ]}
              >
                <Text style={[styles.amountOptionLabel, { color: requestAmountType === 'custom' ? '#FFF' : theme.textMuted }]}>
                  Custom Amount
                </Text>
                <Text style={[styles.amountOptionVal, { color: requestAmountType === 'custom' ? '#FFF' : theme.text }]}>
                  {requestAmountType === 'custom' && customAmount
                    ? `${currency.symbol}${customAmount}`
                    : 'Enter Amount'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dedicated Custom Amount Input Row */}
            {requestAmountType === 'custom' && (
              <View style={[styles.customInputCard, { backgroundColor: theme.cardAlt, borderColor: theme.primary }]}>
                <Text style={[styles.customInputLabel, { color: theme.textMuted }]}>
                  Enter Custom Amount to Request:
                </Text>
                <View style={styles.customInputRow}>
                  <Text style={[styles.customCurrencySymbol, { color: theme.primaryLight }]}>
                    {currency.symbol}
                  </Text>
                  <TextInput
                    style={[styles.customTextInput, { color: theme.text }]}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    autoFocus
                  />
                  {customAmount.length > 0 && (
                    <TouchableOpacity onPress={() => setCustomAmount('')}>
                      <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* UPI Configuration & Live Link Preview */}
            <View style={[styles.upiCardContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.upiCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="card-outline" size={15} color={theme.primaryLight} />
                  <Text style={[styles.upiCardTitle, { color: theme.text }]}>UPI Payment Details & Link</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowEditUpi(!showEditUpi)}
                  style={[styles.editUpiBtn, { backgroundColor: `${theme.primary}20` }]}
                >
                  <Ionicons name={showEditUpi ? 'checkmark' : 'pencil'} size={12} color={theme.primaryLight} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primaryLight, marginLeft: 4 }}>
                    {showEditUpi ? 'Done' : 'Change UPI'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showEditUpi ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.miniLabel, { color: theme.textMuted }]}>Your UPI ID (VPA):</Text>
                  <TextInput
                    style={[styles.upiInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g. yourname@okaxis, yourname@paytm"
                    placeholderTextColor={theme.textMuted}
                    value={reminderUpiId}
                    onChangeText={setReminderUpiId}
                  />
                  <Text style={[styles.miniLabel, { color: theme.textMuted, marginTop: 6 }]}>Payee Name:</Text>
                  <TextInput
                    style={[styles.upiInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={theme.textMuted}
                    value={reminderPayee}
                    onChangeText={setReminderPayee}
                  />
                </View>
              ) : (
                <View style={{ marginTop: 6 }}>
                  <View style={styles.upiValueRow}>
                    <Text style={[styles.upiIdBold, { color: theme.primaryLight }]} numberOfLines={1}>
                      {reminderUpiId || 'wealthflow@okaxis'}
                    </Text>
                    <Text style={[styles.upiPayeeText, { color: theme.textMuted }]} numberOfLines={1}>
                      ({reminderPayee || 'WealthFlow User'})
                    </Text>
                  </View>
                  <View style={styles.upiLinkPreviewBadge}>
                    <Ionicons name="link-outline" size={12} color="#10B981" />
                    <Text style={styles.upiLinkPreviewText} numberOfLines={1} ellipsizeMode="middle">
                      {upiLink}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={reminderChannel === 'whatsapp' ? handleSendWhatsApp : handleSendSMS}
              style={[
                styles.sendPrimaryBtn,
                { backgroundColor: reminderChannel === 'whatsapp' ? '#25D366' : '#3B82F6' },
              ]}
              activeOpacity={0.85}
            >
              <Ionicons
                name={reminderChannel === 'whatsapp' ? 'logo-whatsapp' : 'chatbubble-ellipses-outline'}
                size={20}
                color="#FFF"
              />
              <Text style={styles.sendPrimaryBtnText} numberOfLines={1} adjustsFontSizeToFit>
                {reminderChannel === 'whatsapp' ? 'Send WhatsApp Reminder' : 'Send SMS Reminder'}
              </Text>
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
  card: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  channelSegmentedWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 12,
  },
  channelTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  channelTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  requestHeroCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  friendAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestFriendName: {
    fontSize: 14,
    fontWeight: '800',
  },
  requestFriendStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  amountDueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  amountDueText: {
    fontSize: 13,
    fontWeight: '900',
  },
  amountOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  amountOption: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  amountOptionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountOptionVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  customInputCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  customInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customCurrencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    marginRight: 6,
  },
  customTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    padding: 0,
  },
  upiCardContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  upiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  editUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  upiInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  upiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upiIdBold: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  upiPayeeText: {
    fontSize: 11,
    flexShrink: 1,
  },
  upiLinkPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  upiLinkPreviewText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  sendPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  sendPrimaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
