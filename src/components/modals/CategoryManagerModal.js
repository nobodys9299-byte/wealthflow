import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';

const EMOJI_OPTIONS = [
  '🍔', '🥦', '🏡', '🚗', '⚡', '🛍️', '🎬', '🩺', '🎓', '✈️', '✨', '🏷️',
  '💰', '💻', '📈', '🏢', '🎁', '🔄', '💵', '🍕', '☕', '👗', '🎮', '🏋️',
  '📚', '🚕', '⛽', '🍿', '👶', '🐾', '💈', '🏖️', '🛠️', '📱', '🎵', '🪙',
];

const COLOR_OPTIONS = [
  '#F59E0B', '#10B981', '#8B5CF6', '#3B82F6', '#EC4899',
  '#A855F7', '#14B8A6', '#06B6D4', '#6366F1', '#F43F5E', '#64748B', '#0284C7',
];

export const CategoryManagerModal = ({ visible, onClose }) => {
  const { theme, categories, addCategory, deleteCategory } = useFinance();

  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏷️');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  const categoryList = categories[activeTab] || [];

  const handleCreateCategory = () => {
    if (!newCatName.trim()) {
      alert('Please enter a category name');
      return;
    }

    addCategory({
      name: newCatName.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      type: activeTab,
    });

    setNewCatName('');
    setShowAddForm(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Manage Categories</Text>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                Add custom categories or delete unused ones
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Type Tabs */}
          <View style={[styles.typeTabs, { backgroundColor: theme.cardAlt }]}>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('expense');
                setShowAddForm(false);
              }}
              style={[
                styles.typeTab,
                activeTab === 'expense' && { backgroundColor: theme.danger },
              ]}
            >
              <Text
                style={[
                  styles.typeTabText,
                  { color: activeTab === 'expense' ? '#FFF' : theme.textMuted },
                ]}
              >
                Expense Categories ({categories.expense?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('income');
                setShowAddForm(false);
              }}
              style={[
                styles.typeTab,
                activeTab === 'income' && { backgroundColor: theme.success },
              ]}
            >
              <Text
                style={[
                  styles.typeTabText,
                  { color: activeTab === 'income' ? '#FFF' : theme.textMuted },
                ]}
              >
                Income Categories ({categories.income?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* "+ New Category" toggle */}
          {!showAddForm ? (
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              style={[styles.addBtn, { backgroundColor: theme.primaryBg, borderColor: theme.primary }]}
            >
              <Ionicons name="add-circle" size={18} color={theme.primary} />
              <Text style={[styles.addBtnText, { color: theme.primary }]}>
                + Create New {activeTab === 'expense' ? 'Expense' : 'Income'} Category
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.createForm, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>Create Custom Category</Text>

              <TextInput
                style={[styles.nameInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                placeholder="Category name (e.g. Pets, Gaming, Crypto)"
                placeholderTextColor={theme.textMuted}
                value={newCatName}
                onChangeText={setNewCatName}
                autoFocus
              />

              {/* Emoji choices */}
              <Text style={[styles.pickerLabel, { color: theme.textMuted }]}>Select Emoji Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {EMOJI_OPTIONS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    onPress={() => setSelectedEmoji(em)}
                    style={[
                      styles.emojiChip,
                      selectedEmoji === em && { borderColor: theme.primaryLight, borderWidth: 2, backgroundColor: `${theme.primary}30` },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Color choices */}
              <Text style={[styles.pickerLabel, { color: theme.textMuted }]}>Select Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {COLOR_OPTIONS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    onPress={() => setSelectedColor(col)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: col },
                      selectedColor === col && { borderWidth: 3, borderColor: '#FFF' },
                    ]}
                  />
                ))}
              </ScrollView>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  onPress={() => setShowAddForm(false)}
                  style={[styles.formBtn, { backgroundColor: theme.cardAlt }]}
                >
                  <Text style={[styles.formBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateCategory}
                  style={[styles.formBtn, { backgroundColor: activeTab === 'expense' ? theme.danger : theme.success }]}
                >
                  <Text style={styles.formBtnText}>Save Category</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Categories List */}
          <ScrollView contentContainerStyle={styles.catList} showsVerticalScrollIndicator={false}>
            {categoryList.map((cat) => (
              <View
                key={cat.id}
                style={[
                  styles.catItem,
                  { backgroundColor: theme.cardAlt, borderColor: theme.border },
                ]}
              >
                <View style={styles.catLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: `${cat.color}25` }]}>
                    <Text style={{ fontSize: 20 }}>{cat.emoji || '🏷️'}</Text>
                  </View>
                  <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                </View>

                {/* Delete button (with confirmation) */}
                <TouchableOpacity
                  onPress={() => deleteCategory(cat.id, activeTab)}
                  style={styles.delBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  typeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  createForm: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  emojiChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  formBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  formBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  catList: {
    paddingBottom: 20,
    gap: 8,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
  },
  delBtn: {
    padding: 6,
  },
});
