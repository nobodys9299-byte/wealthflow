import React, { useState } from 'react';
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
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { KeyboardSheetModal, useSheetScroll } from '../common/KeyboardSheetModal';

const EMOJI_OPTIONS = [
  // Food & Dining
  '🍽️', '🍔', '🍕', '🍜', '🍣', '🥗', '☕', '🥪', '🍰', '🍩', '🍦', '🌮', '🍱', '🍻', '🍷', '🍿', '🍲', '🥐',
  // Groceries & Market
  '🛒', '🥦', '🍎', '🍞', '🥩', '🥚', '🥛', '🍇', '🍉', '🥑', '🧀', '🥕', '🍓',
  // Transport & Travel
  '🚗', '⛽', '🚕', '🚌', '🚆', '✈️', '🛵', '🚲', '🏖️', '🏨', '🛳️', '🚁', '🚀', '🚊', '🚤',
  // Home, Bills & Utilities
  '⚡', '💡', '💧', '📶', '📱', '🏡', '🛋️', '🔑', '🧹', '🔧', '📦', '🏢', '🔌', '📡', '🖥️', '🛏️',
  // Entertainment & Leisure
  '🎬', '🍿', '🎮', '🎧', '🎵', '🎟️', '🎨', '📸', '🎤', '🎪', '🎳', '🎯', '🎰', '🎸', '🎹',
  // Shopping & Apparel
  '🛍️', '👕', '👗', '👠', '👟', '👜', '💄', '💍', '🕶️', '⌚', '🎒', '🧢',
  // Friends, Social & Gifts
  '🤝', '🎁', '🎉', '💐', '🎂', '💌', '🎈', '👥', '🥂', '🍻', '🎊',
  // Health, Fitness & Personal Care
  '🩺', '💊', '🏋️', '🧘', '💈', '💅', '🦷', '⚽', '🏀', '🏊', '🚴', '🩹', '🧼',
  // Education & Work
  '📚', '🎓', '✏️', '🔬', '💻', '💼', '📊', '📈', '📝', '📂', '📐',
  // Income, Finance & Crypto
  '💰', '💵', '💳', '🪙', '🏦', '💎', '🧾', '🏷️', '🔄', '💸', '🤑',
];

const COLOR_OPTIONS = [
  '#F59E0B', '#10B981', '#8B5CF6', '#3B82F6', '#EC4899',
  '#A855F7', '#14B8A6', '#06B6D4', '#6366F1', '#F43F5E', '#64748B', '#0284C7',
];

