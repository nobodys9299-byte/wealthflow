import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';

export const TransactionModal = ({ visible, onClose, initialData = null }) => {
  const { theme, currency, accounts, addTransaction, editTransaction } = useFinance();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_checking');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setTitle(initialData.title || '');
      setCategoryId(initialData.categoryId || (initialData.type === 'income' ? 'salary' : 'food'));
      setAccountId(initialData.accountId || accounts[0]?.id || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setNote(initialData.note || '');
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setCategoryId('food');
      setAccountId(accounts[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [initialData, visible, accounts]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'income') {
      setCategoryId('salary');
    } else {
      setCategoryId('food');
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a title or merchant name');
      return;
    }

    const payload = {
      type,
      amount: numAmount,
      title: title.trim(),
      categoryId,
      accountId: accountId || accounts[0]?.id,
      date,
      note: note.trim(),
    };

    if (initialData && initialData.id) {
      editTransaction(initialData.id, payload);
    } else {
      addTransaction(payload);
    }

    onClose();
  };

  const categoryList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}
      >
        <View style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {initialData ? 'Edit Transaction' : 'Record Transaction'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Type Selector Tabs */}
            <View style={[styles.typeTabs, { backgroundColor: theme.cardAlt }]}>
              <TouchableOpacity
                onPress={() => handleTypeChange('expense')}
                style={[
                  styles.typeTab,
                  type === 'expense' && { backgroundColor: theme.danger },
                ]}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={16}
                  color={type === 'expense' ? '#FFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    { color: type === 'expense' ? '#FFF' : theme.textMuted },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTypeChange('income')}
                style={[
                  styles.typeTab,
                  type === 'income' && { backgroundColor: theme.success },
                ]}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={16}
                  color={type === 'income' ? '#FFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    { color: type === 'income' ? '#FFF' : theme.textMuted },
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.amountContainer}>
              <Text style={[styles.currencyPrefix, { color: theme.primaryLight }]}>
                {currency.symbol}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                value={amount}
                onChangeText={setAmount}
                autoFocus={!initialData}
              />
            </View>

            {/* Title / Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Title / Merchant</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. Grocery Store, Coffee, Salary"
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {categoryList.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      style={[
                        styles.categoryItem,
                        {
                          backgroundColor: isSelected ? `${cat.color}25` : theme.inputBg,
                          borderColor: isSelected ? cat.color : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={18}
                        color={isSelected ? cat.color : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.categoryLabel,
                          {
                            color: isSelected ? cat.color : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Account Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Payment Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountRow}>
                {accounts.map((acc) => {
                  const isSelected = accountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setAccountId(acc.id)}
                      style={[
                        styles.accountChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.inputBg,
                          borderColor: isSelected ? theme.primaryLight : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={acc.icon || 'wallet-outline'}
                        size={16}
                        color={isSelected ? '#FFF' : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.accountChipText,
                          { color: isSelected ? '#FFF' : theme.text },
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Date Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
                value={date}
                onChangeText={setDate}
              />
            </View>

            {/* Note Optional */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Note (Optional)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                    minHeight: 50,
                  },
                ]}
                placeholder="Add tags or notes..."
                placeholderTextColor={theme.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                { backgroundColor: type === 'expense' ? theme.danger : theme.success },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {initialData ? 'Update Transaction' : 'Save Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
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
  contentCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
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
    fontSize: 14,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  currencyPrefix: {
    fontSize: 32,
    fontWeight: '800',
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '900',
    minWidth: 120,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  categoryLabel: {
    fontSize: 12,
  },
  accountRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  accountChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
