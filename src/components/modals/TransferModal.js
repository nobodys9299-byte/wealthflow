import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';

export const TransferModal = ({ visible, onClose }) => {
  const { theme, currency, accounts, transferMoney, t } = useFinance();

  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleTransfer = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid transfer amount');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different');
      return;
    }

    transferMoney({
      fromAccountId,
      toAccountId,
      amount: numAmount,
      note: note.trim(),
    });

    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Drag / Grab Bar Pill for Uniform Presentation */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{t('transfer', 'Transfer Between Accounts')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* From Account */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>{t('From Account', 'From Account')}</Text>
            <View style={styles.chipRow}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={`from_${acc.id}`}
                  onPress={() => setFromAccountId(acc.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: fromAccountId === acc.id ? theme.primary : theme.inputBg,
                      borderColor: fromAccountId === acc.id ? theme.primaryLight : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: fromAccountId === acc.id ? '#FFF' : theme.text },
                    ]}
                  >
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Transfer Icon Divider */}
          <View style={styles.iconCenter}>
            <View style={[styles.circleIcon, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="arrow-down" size={18} color={theme.primaryLight} />
            </View>
          </View>

          {/* To Account */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>{t('To Account', 'To Account')}</Text>
            <View style={styles.chipRow}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={`to_${acc.id}`}
                  onPress={() => setToAccountId(acc.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: toAccountId === acc.id ? theme.primary : theme.inputBg,
                      borderColor: toAccountId === acc.id ? theme.primaryLight : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: toAccountId === acc.id ? '#FFF' : theme.text },
                    ]}
                  >
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Amount ({currency.symbol})</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Note */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Note (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g. Credit Card payoff, savings deposit"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <TouchableOpacity
            onPress={handleTransfer}
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="swap-horizontal" size={20} color="#FFF" />
            <Text style={styles.submitBtnText}>{t('transfer', 'Complete Transfer')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 2,
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
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  group: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconCenter: {
    alignItems: 'center',
    marginVertical: -4,
  },
  circleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
