import React, { useState, useEffect } from 'react';
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

const ACCOUNT_TYPES = [
  { id: 'bank', name: 'Bank Checking', icon: 'business-outline' },
  { id: 'savings', name: 'Savings Account', icon: 'shield-checkmark-outline' },
  { id: 'cash', name: 'Cash Wallet', icon: 'wallet-outline' },
  { id: 'card', name: 'Credit Card', icon: 'card-outline' },
];

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F43F5E', '#F59E0B', '#06B6D4', '#EC4899'];

export const AccountModal = ({ visible, onClose, initialData = null }) => {
  const { theme, currency, addAccount, editAccount } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'bank');
      setInitialBalance(initialData.initialBalance !== undefined ? String(initialData.initialBalance) : '');
      setColor(initialData.color || COLORS[0]);
    } else {
      setName('');
      setType('bank');
      setInitialBalance('');
      setColor(COLORS[0]);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter an account name');
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      initialBalance: parseFloat(initialBalance) || 0,
      color,
    };

    if (initialData && initialData.id) {
      editAccount(initialData.id, payload);
    } else {
      addAccount(payload);
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}
      >
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {initialData ? 'Edit Account' : 'Add New Account'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Account Name */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Account Name</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g. Chase Sapphire, Cash, Apple Card"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Account Type */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Account Type</Text>
            <View style={styles.typesRow}>
              {ACCOUNT_TYPES.map((t) => {
                const isSelected = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setType(t.id)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.inputBg,
                        borderColor: isSelected ? theme.primaryLight : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={t.icon}
                      size={16}
                      color={isSelected ? '#FFF' : theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: isSelected ? '#FFF' : theme.text },
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Starting Balance */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Starting Balance ({currency.symbol})
            </Text>
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
              value={initialBalance}
              onChangeText={setInitialBalance}
            />
          </View>

          {/* Color Tag */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Badge Color</Text>
            <View style={styles.colorsRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && { borderWidth: 3, borderColor: '#FFF' },
                  ]}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {initialData ? 'Update Account' : 'Create Account'}
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  group: {
    gap: 8,
  },
  label: {
    fontSize: 12,
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
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
