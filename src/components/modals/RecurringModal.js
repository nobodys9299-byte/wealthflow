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
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { formatDateDisplay } from '../../utils/formatters';
import { CalendarDatePickerModal } from '../common/CalendarDatePickerModal';

const FREQUENCIES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'yearly', label: 'Yearly' },
];

export const RecurringModal = ({ visible, onClose, initialData = null }) => {
  const { theme, currency, accounts, categories, addRecurring, editRecurring, t } = useFinance();

  const [type, setType] = useState('expense'); // 'expense' (bill) | 'income' (salary/pay)
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('bills');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_checking');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setTitle(initialData.title || '');
      setAmount(initialData.amount !== undefined ? String(initialData.amount) : '');
      setCategoryId(initialData.categoryId || (initialData.type === 'income' ? 'salary' : 'bills'));
      setAccountId(initialData.accountId || accounts[0]?.id || 'acc_checking');
      setFrequency(initialData.frequency || 'monthly');
      setNextDueDate(initialData.nextDueDate || new Date().toISOString().split('T')[0]);
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      setCategoryId('bills');
      setAccountId(accounts[0]?.id || 'acc_checking');
      setFrequency('monthly');
      setNextDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, visible, accounts]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'income') {
      setCategoryId('salary');
    } else {
      setCategoryId('bills');
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      alert('Please enter a bill or subscription title');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const derivedDay = nextDueDate ? (parseInt(nextDueDate.split('-')[2], 10) || 1) : 1;

    const payload = {
      type,
      title: title.trim(),
      amount: numAmount,
      categoryId,
      accountId: accountId || accounts[0]?.id,
      frequency,
      dayOfMonth: derivedDay,
      nextDueDate,
    };

    if (initialData && initialData.id) {
      editRecurring(initialData.id, payload);
    } else {
      addRecurring(payload);
    }

    onClose();
  };

  const categoryList = type === 'income'
    ? (categories?.income || INCOME_CATEGORIES)
    : (categories?.expense || EXPENSE_CATEGORIES);

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

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                {initialData ? `${t('edit', 'Edit')} ${t('recurring_bills', 'Recurring Bill / Pay')}` : t('add_recurring', 'New Recurring Bill / Pay')}
              </Text>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {t('Auto-added to transactions on schedule', 'Auto-added to transactions on schedule')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Type Selector (Expense Bill vs Income Pay) */}
            <View style={[styles.typeTabs, { backgroundColor: theme.cardAlt }]}>
              <TouchableOpacity
                onPress={() => handleTypeChange('expense')}
                style={[
                  styles.typeTab,
                  type === 'expense' && { backgroundColor: theme.danger },
                ]}
              >
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={type === 'expense' ? '#FFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    { color: type === 'expense' ? '#FFF' : theme.textMuted },
                  ]}
                >
                  {t('expense', 'Expense')}
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
                  name="cash-outline"
                  size={16}
                  color={type === 'income' ? '#FFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    { color: type === 'income' ? '#FFF' : theme.textMuted },
                  ]}
                >
                  {t('income', 'Income')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title / Service Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                Subscription or Bill Name
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="e.g. Netflix, Wifi, House Rent, Monthly Salary"
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                Amount ({currency.symbol})
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                ]}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Frequency Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Frequency</Text>
              <View style={styles.freqRow}>
                {FREQUENCIES.map((f) => {
                  const isSelected = frequency === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setFrequency(f.id)}
                      style={[
                        styles.freqBtn,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.inputBg,
                          borderColor: isSelected ? theme.primaryLight : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.freqBtnText,
                          { color: isSelected ? '#FFF' : theme.text },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Next Due Date with Interactive Calendar */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                Next Due Date (DD/MM/YY)
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.dateTrigger,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                ]}
              >
                <View style={styles.dateLeft}>
                  <Ionicons name="calendar-outline" size={18} color={theme.primaryLight} />
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {formatDateDisplay(nextDueDate)}
                  </Text>
                </View>
                <View style={[styles.datePill, { backgroundColor: `${theme.primary}25` }]}>
                  <Text style={[styles.datePillText, { color: theme.primaryLight }]}>
                    Choose Date
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={theme.primaryLight} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {categoryList.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? `${cat.color}25` : theme.inputBg,
                          borderColor: isSelected ? cat.color : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 16, marginRight: 4 }}>{cat.emoji || '🏷️'}</Text>
                      <Text
                        style={[
                          styles.catChipText,
                          { color: isSelected ? cat.color : theme.text },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Account Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>From Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {accounts.map((acc) => {
                  const isSelected = accountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setAccountId(acc.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.inputBg,
                          borderColor: isSelected ? theme.primaryLight : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 14, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
                      <Text
                        style={[
                          styles.catChipText,
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
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.submitBtn,
                { backgroundColor: type === 'expense' ? theme.danger : theme.success },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>
                {initialData ? `${t('save', 'Save')} (${t('edit', 'Update')})` : `${t('save', 'Save')} ${t('recurring_bills', 'Recurring Bill')}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Calendar Date Picker Modal */}
      <CalendarDatePickerModal
        visible={showDatePicker}
        selectedDate={nextDueDate}
        onSelectDate={(newDate) => setNextDueDate(newDate)}
        onClose={() => setShowDatePicker(false)}
      />
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
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingTop: 10,
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  typeTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
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
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  freqBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});