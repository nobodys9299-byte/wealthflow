import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { formatDateDisplay } from '../../utils/formatters';
import { CalendarDatePickerModal } from '../common/CalendarDatePickerModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { KeyboardSheetModal, useSheetScroll } from '../common/KeyboardSheetModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const TransactionFormBody = ({
  type,
  handleTypeChange,
  amount,
  setAmount,
  title,
  setTitle,
  categoryId,
  setCategoryId,
  categoryList,
  accountId,
  setAccountId,
  accounts,
  date,
  note,
  setNote,
  initialData,
  setShowDatePicker,
  setShowCategoryManager,
  handleSave,
  theme,
  currency,
  t,
}) => {
  const { scrollToInput } = useSheetScroll();

  return (
    <View style={styles.scrollBody}>
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
            {t('income', 'Income')}
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
          onFocus={scrollToInput}
          returnKeyType="next"
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
          onFocus={scrollToInput}
          returnKeyType="next"
        />
      </View>

      {/* Category Selector with Custom Category Manager */}
      <View style={styles.inputGroup}>
        <View style={styles.labelHeaderRow}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Category</Text>
          <TouchableOpacity
            onPress={() => setShowCategoryManager(true)}
            style={[styles.manageCatBtn, { backgroundColor: theme.cardAlt }]}
          >
            <Ionicons name="options-outline" size={13} color={theme.primaryLight} />
            <Text style={[styles.manageCatText, { color: theme.primaryLight }]}>
              Manage / Add Category
            </Text>
          </TouchableOpacity>
        </View>
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
                <Text style={{ fontSize: 18, marginBottom: 2 }}>{cat.emoji || '🏷️'}</Text>
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
                <Text style={{ fontSize: 14, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
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

      {/* Interactive Calendar Date Picker */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Date (DD/MM/YY)</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.dateTrigger,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.dateLeft}>
            <Ionicons name="calendar-outline" size={20} color={theme.primaryLight} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formatDateDisplay(date)}
            </Text>
          </View>
          <View style={[styles.chooseDatePill, { backgroundColor: `${theme.primary}25` }]}>
            <Text style={[styles.chooseDatePillText, { color: theme.primaryLight }]}>
              Choose Date
            </Text>
            <Ionicons name="chevron-down" size={14} color={theme.primaryLight} />
          </View>
        </TouchableOpacity>
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
          onFocus={scrollToInput}
          multiline
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[
          styles.saveButton,
          { backgroundColor: type === 'expense' ? theme.danger : theme.success },
        ]}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
        <Text style={styles.saveButtonText}>
          {initialData
            ? `${t('save', 'Save')} (${t('edit', 'Update')})`
            : `${t('save', 'Save')} ${t('transactions', 'Transaction')}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const TransactionModal = ({ visible, onClose, initialData = null }) => {
  const { theme, currency, accounts, categories, addTransaction, editTransaction, t } = useFinance();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_checking');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Modals
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);

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
    setModalAlert(null);
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
      setModalAlert({
        title: t('invalid_amount', 'Invalid Amount'),
        message: 'Please enter a valid amount.',
        type: 'danger',
      });
      return;
    }
    if (!title.trim()) {
      setModalAlert({
        title: t('missing_title', 'Missing Title'),
        message: 'Please enter a title or merchant name.',
        type: 'danger',
      });
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

  const categoryList = type === 'income'
    ? (categories?.income || INCOME_CATEGORIES)
    : (categories?.expense || EXPENSE_CATEGORIES);

  return (
    <KeyboardSheetModal
      visible={visible}
      onClose={onClose}
      title={
        initialData
          ? `${t('edit', 'Edit')} ${t('transactions', 'Transaction')}`
          : t('add_transaction', 'Record Transaction')
      }
      icon={type === 'expense' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
      iconColor={type === 'expense' ? theme.danger : theme.success}
      overlayChildren={
        <>
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
          <CalendarDatePickerModal
            visible={showDatePicker}
            selectedDate={date}
            onSelectDate={(newDate) => setDate(newDate)}
            onClose={() => setShowDatePicker(false)}
          />
          <CategoryManagerModal
            visible={showCategoryManager}
            onClose={() => setShowCategoryManager(false)}
          />
        </>
      }
    >
      <TransactionFormBody
        type={type}
        handleTypeChange={handleTypeChange}
        amount={amount}
        setAmount={setAmount}
        title={title}
        setTitle={setTitle}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        categoryList={categoryList}
        accountId={accountId}
        setAccountId={setAccountId}
        accounts={accounts}
        date={date}
        note={note}
        setNote={setNote}
        initialData={initialData}
        setShowDatePicker={setShowDatePicker}
        setShowCategoryManager={setShowCategoryManager}
        handleSave={handleSave}
        theme={theme}
        currency={currency}
        t={t}
      />
    </KeyboardSheetModal>
  );
};

const styles = StyleSheet.create({
  scrollBody: {
    paddingTop: 4,
    paddingBottom: 12,
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
  labelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  manageCatText: {
    fontSize: 11,
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
  chooseDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  chooseDatePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