const CategoryManagerBody = ({
  theme,
  categories,
  activeTab,
  setActiveTab,
  showAddForm,
  setShowAddForm,
  newCatName,
  setNewCatName,
  selectedEmoji,
  setSelectedEmoji,
  selectedColor,
  setSelectedColor,
  editingCategory,
  setEditingCategory,
  editName,
  setEditName,
  editEmoji,
  setEditEmoji,
  editColor,
  setEditColor,
  setDeletingCategory,
  categoryList,
  handleCreateCategory,
  handleStartEdit,
  handleSaveEdit,
  t,
}) => {
  const { scrollToInput } = useSheetScroll();

  return (
    <View style={{ paddingTop: 4 }}>
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
            {t('expense_categories', 'Expense Categories')} ({categories.expense?.length || 0})
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
            {t('income_categories', 'Income Categories')} ({categories.income?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

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
            onFocus={scrollToInput}
          />

          {/* Emoji choices */}
          <Text style={[styles.pickerLabel, { color: theme.textMuted }]}>Choose Emoji Icon</Text>
          <ScrollView
            style={{ height: 136 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}
          >
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
            onFocus={scrollToInput}
          />

          {/* Emoji choices */}
          <Text style={[styles.pickerLabel, { color: theme.textMuted }]}>Select Emoji Icon</Text>
          <ScrollView
            style={{ height: 136 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}
          >
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
      <View style={styles.catList}>
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
                  <Text style={[styles.catName, { color: theme.text }]}>{t(cat.name, cat.name)}</Text>
                  {cat.isCustom && (
                    <Text style={[styles.customBadge, { color: theme.primaryLight }]}>{t('custom', 'Custom')}</Text>
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
                  <Text style={[styles.actionBtnText, { color: theme.primaryLight }]}>{t('edit', 'Edit')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDeletingCategory(cat)}
                  style={[styles.actionBtn, { backgroundColor: `${theme.danger}15`, borderColor: theme.border }]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="trash-outline" size={15} color={theme.danger} />
                  <Text style={[styles.actionBtnText, { color: theme.danger }]}>{t('delete', 'Delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export const CategoryManagerModal = ({ visible, onClose }) => {
  const { theme, categories, addCategory, editCategory, deleteCategory, t } = useFinance();

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

  // Delete & Notice State
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);

  const categoryList = categories[activeTab] || [];

  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setModalAlert({
        title: t('missing_info', 'Missing Name'),
        message: 'Please enter a category name.',
        type: 'danger',
      });
      return;
    }

    addCategory({
      name: trimmed,
      emoji: selectedEmoji,
      color: selectedColor,
      type: activeTab,
    });

    setNewCatName('');
    setShowAddForm(false);
    setModalAlert({
      title: 'Category Created',
      message: `Category "${trimmed}" created successfully!`,
      type: 'success',
    });
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
    const trimmed = editName.trim();
    if (!trimmed) {
      setModalAlert({
        title: t('missing_info', 'Missing Name'),
        message: 'Please enter a category name.',
        type: 'danger',
      });
      return;
    }

    if (editCategory) {
      editCategory({
        id: editingCategory.id,
        name: trimmed,
        emoji: editEmoji,
        color: editColor,
        type: activeTab,
      });
      setModalAlert({
        title: 'Category Updated',
        message: `Category "${trimmed}" updated successfully!`,
        type: 'success',
      });
      setEditingCategory(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    const catId = deletingCategory.id;

    deleteCategory(activeTab, catId);
    setDeletingCategory(null);
  };

  return (
    <KeyboardSheetModal
      visible={visible}
      onClose={onClose}
      title={t('manage_categories', 'Manage Categories')}
      subtitle={`${categoryList.length} ${t(activeTab, activeTab)} ${t('categories', 'categories')} • ${t('edit_or_delete_anytime', 'Edit or delete anytime')}`}
      icon="pricetags-outline"
      iconColor={theme.primaryLight}
      overlayChildren={
        <>
          <ConfirmDeleteModal
            useModal={false}
            visible={!!deletingCategory}
            onClose={() => setDeletingCategory(null)}
            onConfirm={handleConfirmDelete}
            title={`Delete "${deletingCategory?.name}"?`}
            message="Are you sure you want to remove this category? Existing transactions will retain their history."
            confirmText="Yes, Delete"
          />
          <ConfirmDeleteModal
            useModal={false}
            visible={!!modalAlert}
            onClose={() => setModalAlert(null)}
            onConfirm={() => setModalAlert(null)}
            title={modalAlert?.title || 'Notice'}
            message={modalAlert?.message || ''}
            type={modalAlert?.type || 'success'}
            showCancel={false}
            confirmText="OK"
            confirmIcon={modalAlert?.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
          />
        </>
      }
    >
      <CategoryManagerBody
        theme={theme}
        categories={categories}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        selectedEmoji={selectedEmoji}
        setSelectedEmoji={setSelectedEmoji}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
        editName={editName}
        setEditName={setEditName}
        editEmoji={editEmoji}
        setEditEmoji={setEditEmoji}
        editColor={editColor}
        setEditColor={setEditColor}
        setDeletingCategory={setDeletingCategory}
        categoryList={categoryList}
        handleCreateCategory={handleCreateCategory}
        handleStartEdit={handleStartEdit}
        handleSaveEdit={handleSaveEdit}
        t={t}
      />
    </KeyboardSheetModal>
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
