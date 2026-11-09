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
import { formatDateDisplay } from '../../utils/formatters';
import { CalendarDatePickerModal } from '../common/CalendarDatePickerModal';

export const LendingModal = ({ visible, onClose, initialFriend = '' }) => {
  const { theme, currency, categories, addLendingRecord } = useFinance();

  const [friendName, setFriendName] = useState(initialFriend);
  const [type, setType] = useState('lent'); // 'lent' (they owe me) or 'borrowed' (I owe them)
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('other_exp');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (initialFriend) {
      setFriendName(initialFriend);
    }
  }, [initialFriend, visible]);

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
      categoryId,
      date,
      note: note.trim(),
    });

    setAmount('');
    setNote('');
    onClose();
  };

  const categoryList = type === 'lent'
    ? (categories?.expense || EXPENSE_CATEGORIES)
    : (categories?.income || INCOME_CATEGORIES);

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
              <View style={[styles.iconBadge, { backgroundColor: `${theme.primary}25` }]}>
                <Ionicons name="swap-horizontal" size={20} color={theme.primaryLight} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Record Friend Loan / Debt</Text>
                <Text style={[styles.subText, { color: theme.textMuted }]}>
                  Track money given or taken
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Type Toggle: Lent vs Borrowed */}
            <View style={[styles.typeTabs, { backgroundColor: theme.cardAlt }]}>
              <TouchableOpacity
                onPress={() => {
                  setType('lent');
                  setCategoryId('other_exp');
                }}
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
                  I Lent (They Owe Me)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setType('borrowed');
                  setCategoryId('other_inc');
                }}
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
                  I Borrowed (I Owe)
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

            {/* Category Selection from Main Categories */}
            <View style={styles.group}>
              <Text style={[styles.label, { color: theme.textMuted }]}>
                Category ({type === 'lent' ? 'Expense Reason' : 'Income Source'})
              </Text>
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

            {/* Interactive Calendar Date Picker */}
            <View style={styles.group}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Date (DD/MM/YY)</Text>
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
                    {formatDateDisplay(date)}
                  </Text>
                </View>
                <View style={[styles.datePill, { backgroundColor: `${theme.primary}25` }]}>
                  <Text style={[styles.datePillText, { color: theme.primaryLight }]}>
                    Select Date
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={theme.primaryLight} />
                </View>
              </TouchableOpacity>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Calendar Date Picker Modal */}
      <CalendarDatePickerModal
        visible={showDatePicker}
        selectedDate={date}
        onSelectDate={(newDate) => setDate(newDate)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  group: {
    marginBottom: 16,
  },
  label: {
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});