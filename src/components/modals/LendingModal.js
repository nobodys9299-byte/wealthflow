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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';

export const LendingModal = ({ visible, onClose, initialFriend = '' }) => {
  const { theme, currency, addLendingRecord } = useFinance();

  const [friendName, setFriendName] = useState(initialFriend);
  const [type, setType] = useState('lent'); // 'lent' (they owe me) or 'borrowed' (I owe them)
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!friendName.trim()) {
      alert('Please enter a friend or contact name');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    addLendingRecord({
      friendName: friendName.trim(),
      type,
      amount: numAmount,
      date,
      note: note.trim(),
    });

    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}
      >
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={{ fontSize: 22 }}>🤝</Text>
              <Text style={[styles.title, { color: theme.text }]}>Record Friend Loan / Debt</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Type Toggle: Lent vs Borrowed */}
          <View style={[styles.typeTabs, { backgroundColor: theme.cardAlt }]}>
            <TouchableOpacity
              onPress={() => setType('lent')}
              style={[
                styles.typeTab,
                type === 'lent' && { backgroundColor: theme.success },
              ]}
            >
              <Ionicons
                name="arrow-up-circle-outline"
                size={16}
                color={type === 'lent' ? '#FFF' : theme.textMuted}
              />
              <Text
                style={[
                  styles.typeTabText,
                  { color: type === 'lent' ? '#FFF' : theme.textMuted },
                ]}
              >
                I Lent Money (They Owe Me)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType('borrowed')}
              style={[
                styles.typeTab,
                type === 'borrowed' && { backgroundColor: theme.danger },
              ]}
            >
              <Ionicons
                name="arrow-down-circle-outline"
                size={16}
                color={type === 'borrowed' ? '#FFF' : theme.textMuted}
              />
              <Text
                style={[
                  styles.typeTabText,
                  { color: type === 'borrowed' ? '#FFF' : theme.textMuted },
                ]}
              >
                I Borrowed (I Owe Them)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Friend Name */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Friend / Contact Name</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g. Alex, Sarah, Michael"
              placeholderTextColor={theme.textMuted}
              value={friendName}
              onChangeText={setFriendName}
            />
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

          {/* Date */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Transaction Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Note / Purpose */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Reason / Purpose (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g. Dinner bill split, Emergency loan, Concert ticket"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.submitBtn,
              { backgroundColor: type === 'lent' ? theme.success : theme.danger },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.submitBtnText}>
              {type === 'lent' ? 'Record Money Given' : 'Record Money Received'}
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  typeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  group: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    fontSize: 15,
    fontWeight: '800',
  },
});
