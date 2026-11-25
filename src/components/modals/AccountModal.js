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
import { ACCOUNT_ICONS_GALLERY } from '../../constants/categories';
import { KeyboardSheetModal, useSheetScroll } from '../common/KeyboardSheetModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const ACCOUNT_TYPES = [
  { id: 'bank', name: 'Bank Account' },
  { id: 'card', name: 'Credit Card' },
  { id: 'cash', name: 'Cash Wallet' },
];

const COLORS = [
  '#2563EB', '#10B981', '#8B5CF6', '#F43F5E',
  '#F59E0B', '#06B6D4', '#EC4899', '#6366F1',
  '#14B8A6', '#0284C7', '#7C3AED', '#D97706',
  '#E11D48', '#475569', '#1E3A8A', '#059669',
];

const AccountFormBody = ({
  name,
  setName,
  type,
  setType,
  initialBalance,
  setInitialBalance,
  color,
  setColor,
  selectedEmoji,
  setSelectedEmoji,
  initialData,
  handleSave,
  theme,
  currency,
  t,
}) => {
  const { scrollToInput } = useSheetScroll();

  return (
    <View style={styles.scrollBody}>
      {/* Account Name */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textMuted }]}>{t('Account Name', 'Account Name')}</Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="e.g. Chase Sapphire, Cash, HDFC Salary"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
          onFocus={scrollToInput}
          returnKeyType="next"
        />
      </View>

      {/* Choose Account Image / Avatar from Gallery */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Account Icon / Emblem</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconGallery}>
          {ACCOUNT_ICONS_GALLERY.map((item) => {
            const isSelected = selectedEmoji === item.emoji;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setSelectedEmoji(item.emoji);
                  setColor(item.color);
                }}
                style={[
                  styles.galleryItem,
                  {
                    backgroundColor: isSelected ? `${item.color}25` : theme.inputBg,
                    borderColor: isSelected ? item.color : theme.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                <Text style={[styles.galleryLabel, { color: isSelected ? item.color : theme.textMuted }]}>
                  {item.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Account Type */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Account Classification</Text>
        <View style={styles.typesRow}>
          {ACCOUNT_TYPES.map((accType) => {
            const isSelected = type === accType.id;
            return (
              <TouchableOpacity
                key={accType.id}
                onPress={() => setType(accType.id)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.inputBg,
                    borderColor: isSelected ? theme.primaryLight : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: isSelected ? '#FFF' : theme.text },
                  ]}
                >
                  {accType.name}
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
          onFocus={scrollToInput}
          returnKeyType="done"
        />
      </View>

      {/* Color Tag */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Theme Color</Text>
        <View style={[styles.colorsRow, { flexWrap: 'wrap' }]}>
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
          {initialData ? `${t('save', 'Save')} (${t('edit', 'Update')})` : `${t('save', 'Save')} ${t('accounts', 'Account')}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const AccountModal = ({ visible, onClose, initialData = null }) => {
  const { theme, currency, addAccount, editAccount, t } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState('🛡️');
  const [modalAlert, setModalAlert] = useState(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'bank');
      setInitialBalance(initialData.initialBalance !== undefined ? String(initialData.initialBalance) : '');
      setColor(initialData.color || COLORS[0]);
      setSelectedEmoji(initialData.emoji || '🛡️');
    } else {
      setName('');
      setType('bank');
      setInitialBalance('');
      setColor(COLORS[0]);
      setSelectedEmoji('🛡️');
    }
    setModalAlert(null);
  }, [initialData, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setModalAlert({
        title: t('missing_info', 'Missing Account Name'),
        message: 'Please enter an account name.',
        type: 'danger',
      });
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      initialBalance: parseFloat(initialBalance) || 0,
      color,
      emoji: selectedEmoji,
    };

    if (initialData && initialData.id) {
      editAccount(initialData.id, payload);
    } else {
      addAccount(payload);
    }

    onClose();
  };

  return (
    <>
      <KeyboardSheetModal
        visible={visible}
        onClose={onClose}
        title={initialData ? `${t('edit', 'Edit')} ${t('accounts', 'Account')}` : t('add_account', 'Add Account')}
        icon="wallet-outline"
        iconColor={color}
      >
        <AccountFormBody
          name={name}
          setName={setName}
          type={type}
          setType={setType}
          initialBalance={initialBalance}
          setInitialBalance={setInitialBalance}
          color={color}
          setColor={setColor}
          selectedEmoji={selectedEmoji}
          setSelectedEmoji={setSelectedEmoji}
          initialData={initialData}
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
  scrollBody: {
    paddingTop: 4,
    paddingBottom: 10,
    gap: 14,
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
  iconGallery: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  galleryItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  galleryLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 10,
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
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
