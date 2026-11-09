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
import { EXPENSE_CATEGORIES } from '../../constants/categories';

export const BudgetModal = ({ visible, onClose, initialData = null }) => {
  const { theme, currency, setCategoryBudget } = useFinance();

  const [categoryId, setCategoryId] = useState('food');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.categoryId || 'food');
      setLimit(initialData.limit ? String(initialData.limit) : '');
    } else {
      setCategoryId('food');
      setLimit('');
    }
  }, [initialData, visible]);

  const handleSave = () => {
    const num = parseFloat(limit);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid monthly budget limit');
      return;
    }

    setCategoryBudget(categoryId, num);
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
              {initialData ? 'Edit Budget Limit' : 'Set Category Budget'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Category selection */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {EXPENSE_CATEGORIES.map((cat) => {
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
                    <Ionicons name={cat.icon} size={16} color={isSelected ? cat.color : theme.textMuted} />
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

          {/* Monthly Limit */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Monthly Spending Limit ({currency.symbol})</Text>
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
              autoFocus
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>Save Budget</Text>
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
