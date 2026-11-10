import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
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
  const { theme, categories, addCategory, editCategory, deleteCategory, resetCategoriesToDefault } = useFinance();

  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏷️');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  // Edit State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('🏷️');
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0]);

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState(null);

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
    alert(`Category "${newCatName.trim()}" created successfully!`);
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditEmoji(cat.emoji || '🏷️');
    setEditColor(cat.color || COLOR_OPTIONS[0]);
    setShowAddForm(false);
    setDeletingCategory(null);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      alert('Please enter a category name');
      return;
    }

    if (editCategory) {
      editCategory({
        id: editingCategory.id,
        name: editName.trim(),
        emoji: editEmoji,
        color: editColor,
        type: activeTab,
      });
      alert(`Category "${editName.trim()}" updated successfully!`);
      setEditingCategory(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    const catNameToDel = deletingCategory.name;
    const catId = deletingCategory.id;

    deleteCategory(activeTab, catId);
    setDeletingCategory(null);
    alert(`Category "${catNameToDel}" deleted successfully.`);
  };

  const handleResetDefaults = () => {
    if (resetCategoriesToDefault) {
      resetCategoriesToDefault();
      alert('Categories have been reset to original defaults.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Grab Bar Pill */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="pricetags-outline" size={20} color={theme.primaryLight} />
                <Text style={[styles.title, { color: theme.text }]}>Manage Categories</Text>
              </View>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {categoryList.length} {activeTab} categories • Edit or delete anytime
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
                setEditingCategory(null);
                setDeletingCategory(null);
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
                setEditingCategory(null);
                setDeletingCategory(null);
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

          {/* In-Modal Delete Confirmation Box */}
          {deletingCategory && (
            <View style={[styles.confirmBox, { backgroundColor: `${theme.danger}15`, borderColor: theme.danger }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="warning-outline" size={22} color={theme.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.confirmTitle, { color: theme.danger }]}>
                    Delete "{deletingCategory.name}"?
                  </Text>
                  <Text style={[styles.confirmSub, { color: theme.textMuted }]}>
                    Are you sure you want to remove this category? Existing transactions will retain their history.
                  </Text>
                </View>
              </View>
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  onPress={() => setDeletingCategory(null)}
                  style={[styles.confirmCancelBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                >
                  <Text style={[styles.confirmBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmDelete}
                  style={[styles.confirmDeleteBtn, { backgroundColor: theme.danger }]}
                >
                  <Ionicons name="trash" size={14} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.confirmBtnText, { color: '#FFF' }]}>Yes, Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Inline Edit Form */}
          {editingCategory && (
            <View style={[styles.createForm, { backgroundColor: theme.inputBg, borderColor: theme.primaryLight }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="create" size={16} color={theme.primaryLight} />
                  <Text style={[styles.formTitle, { color: theme.text }]}>
                    Edit Category ({editingCategory.name})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditingCategory(null)}>
                  <Ionicons name="close-circle-outline" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.nameInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                placeholder="Category name"
                placeholderTextColor={theme.textMuted}
                value={editName}
                onChangeText={setEditName}
              />

              {/* Emoji choices */}
              <Text style={[styles.pickerLabel, { color: theme.textMuted }]}>Choose Emoji Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {EMOJI_OPTIONS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    onPress={() => setEditEmoji(em)}
                    style={[
                      styles.emojiChip,
                      editEmoji === em && { borderColor: theme.primaryLight, borderWidth: 2, backgroundColor: `${theme.primary}30` },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Color choices */}
              <Text style={[styles.pickerLabel, { color: theme.textMuted }]}>Choose Color Accent</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {COLOR_OPTIONS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    onPress={() => setEditColor(col)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: col },
                      editColor === col && { borderWidth: 3, borderColor: '#FFF' },
                    ]}
                  />
                ))}
              </ScrollView>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  onPress={() => setEditingCategory(null)}
                  style={[styles.formBtn, { backgroundColor: theme.cardAlt }]}
                >
                  <Text style={[styles.formBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveEdit}
                  style={[styles.formBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.formBtnText, { color: '#FFF' }]}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* "+ New Category" toggle */}
          {!showAddForm && !editingCategory ? (
            <TouchableOpacity
              onPress={() => {
                setShowAddForm(true);
                setEditingCategory(null);
                setDeletingCategory(null);
              }}
              style={[styles.addBtn, { backgroundColor: theme.primaryBg, borderColor: theme.primary }]}
            >
              <Ionicons name="add-circle" size={18} color={theme.primary} />
              <Text style={[styles.addBtnText, { color: theme.primary }]}>
                + Create New {activeTab === 'expense' ? 'Expense' : 'Income'} Category
              </Text>
            </TouchableOpacity>
          ) : showAddForm ? (
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
          ) : null}

          {/* Categories List */}
          <ScrollView contentContainerStyle={styles.catList} showsVerticalScrollIndicator={false}>
            {categoryList.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Text style={{ color: theme.textMuted }}>No categories found in this list.</Text>
              </View>
            ) : (
              categoryList.map((cat) => (
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
                    <View>
                      <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                      {cat.isCustom && (
                        <Text style={[styles.customBadge, { color: theme.primaryLight }]}>Custom</Text>
                      )}
                    </View>
                  </View>

                  {/* Actions: Edit & Delete Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => handleStartEdit(cat)}
                      style={[styles.actionBtn, { backgroundColor: `${theme.primary}18`, borderColor: theme.border }]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="create-outline" size={15} color={theme.primaryLight} />
                      <Text style={[styles.actionBtnText, { color: theme.primaryLight }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setDeletingCategory(cat)}
                      style={[styles.actionBtn, { backgroundColor: `${theme.danger}15`, borderColor: theme.border }]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="trash-outline" size={15} color={theme.danger} />
                      <Text style={[styles.actionBtnText, { color: theme.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Reset to Defaults Option */}
            <TouchableOpacity
              onPress={handleResetDefaults}
              style={[styles.resetBtn, { borderColor: theme.border }]}
            >
              <Ionicons name="refresh-outline" size={14} color={theme.textMuted} />
              <Text style={[styles.resetBtnText, { color: theme.textMuted }]}>
                Reset Categories to Original Defaults
              </Text>
            </TouchableOpacity>
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
  dragPillWrap: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 6,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  customBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  confirmBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  confirmSub: {
    fontSize: 11,
    marginTop: 2,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  confirmCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: 'dashed',
    marginTop: 12,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
