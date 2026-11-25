import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';
import { KeyboardSheetModal, useSheetScroll } from '../common/KeyboardSheetModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const TransferFormBody = ({
  accounts,
  fromAccountId,
  setFromAccountId,
  toAccountId,
  setToAccountId,
  amount,
  setAmount,
  note,
  setNote,
  handleTransfer,
  theme,
  currency,
  t,
}) => {
  const { scrollToInput } = useSheetScroll();

  return (
    <View style={styles.body}>
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
          onFocus={scrollToInput}
          returnKeyType="next"
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
          onFocus={scrollToInput}
          returnKeyType="done"
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
  );
};

export const TransferModal = ({ visible, onClose }) => {
  const { theme, currency, accounts, transferMoney, t } = useFinance();

  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [modalAlert, setModalAlert] = useState(null);

  useEffect(() => {
    if (visible) {
      if (!accounts.some((a) => a.id === fromAccountId)) {
        setFromAccountId(accounts[0]?.id || '');
      }
      if (!accounts.some((a) => a.id === toAccountId)) {
        setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
      }
      setModalAlert(null);
    }
  }, [visible, accounts]);

  const handleTransfer = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalAlert({
        title: t('invalid_amount', 'Invalid Amount'),
        message: 'Please enter a valid transfer amount.',
        type: 'danger',
      });
      return;
    }
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      setModalAlert({
        title: t('invalid_accounts', 'Select Different Accounts'),
        message: 'Source and destination accounts must be different.',
        type: 'danger',
      });
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
    <KeyboardSheetModal
      visible={visible}
      onClose={onClose}
      title={t('transfer', 'Transfer Between Accounts')}
      icon="swap-horizontal"
      iconColor={theme.primary}
      overlayChildren={
        <ConfirmDeleteModal
          useModal={false}
          visible={!!modalAlert}
          onClose={() => setModalAlert(null)}
          onConfirm={() => setModalAlert(null)}
          title={modalAlert?.title || 'Notice'}
          message={modalAlert?.message || ''}
          type={modalAlert?.type || 'danger'}
          showCancel={false}
          confirmText="OK"
          confirmIcon="alert-circle-outline"
        />
      }
    >
      <TransferFormBody
        accounts={accounts}
        fromAccountId={fromAccountId}
        setFromAccountId={setFromAccountId}
        toAccountId={toAccountId}
        setToAccountId={setToAccountId}
        amount={amount}
        setAmount={setAmount}
        note={note}
        setNote={setNote}
        handleTransfer={handleTransfer}
        theme={theme}
        currency={currency}
        t={t}
      />
    </KeyboardSheetModal>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 14,
    paddingTop: 4,
    paddingBottom: 8,
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
