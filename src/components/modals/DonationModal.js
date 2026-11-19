import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFinance } from '../../context/FinanceContext';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];
const DONATION_UPI_ID = 's8675748237@sic';
const DONATION_PAYEE = 'Ashwini Kumar';
const BANK_DETAILS = {
  holderName: 'Ashwini Kumar',
  accountNumber: '033311501048792',
  ifsc: 'NESF0000333',
  bankName: 'slice Small Finance Bank',
};

export const DonationModal = ({ visible, onClose }) => {
  const { theme, currency } = useFinance();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);

  if (!visible) return null;

  const currentAmount = customAmount ? (parseFloat(customAmount) || 0) : selectedAmount;

  const upiLink = currentAmount > 0
    ? `upi://pay?pa=${DONATION_UPI_ID}&pn=${encodeURIComponent(DONATION_PAYEE)}&am=${currentAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Donation Support for WealthFlow')}`
    : `upi://pay?pa=${DONATION_UPI_ID}&pn=${encodeURIComponent(DONATION_PAYEE)}&cu=INR&tn=${encodeURIComponent('Donation Support for WealthFlow')}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}&margin=2`;

  const handlePayViaUPI = async () => {
    try {
      const supported = await Linking.canOpenURL(upiLink);
      if (supported) {
        await Linking.openURL(upiLink);
      } else {
        await Linking.openURL(upiLink).catch(() => {
          Alert.alert(
            'Donation UPI',
            `UPI ID: ${DONATION_UPI_ID}\nAmount: ${currency.symbol}${currentAmount.toFixed(2)}\n\nPlease open your UPI app (Google Pay, PhonePe, Paytm, or BHIM) to complete the donation.`,
            [{ text: 'OK' }]
          );
        });
      }
    } catch (e) {
      Alert.alert('Donation UPI', `UPI ID: ${DONATION_UPI_ID}`);
    }
  };

  const handleCopyUpi = async () => {
    await Clipboard.setStringAsync(DONATION_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
    Alert.alert('Copied!', `UPI ID "${DONATION_UPI_ID}" has been copied to clipboard.`);
  };

  const handleCopyAccountNum = async () => {
    await Clipboard.setStringAsync(BANK_DETAILS.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2500);
    Alert.alert('Copied!', `Account Number "${BANK_DETAILS.accountNumber}" copied to clipboard.`);
  };

  const handleCopyIfsc = async () => {
    await Clipboard.setStringAsync(BANK_DETAILS.ifsc);
    setCopiedIfsc(true);
    setTimeout(() => setCopiedIfsc(false), 2500);
    Alert.alert('Copied!', `IFSC "${BANK_DETAILS.ifsc}" copied to clipboard.`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.dialogCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Grab Bar Pill */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.heartBadge, { backgroundColor: '#F43F5E20' }]}>
                <Ionicons name="heart" size={20} color="#F43F5E" />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Support & Donate</Text>
                <Text style={[styles.subTitle, { color: theme.textMuted }]}>
                  Help keep WealthFlow free & ad-free
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Inspiring Motivational Quote Box */}
            <View style={[styles.quoteCard, { backgroundColor: '#0F172A', borderColor: '#334155' }]}>
              <View style={styles.quoteTop}>
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
                <Text style={styles.quoteBadgeText}>DEVELOPER APPRECIATION</Text>
              </View>
              <Text style={styles.quoteText}>
                &ldquo;No act of kindness, no matter how small, is ever wasted. Generosity is the heartbeat of community.&rdquo;
              </Text>
              <Text style={styles.quoteDesc}>
                Your voluntary contribution directly powers independent app development, keeping WealthFlow 100% free, private, and continuously updated for everyone. Thank you for your heartfelt support! ❤️
              </Text>
            </View>

            {/* Quick Amount Selector */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
              CHOOSE DONATION AMOUNT
            </Text>
            <View style={styles.amountsRow}>
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = selectedAmount === amt && !customAmount;
                return (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    style={[
                      styles.amtChip,
                      {
                        backgroundColor: isSelected ? '#F43F5E' : theme.inputBg,
                        borderColor: isSelected ? '#F43F5E' : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.amtChipText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {currency.symbol}{amt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <View style={[styles.customInputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.customPrefix, { color: theme.textMuted }]}>Custom {currency.symbol}</Text>
              <TextInput
                style={[styles.customInput, { color: theme.text }]}
                placeholder="Or enter any custom amount"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                value={customAmount}
                onChangeText={(val) => {
                  setCustomAmount(val);
                  setSelectedAmount(null);
                }}
              />
            </View>

            {/* UPI QR Code Display Card */}
            <View style={[styles.qrCard, { backgroundColor: '#0F172A', borderColor: '#1E293B' }]}>
              <View style={styles.qrHeader}>
                <Ionicons name="qr-code-outline" size={16} color="#38BDF8" />
                <Text style={styles.qrHeaderTitle}>INSTANT UPI QR CODE</Text>
              </View>

              <View style={styles.qrRow}>
                <View style={styles.qrWrap}>
                  <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                  <Text style={styles.qrSubTag}>SCAN TO DONATE</Text>
                </View>

                <View style={styles.qrDetailsCol}>
                  <Text style={styles.qrAmtLabel}>Contributing</Text>
                  <Text style={styles.qrAmtVal}>
                    {currency.symbol}{currentAmount > 0 ? currentAmount.toFixed(2) : 'Any Amount'}
                  </Text>
                  <Text style={styles.qrPayeeLabel}>Payee: <Text style={styles.qrPayeeText}>{DONATION_PAYEE}</Text></Text>
                  <Text style={styles.qrAppsNote}>
                    Supported by Google Pay, PhonePe, Paytm, BHIM & CRED
                  </Text>
                </View>
              </View>

              {/* UPI ID Row with One-Tap Copy */}
              <View style={styles.upiCopyRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.upiLabel}>UPI ID (VPA)</Text>
                  <Text style={styles.upiIdText} numberOfLines={1}>{DONATION_UPI_ID}</Text>
                </View>
                <TouchableOpacity onPress={handleCopyUpi} style={styles.copyBtn}>
                  <Ionicons name={copiedUpi ? 'checkmark-circle' : 'copy-outline'} size={15} color="#FFFFFF" />
                  <Text style={styles.copyBtnText}>{copiedUpi ? 'Copied' : 'Copy UPI'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pay Via UPI Button */}
            <TouchableOpacity onPress={handlePayViaUPI} style={styles.payBtn}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
              <Text style={styles.payBtnText}>
                Pay {currency.symbol}{currentAmount > 0 ? currentAmount.toFixed(2) : ''} via UPI App
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Direct Bank Transfer Details Card */}
            <View style={[styles.bankCard, { backgroundColor: '#0F172A', borderColor: '#1E293B' }]}>
              <View style={styles.bankHeader}>
                <Ionicons name="business" size={16} color="#10B981" />
                <Text style={styles.bankHeaderTitle}>DIRECT BANK TRANSFER DETAILS</Text>
              </View>

              <View style={styles.bankBody}>
                {/* Account Holder Name */}
                <View style={styles.bankFieldRow}>
                  <Text style={styles.bankFieldLabel}>ACCOUNT HOLDER NAME</Text>
                  <Text style={styles.bankFieldValueBold}>{BANK_DETAILS.holderName}</Text>
                </View>

                {/* Bank Name */}
                <View style={styles.bankFieldRow}>
                  <Text style={styles.bankFieldLabel}>BANK</Text>
                  <Text style={styles.bankFieldValue}>{BANK_DETAILS.bankName}</Text>
                </View>

                {/* Account Number with Copy */}
                <View style={styles.bankFieldCopyRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.bankFieldLabel}>ACCOUNT NUMBER</Text>
                    <Text style={styles.bankFieldValueMono}>{BANK_DETAILS.accountNumber}</Text>
                  </View>
                  <TouchableOpacity onPress={handleCopyAccountNum} style={styles.bankCopyBtn}>
                    <Ionicons name={copiedAcc ? 'checkmark-circle' : 'copy-outline'} size={14} color="#FFFFFF" />
                    <Text style={styles.bankCopyBtnText}>{copiedAcc ? 'Copied' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>

                {/* IFSC with Copy */}
                <View style={styles.bankFieldCopyRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.bankFieldLabel}>IFSC CODE</Text>
                    <Text style={styles.bankFieldValueMono}>{BANK_DETAILS.ifsc}</Text>
                  </View>
                  <TouchableOpacity onPress={handleCopyIfsc} style={styles.bankCopyBtn}>
                    <Ionicons name={copiedIfsc ? 'checkmark-circle' : 'copy-outline'} size={14} color="#FFFFFF" />
                    <Text style={styles.bankCopyBtnText}>{copiedIfsc ? 'Copied' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.bankFooterNote}>
                Supports IMPS, NEFT & RTGS bank transfers directly to slice Small Finance Bank.
              </Text>
            </View>

            <Text style={[styles.securityNotice, { color: theme.textMuted }]}>
              🔒 100% Direct Transfer • No Intermediary Platform Fees
            </Text>
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
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.35,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 6,
  },
  heartBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingBottom: 20,
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  quoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  quoteBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  quoteText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 6,
  },
  quoteDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  amountsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  amtChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  amtChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  customInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  customPrefix: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  customInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  qrCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
  },
  qrHeaderTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  qrWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
  },
  qrImage: {
    width: 105,
    height: 105,
  },
  qrSubTag: {
    color: '#0F172A',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  qrDetailsCol: {
    flex: 1,
  },
  qrAmtLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  qrAmtVal: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 2,
  },
  qrPayeeLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  qrPayeeText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  qrAppsNote: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 6,
    lineHeight: 14,
  },
  upiCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  upiLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  upiIdText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  payBtn: {
    backgroundColor: '#F43F5E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  bankCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
  },
  bankHeaderTitle: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bankBody: {
    gap: 10,
  },
  bankFieldRow: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bankFieldLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bankFieldValueBold: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  bankFieldValue: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  bankFieldCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bankFieldValueMono: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  bankCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  bankCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bankFooterNote: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  securityNotice: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
});
