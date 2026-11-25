import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { encodeUpiParam } from '../../utils/pdfGenerator';
import { KeyboardSheetModal, useSheetScroll } from '../common/KeyboardSheetModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const FriendReminderBody = ({
  theme,
  currency,
  friend,
  resolvedPhotoUri,
  resolvedAvatarEmoji,
  reminderChannel,
  setReminderChannel,
  absBalance,
  requestAmountType,
  setRequestAmountType,
  customAmount,
  setCustomAmount,
  showEditUpi,
  setShowEditUpi,
  reminderUpiId,
  setReminderUpiId,
  reminderPayee,
  setReminderPayee,
  upiLink,
  handleSendWhatsApp,
  handleSendSMS,
}) => {
  const { scrollToInput } = useSheetScroll();

  return (
    <View style={{ paddingTop: 4, paddingBottom: 16 }}>
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
          <View style={[styles.friendAvatarSmall, { backgroundColor: `${theme.primary}25`, overflow: 'hidden' }]}>
            {resolvedPhotoUri ? (
              <Image source={{ uri: resolvedPhotoUri }} style={{ width: 38, height: 38, borderRadius: 19 }} />
            ) : (
              <Text style={{ fontSize: 18 }}>{resolvedAvatarEmoji || '👤'}</Text>
            )}
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
          activeOpacity={1}
          onPress={() => setRequestAmountType('custom')}
          style={[
            styles.amountOption,
            {
              backgroundColor: requestAmountType === 'custom' ? `${theme.primary}20` : theme.cardAlt,
              borderColor: requestAmountType === 'custom' ? theme.primary : theme.border,
              borderWidth: requestAmountType === 'custom' ? 2 : 1,
            },
          ]}
        >
          <Text style={[styles.amountOptionLabel, { color: requestAmountType === 'custom' ? theme.primaryLight : theme.textMuted }]}>
            Custom Amount
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: requestAmountType === 'custom' ? theme.primaryLight : theme.textMuted, marginRight: 2 }}>
              {currency.symbol}
            </Text>
            <TextInput
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: theme.text,
                flex: 1,
                padding: 0,
              }}
              placeholder="Enter Amount"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={(txt) => {
                setCustomAmount(txt);
                setRequestAmountType('custom');
              }}
              onFocus={(e) => {
                setRequestAmountType('custom');
                scrollToInput(e);
              }}
            />
            {requestAmountType === 'custom' && customAmount.length > 0 && (
              <TouchableOpacity onPress={() => setCustomAmount('')}>
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>

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
              onFocus={scrollToInput}
            />
            <Text style={[styles.miniLabel, { color: theme.textMuted, marginTop: 6 }]}>Payee Name:</Text>
            <TextInput
              style={[styles.upiInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={theme.textMuted}
              value={reminderPayee}
              onChangeText={setReminderPayee}
              onFocus={scrollToInput}
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
    </View>
  );
};

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
    lendingSummary,
    lendingRecords,
    t,
  } = useFinance();

  const [reminderChannel, setReminderChannel] = useState('whatsapp'); // 'whatsapp' | 'sms'
  const [requestAmountType, setRequestAmountType] = useState('full'); // 'full' | 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [showEditUpi, setShowEditUpi] = useState(false);
  const [reminderUpiId, setReminderUpiId] = useState(userUpiSettings?.upiId || 'wealthflow@okaxis');
  const [reminderPayee, setReminderPayee] = useState(userUpiSettings?.payeeName || 'WealthFlow User');
  const [modalAlert, setModalAlert] = useState(null);

  useEffect(() => {
    if (userUpiSettings?.upiId) {
      setReminderUpiId(userUpiSettings.upiId);
    }
    if (userUpiSettings?.payeeName) {
      setReminderPayee(userUpiSettings.payeeName);
    }
  }, [userUpiSettings]);

  if (!visible || !friend) return null;

  const absBalance = Math.abs(friend?.balance || 0);
  const normalizedName = (friend?.name || '').trim().toLowerCase();
  const resolvedPhotoUri =
    friend?.photoUri ||
    friend?.transactions?.find((tx) => tx?.photoUri)?.photoUri ||
    (normalizedName
      ? lendingSummary?.friends?.find(
          (f) => f?.name && f.name.trim().toLowerCase() === normalizedName && f.photoUri
        )?.photoUri ||
        lendingRecords?.find(
          (r) => r?.friendName && r.friendName.trim().toLowerCase() === normalizedName && r.photoUri
        )?.photoUri
      : null) ||
    null;
  const resolvedAvatarEmoji =
    friend?.avatarEmoji ||
    (normalizedName
      ? lendingSummary?.friends?.find(
          (f) => f?.name && f.name.trim().toLowerCase() === normalizedName && f.avatarEmoji
        )?.avatarEmoji
      : null) ||
    '👤';

  const getAmountToRequest = () => {
    if (requestAmountType === 'custom') {
      const num = parseFloat(customAmount);
      return !isNaN(num) && num > 0 ? num : 0;
    }
    return absBalance;
  };

  const currentRequestAmount = getAmountToRequest();
  const effectiveAmount = currentRequestAmount > 0 ? currentRequestAmount : absBalance;
  const upiIdToSend = (reminderUpiId.trim() || userUpiSettings?.upiId || 'wealthflow@okaxis').trim();
  const payeeToSend = (reminderPayee.trim() || userUpiSettings?.payeeName || 'WealthFlow User').trim();
  const latestNote = friend?.transactions?.find((tx) => tx?.note && tx.note.trim())?.note?.trim();
  const rawNote = latestNote || 'Pending balance settlement';
  const cleanNote = (
    rawNote.toLowerCase().startsWith('loan')
      ? rawNote
      : `Loan to ${friend.name}: ${rawNote}`
  ).slice(0, 80);

  const upiLink =
    effectiveAmount > 0
      ? `upi://pay?pa=${encodeUpiParam(upiIdToSend)}&cu=INR&pn=${encodeUpiParam(payeeToSend)}&am=${effectiveAmount.toFixed(2)}&tn=${encodeUpiParam(cleanNote)}`
      : `upi://pay?pa=${encodeUpiParam(upiIdToSend)}&cu=INR&pn=${encodeUpiParam(payeeToSend)}&tn=${encodeUpiParam(cleanNote)}`;

  const handleSendWhatsApp = async () => {
    if (currentRequestAmount <= 0) {
      setModalAlert({
        title: t('invalid_amount', 'Invalid Amount'),
        message: 'Please enter a valid request amount.',
        type: 'danger',
      });
      return;
    }

    if (updateUpiSettings) {
      updateUpiSettings({ upiId: upiIdToSend, payeeName: payeeToSend });
    }

    const message = `Hi ${friend.name}! 👋\n\nFriendly reminder regarding our pending balance:\n💵 *Amount Due: ${currency.symbol}${currentRequestAmount.toFixed(2)}*\n\n💳 *Pay via UPI ID:* ${upiIdToSend}\n📱 *Direct Payment Link:* ${upiLink}\n\nThank you!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(whatsappUrl);
        onClose();
      } else {
        setModalAlert({
          title: 'WhatsApp Unavailable',
          message: 'Could not open WhatsApp directly. Please check if WhatsApp is installed.',
          type: 'info',
        });
      }
    } catch (e) {
      console.warn(e);
      if (typeof window !== 'undefined' && window.open) {
        window.open(whatsappUrl, '_blank');
        onClose();
      } else {
        setModalAlert({
          title: 'WhatsApp Error',
          message: 'Could not launch WhatsApp: ' + (e.message || 'Unknown error'),
          type: 'danger',
        });
      }
    }
  };

  const handleSendSMS = async () => {
    if (currentRequestAmount <= 0) {
      setModalAlert({
        title: t('invalid_amount', 'Invalid Amount'),
        message: 'Please enter a valid request amount.',
        type: 'danger',
      });
      return;
    }

    if (updateUpiSettings) {
      updateUpiSettings({ upiId: upiIdToSend, payeeName: payeeToSend });
    }

    const message = `Hi ${friend.name}, Friendly reminder regarding our pending balance: ${currency.symbol}${currentRequestAmount.toFixed(2)}. Pay via UPI: ${upiIdToSend} (Direct Link: ${upiLink}). Thank you!`;
    const smsUrl = Platform.OS === 'ios'
      ? `sms:&body=${encodeURIComponent(message)}`
      : `sms:?body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(smsUrl);
        onClose();
      } else {
        setModalAlert({
          title: 'SMS Unavailable',
          message: 'Could not launch SMS app on this device.',
          type: 'info',
        });
      }
    } catch (e) {
      console.warn(e);
      setModalAlert({
        title: 'SMS Error',
        message: 'Could not launch SMS app: ' + (e.message || 'Unknown error'),
        type: 'danger',
      });
    }
  };

  const headerLeftControl = onBackToDetails ? (
    <TouchableOpacity
      onPress={() => onBackToDetails(friend)}
      style={[styles.backBtn, { backgroundColor: theme.cardAlt, marginRight: 6 }]}
      accessibilityLabel="Back to contact details"
    >
      <Ionicons name="arrow-back" size={18} color={theme.text} />
    </TouchableOpacity>
  ) : null;

  return (
    <>
      <KeyboardSheetModal
        visible={visible}
        onClose={onClose}
        title={t('payment_reminder', 'Payment Reminder')}
        subtitle={`Direct UPI link for ${friend.name}`}
        icon={reminderChannel === 'whatsapp' ? 'logo-whatsapp' : 'chatbubble-ellipses-outline'}
        iconColor={reminderChannel === 'whatsapp' ? '#25D366' : '#3B82F6'}
        headerLeft={headerLeftControl}
        maxHeightRatio={0.92}
      >
        <FriendReminderBody
          theme={theme}
          currency={currency}
          friend={friend}
          resolvedPhotoUri={resolvedPhotoUri}
          resolvedAvatarEmoji={resolvedAvatarEmoji}
          reminderChannel={reminderChannel}
          setReminderChannel={setReminderChannel}
          absBalance={absBalance}
          requestAmountType={requestAmountType}
          setRequestAmountType={setRequestAmountType}
          customAmount={customAmount}
          setCustomAmount={setCustomAmount}
          showEditUpi={showEditUpi}
          setShowEditUpi={setShowEditUpi}
          reminderUpiId={reminderUpiId}
          setReminderUpiId={setReminderUpiId}
          reminderPayee={reminderPayee}
          setReminderPayee={setReminderPayee}
          upiLink={upiLink}
          handleSendWhatsApp={handleSendWhatsApp}
          handleSendSMS={handleSendSMS}
        />
      </KeyboardSheetModal>
      <ConfirmDeleteModal
        useModal={true}
        visible={!!modalAlert}
        onClose={() => setModalAlert(null)}
        onConfirm={() => setModalAlert(null)}
        title={modalAlert?.title || 'Notice'}
        message={modalAlert?.message || ''}
        type={modalAlert?.type || 'info'}
        showCancel={false}
        confirmText="OK"
        confirmIcon={modalAlert?.type === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'}
      />
    </>
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
