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
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { KeyboardSheetModal, useSheetScroll } from '../common/KeyboardSheetModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const BudgetFormBody = ({
  availableCategories,
  categoryId,
  setCategoryId,
  limit,
  setLimit,
  handleSave,
  theme,
  currency,
  t,
}) => {
  const { scrollToInput } = useSheetScroll();

  return (
    <View style={styles.body}>
      {/* Category selection */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textMuted }]}>
          {t('category', 'Select Category')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {availableCategories.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected ? `${cat.color || theme.primary}25` : theme.inputBg,
                    borderColor: isSelected ? (cat.color || theme.primary) : theme.border,
                  },
                ]}
              >
                {cat.emoji ? (
                  <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                ) : (
                  <Ionicons
                    name={cat.icon || 'pricetag-outline'}
                    size={16}
                    color={isSelected ? (cat.color || theme.primary) : theme.textMuted}
                  />
                )}
                <Text
                  style={[
                    styles.catChipText,
                    { color: isSelected ? (cat.color || theme.primaryLight) : theme.text },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Monthly Limit */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textMuted }]}>
          Monthly Spending Limit ({currency.symbol})
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
          placeholder="e.g. 500"
          placeholderTextColor={theme.textMuted}
          value={limit}
          onChangeText={setLimit}
          onFocus={scrollToInput}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[styles.saveBtn, { backgroundColor: theme.primary }]}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
        <Text style={styles.saveBtnText}>{t('save', 'Save Budget')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const BudgetModal = ({ visible, onClose, initialData = null }) => {
  const { theme, currency, setCategoryBudget, categories, t } = useFinance();

  const availableCategories = (categories?.expense && categories.expense.length > 0)
    ? categories.expense
    : EXPENSE_CATEGORIES;

  const [categoryId, setCategoryId] = useState('food');
  const [limit, setLimit] = useState('');
  const [modalAlert, setModalAlert] = useState(null);

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.categoryId || availableCategories[0]?.id || 'food');
      setLimit(initialData.limit ? String(initialData.limit) : '');
    } else {
      setCategoryId(availableCategories[0]?.id || 'food');
      setLimit('');
    }
    setModalAlert(null);
  }, [initialData, visible, categories]);

  const handleSave = () => {
    const num = parseFloat(limit);
    if (isNaN(num) || num <= 0) {
      setModalAlert({
        title: t('invalid_amount', 'Invalid Limit'),
        message: 'Please enter a valid monthly budget limit.',
        type: 'danger',
      });
      return;
    }

    setCategoryBudget(categoryId, num);
    onClose();
  };

  return (
    <>
      <KeyboardSheetModal
        visible={visible}
        onClose={onClose}
        title={
          initialData
            ? `${t('edit', 'Edit')} ${t('budget_goals', 'Budget')}`
            : t('create_budget', 'Set Category Budget')
        }
        icon="shield-checkmark-outline"
        iconColor={theme.primary}
      >
        <BudgetFormBody
          availableCategories={availableCategories}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          limit={limit}
          setLimit={setLimit}
          handleSave={handleSave}
          theme={theme}
          currency={currency}
          t={t}
        />
      </KeyboardSheetModal>
      <ConfirmDeleteModal
        useModal={true}
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
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 16,
    paddingTop: 4,
  },
  group: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
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
