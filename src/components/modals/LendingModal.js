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
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFinance, DEFAULT_FRIEND_CATEGORIES } from '../../context/FinanceContext';
import { formatDateDisplay } from '../../utils/formatters';
import { CalendarDatePickerModal } from '../common/CalendarDatePickerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const POPULAR_EMOJIS = [
  '🍽️', '🚗', '🎬', '🛒', '⚡', '💵', '🎁', '🤝',
  '☕', '🍻', '🍕', '✈️', '🎮', '🏠', '🍿', '🚴',
  '🏥', '🎉', '🏖️', '🛍️', '🎟️', '🍔', '🚌'
];

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'
];

const PERSON_AVATARS = [
  '👨‍💼', '👩‍💼', '🧔', '👱‍♀️', '🧑‍💻', '👵', '👴', '👮',
  '🧑‍🌾', '🧑‍🍳', '🧑‍🎓', '🧑‍🔬', '🧑‍🎨', '🧑‍✈️', '🦸', '🧕',
  '🧔‍♂️', '👩‍🦰', '👨‍🦱', '👩‍🦱', '🧑‍🦰', '🤠', '😎', '🧐'
];

export const LendingModal = ({ visible, onClose, initialFriend = '', initialData = null }) => {
  const {
    theme,
    currency,
    addLendingRecord,
    editLendingRecord,
    friendCategories = DEFAULT_FRIEND_CATEGORIES,
    addFriendCategory,
    deleteFriendCategory,
    resetFriendCategoriesToDefault,
    t,
  } = useFinance();

  const [friendName, setFriendName] = useState(initialFriend);
  const [type, setType] = useState('lent'); // 'lent' (they owe me) or 'borrowed' (I owe them)
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(friendCategories[0]?.id || 'fcat_dinner');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Person photo & avatar state
  const [photoUri, setPhotoUri] = useState(null);
  const [avatarEmoji, setAvatarEmoji] = useState('👤');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Manage Categories modal state
  const [showManageCatsModal, setShowManageCatsModal] = useState(false);

  // Custom Friend Category Creator state
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [deletingFriendCategory, setDeletingFriendCategory] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍽️');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');

  useEffect(() => {
    if (initialData) {
      setFriendName(initialData.friendName || initialFriend || '');
      setType(initialData.type || 'lent');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategoryId(initialData.friendCategoryId || initialData.categoryId || friendCategories[0]?.id || 'fcat_dinner');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setNote(initialData.note || '');
      setPhotoUri(initialData.photoUri || null);
      setAvatarEmoji(initialData.avatarEmoji || (initialData.photoUri ? null : '👤'));
    } else if (initialFriend) {
      setFriendName(initialFriend);
      setType('lent');
      setAmount('');
      setNote('');
      setPhotoUri(null);
      setAvatarEmoji('👤');
      setDate(new Date().toISOString().split('T')[0]);
    } else {
      setFriendName('');
      setType('lent');
      setAmount('');
      setNote('');
      setPhotoUri(null);
      setAvatarEmoji('👤');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, initialFriend, visible]);

  useEffect(() => {
    if (friendCategories && friendCategories.length > 0 && !friendCategories.some((c) => c.id === categoryId)) {
      setCategoryId(friendCategories[0].id);
    }
  }, [friendCategories]);

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setModalAlert({ title: 'Permission Needed', message: 'Please allow gallery access to select a photo from your device.', type: 'info' });
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (res.canceled) return;
      if (res.assets && res.assets.length > 0 && res.assets[0].uri) {
        setPhotoUri(res.assets[0].uri);
        setAvatarEmoji(null);
        setShowAvatarPicker(false);
      }
    } catch (e) {
      console.warn('Pick photo error:', e);
      setModalAlert({ title: 'Gallery Error', message: 'Could not open photo gallery: ' + (e.message || 'Error'), type: 'danger' });
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!friendName.trim()) {
      setModalAlert({ title: 'Validation', message: 'Please enter a friend or contact name', type: 'info' });
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalAlert({ title: 'Validation', message: 'Please enter a valid amount', type: 'info' });
      return;
    }

    const selectedCat = friendCategories.find((c) => c.id === categoryId) || friendCategories[0] || {
      id: 'fcat_other',
      name: 'Shared Expense',
      emoji: '🤝',
      color: '#64748B',
    };

    const recordPayload = {
      friendName: friendName.trim(),
      type,
      amount: numAmount,
      friendCategoryId: selectedCat.id,
      friendCategoryName: selectedCat.name,
      friendCategoryEmoji: selectedCat.emoji,
      categoryId: selectedCat.id,
      categoryName: selectedCat.name,
      categoryEmoji: selectedCat.emoji,
      categoryColor: selectedCat.color,
      date,
      note: note.trim(),
      photoUri: photoUri || null,
      avatarEmoji: photoUri ? null : (avatarEmoji || '👤'),
    };

    if (initialData?.id && editLendingRecord) {
      editLendingRecord({
        ...initialData,
        ...recordPayload,
      });
    } else {
      addLendingRecord(recordPayload);
    }

    setAmount('');
    setNote('');
    onClose();
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      setModalAlert({ title: 'Validation', message: 'Please enter a category name (e.g. Goa Trip, Chai Split)', type: 'info' });
      return;
    }

    try {
      const created = await addFriendCategory({
        name: newCatName.trim(),
        emoji: newCatEmoji || '🤝',
        color: newCatColor || '#3B82F6',
      });
      if (created?.id) {
        setCategoryId(created.id);
      }
      setNewCatName('');
      setShowAddCatModal(false);
    } catch (e) {
      setModalAlert({ title: 'Category Error', message: 'Could not add category: ' + e.message, type: 'danger' });
    }
  };

  const handleDeleteCategory = (cat) => {
    setDeletingFriendCategory(cat);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Top Drag / Grab Bar Pill for Uniform Presentation */}
            <View style={styles.dragPillWrap}>
              <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={[styles.iconBadge, { backgroundColor: `${theme.primary}25` }]}>
                  <Ionicons name="swap-horizontal" size={20} color={theme.primaryLight} />
                </View>
                <View>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {initialData ? 'Edit Friend Transaction' : 'Record Friend Loan / Debt'}
                  </Text>
                  <Text style={[styles.subText, { color: theme.textMuted }]}>
                    {initialData ? 'Update lending details & amount' : 'Track money given or taken'}
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
                  onPress={() => setType('lent')}
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t('total_lent', 'I Lent (Owed)')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType('borrowed')}
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
                    {t('total_borrowed', 'I Borrowed (I Owe)')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Person Photo / Avatar Picker */}
              <View style={styles.group}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Person Photo / Avatar</Text>
                <View style={styles.personPhotoRow}>
                  <TouchableOpacity
                    onPress={() => setShowAvatarPicker(true)}
                    style={[styles.personAvatarPreview, { backgroundColor: `${theme.primary}20`, borderColor: theme.border }]}
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.personPhotoImg} />
                    ) : (
                      <Text style={{ fontSize: 28 }}>{avatarEmoji || '👤'}</Text>
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1, gap: 6 }}>
                    <TouchableOpacity
                      onPress={handlePickFromGallery}
                      style={[styles.photoActionBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                    >
                      <Ionicons name="images-outline" size={15} color={theme.primaryLight} />
                      <Text style={[styles.photoActionText, { color: theme.text }]}>Upload Photo from Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowAvatarPicker(true)}
                      style={[styles.photoActionBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                    >
                      <Ionicons name="happy-outline" size={15} color={theme.primaryLight} />
                      <Text style={[styles.photoActionText, { color: theme.text }]}>Choose Built-in Avatar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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

              {/* Isolated Friend Custom Categories (Friends tab only) */}
              <View style={styles.group}>
                <View style={styles.catHeaderRow}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>
                    Friend Split Category
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setShowManageCatsModal(true)}
                      style={[styles.addCatHeaderBtn, { borderColor: `${theme.danger}40`, backgroundColor: `${theme.danger}15` }]}
                    >
                      <Ionicons name="trash-outline" size={13} color={theme.danger} />
                      <Text style={[styles.addCatHeaderText, { color: theme.danger }]}>
                        Manage
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowAddCatModal(true)}
                      style={styles.addCatHeaderBtn}
                    >
                      <Ionicons name="add-circle" size={14} color={theme.primaryLight} />
                      <Text style={[styles.addCatHeaderText, { color: theme.primaryLight }]}>
                        Add Category
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catRow}
                >
                  {friendCategories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setCategoryId(cat.id)}
                        onLongPress={() => handleDeleteCategory(cat)}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor: isSelected ? `${cat.color}25` : theme.inputBg,
                            borderColor: isSelected ? cat.color : theme.border,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 16, marginRight: 5 }}>{cat.emoji || '🤝'}</Text>
                        <Text
                          style={[
                            styles.catChipText,
                            { color: isSelected ? cat.color : theme.text },
                          ]}
                        >
                          {cat.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(cat)}
                          style={styles.delCatIcon}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}

                  {/* + Add Category Chip */}
                  <TouchableOpacity
                    onPress={() => setShowAddCatModal(true)}
                    style={[
                      styles.addCatChip,
                      {
                        backgroundColor: `${theme.primary}18`,
                        borderColor: `${theme.primary}50`,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={16} color={theme.primaryLight} />
                    <Text style={[styles.addCatChipText, { color: theme.primaryLight }]}>
                      New Category
                    </Text>
                  </TouchableOpacity>
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
                  {initialData ? t('save', 'Save Changes') : type === 'lent' ? `${t('save', 'Record')} (${t('total_lent', 'Lent')})` : `${t('save', 'Record')} (${t('total_borrowed', 'Borrowed')})`}
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

      {/* Modal to Create Dedicated Custom Category for Friends Tab */}
      <Modal
        visible={showAddCatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCatModal(false)}
      >
        <View style={[styles.subModalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.subModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.subModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.iconBadgeSmall, { backgroundColor: `${theme.primary}25` }]}>
                  <Ionicons name="pricetag" size={16} color={theme.primaryLight} />
                </View>
                <View>
                  <Text style={[styles.subModalTitle, { color: theme.text }]}>New Friend Category</Text>
                  <Text style={[styles.subModalSub, { color: theme.textMuted }]}>Friends Tab Only</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAddCatModal(false)}>
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 12 }}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Category Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="e.g. Goa Trip, Weekend Party, Chai Split"
                placeholderTextColor={theme.textMuted}
                value={newCatName}
                onChangeText={setNewCatName}
                autoFocus
              />
            </View>

            {/* Choose Emoji */}
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Choose Emoji</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
                {POPULAR_EMOJIS.map((emoji, idx) => (
                  <TouchableOpacity
                    key={`emoji_${idx}`}
                    onPress={() => setNewCatEmoji(emoji)}
                    style={[
                      styles.emojiChip,
                      newCatEmoji === emoji && { backgroundColor: `${theme.primary}30`, borderColor: theme.primary },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Choose Color */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Choose Badge Color</Text>
              <View style={styles.colorRow}>
                {CATEGORY_COLORS.map((color, idx) => (
                  <TouchableOpacity
                    key={`col_${idx}`}
                    onPress={() => setNewCatColor(color)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      newCatColor === color && styles.colorCircleSelected,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowAddCatModal(false)}
                style={[styles.cancelBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCategory}
                style={[styles.saveCatBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Create Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal to Manage & Delete ANY Friend Category */}
      <Modal
        visible={showManageCatsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManageCatsModal(false)}
      >
        <View style={[styles.subModalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.subModalCard, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: '80%' }]}>
            <View style={styles.subModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.iconBadgeSmall, { backgroundColor: `${theme.danger}25` }]}>
                  <Ionicons name="trash" size={16} color={theme.danger} />
                </View>
                <View>
                  <Text style={[styles.subModalTitle, { color: theme.text }]}>Manage Friend Categories</Text>
                  <Text style={[styles.subModalSub, { color: theme.textMuted }]}>
                    Delete or reset friend categories
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowManageCatsModal(false)}>
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginVertical: 12, maxHeight: 280 }}>
              {friendCategories.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted }}>No categories remaining. Create one below.</Text>
                </View>
              ) : (
                friendCategories.map((c) => (
                  <View
                    key={c.id}
                    style={[
                      styles.manageCatRow,
                      { backgroundColor: theme.cardAlt, borderColor: theme.border },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 20 }}>{c.emoji || '🤝'}</Text>
                      <Text style={[styles.manageCatName, { color: theme.text }]}>{c.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(c)}
                      style={[styles.manageDelBtn, { backgroundColor: `${theme.danger}20` }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setShowManageCatsModal(false)}
                style={[styles.saveCatBtn, { backgroundColor: theme.primary, width: '100%' }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal to Choose Built-in Person Avatar */}
      <Modal
        visible={showAvatarPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={[styles.subModalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.subModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.subModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.iconBadgeSmall, { backgroundColor: `${theme.primary}25` }]}>
                  <Ionicons name="happy" size={16} color={theme.primaryLight} />
                </View>
                <View>
                  <Text style={[styles.subModalTitle, { color: theme.text }]}>Choose Built-in Avatar</Text>
                  <Text style={[styles.subModalSub, { color: theme.textMuted }]}>Select an avatar for this person</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handlePickFromGallery}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: `${theme.primary}15`,
                borderWidth: 1,
                borderColor: theme.primary,
                borderRadius: 12,
                paddingVertical: 10,
                marginBottom: 12,
              }}
            >
              <Ionicons name="images" size={18} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
                Open Phone Photo Gallery
              </Text>
            </TouchableOpacity>

            <View style={styles.avatarGrid}>
              {PERSON_AVATARS.map((av, idx) => (
                <TouchableOpacity
                  key={`avatar_${idx}`}
                  onPress={() => {
                    setAvatarEmoji(av);
                    setPhotoUri(null);
                    setShowAvatarPicker(false);
                  }}
                  style={[
                    styles.avatarGridItem,
                    {
                      backgroundColor: avatarEmoji === av && !photoUri ? `${theme.primary}30` : theme.inputBg,
                      borderColor: avatarEmoji === av && !photoUri ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>{av}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {photoUri && (
              <TouchableOpacity
                onPress={() => {
                  setPhotoUri(null);
                  setAvatarEmoji('👤');
                  setShowAvatarPicker(false);
                }}
                style={[styles.removePhotoBtn, { borderColor: theme.danger }]}
              >
                <Ionicons name="trash-outline" size={15} color={theme.danger} />
                <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 13 }}>Remove Gallery Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Styled Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        useModal={false}
        visible={!!deletingFriendCategory}
        onClose={() => setDeletingFriendCategory(null)}
        onConfirm={() => {
          if (deletingFriendCategory) {
            deleteFriendCategory(deletingFriendCategory.id);
            if (categoryId === deletingFriendCategory.id) {
              setCategoryId(friendCategories.find((c) => c.id !== deletingFriendCategory.id)?.id || '');
            }
            setDeletingFriendCategory(null);
          }
        }}
        title="Delete Category?"
        message={`Are you sure you want to delete "${deletingFriendCategory?.name}"?`}
        confirmText="Yes, Delete"
        confirmIcon="trash-outline"
        type="danger"
      />

      {/* Photo 2 Styled Dialog for In-Modal Alerts */}
      <ConfirmDeleteModal
        useModal={false}
        visible={!!modalAlert}
        onClose={() => setModalAlert(null)}
        onConfirm={() => setModalAlert(null)}
        title={modalAlert?.title || 'Notice'}
        message={modalAlert?.message || ''}
        type={modalAlert?.type || 'info'}
        showCancel={false}
        confirmText="OK"
        confirmIcon={modalAlert?.type === 'success' ? 'checkmark-circle-outline' : modalAlert?.type === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'}
      />
    </>
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
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addCatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCatHeaderText: {
    fontSize: 12,
    fontWeight: '700',
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
    alignItems: 'center',
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
  delCatIcon: {
    marginLeft: 6,
    padding: 2,
  },
  addCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 4,
  },
  addCatChipText: {
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
  // Sub Modal for Creating Friend Category
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subModalSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  emojiRow: {
    gap: 8,
    paddingVertical: 4,
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCatBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  personPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  personAvatarPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  personPhotoImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  manageCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  manageCatName: {
    fontSize: 14,
    fontWeight: '700',
  },
  manageDelBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 14,
  },
  avatarGridItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
});
