import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Platform,
  SafeAreaView,
  Image,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance, DEFAULT_FRIEND_CATEGORIES } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { ReceiptImageShareModal } from './ReceiptImageShareModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const POPULAR_EMOJIS = [
  '🍽️', '🚗', '🎬', '🛒', '⚡', '💵', '🎁', '🤝',
  '☕', '🍻', '🍕', '✈️', '🎮', '🏠', '🍿', '🚴',
  '🏥', '🎉', '🏖️', '🛍️'
];

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'
];

export const FriendDetailModal = ({
  visible,
  onClose,
  friend,
  onOpenAddEntry,
  onOpenReminder,
  onEditTransaction,
}) => {
  const {
    theme,
    currency,
    settleFriendDebt,
    deleteFriendAccount,
    deleteLendingRecord,
    friendCategories = DEFAULT_FRIEND_CATEGORIES,
    addFriendCategory,
    editFriendCategory,
    deleteFriendCategory,
    resetFriendCategoriesToDefault,
    t,
  } = useFinance();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [showImageShare, setShowImageShare] = useState(false);
  const [selectedTxForImage, setSelectedTxForImage] = useState(null);
  const [showManageCatsModal, setShowManageCatsModal] = useState(false);

  // Custom Friend Category Creator state (Friends tab only)
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍽️');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [deletingCat, setDeletingCat] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);

  // Friend Category Editing & Inline Delete state
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('🍽️');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [inlineDeletingCatId, setInlineDeletingCatId] = useState(null);

  const isOwed = (friend?.balance || 0) >= 0;
  const absBalance = Math.abs(friend?.balance || 0);

  const friendCategoriesInUse = useMemo(() => {
    if (!friend?.transactions) return [];
    const map = new Map();
    (friend.transactions || []).forEach((t) => {
      const id = t.friendCategoryId || t.categoryId;
      const name = t.friendCategoryName || t.categoryName || 'General';
      const emoji = t.friendCategoryEmoji || t.categoryEmoji || '🤝';
      if (id && !map.has(id)) {
        map.set(id, { id, name, emoji });
      }
    });
    return Array.from(map.values());
  }, [friend?.transactions]);

  const filteredTransactions = useMemo(() => {
    if (!friend?.transactions) return [];
    let list = friend.transactions || [];
    if (selectedCatFilter !== 'ALL') {
      list = list.filter(
        (t) =>
          t.friendCategoryId === selectedCatFilter ||
          t.categoryId === selectedCatFilter ||
          t.friendCategoryName === selectedCatFilter
      );
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.friendCategoryName && t.friendCategoryName.toLowerCase().includes(q)) ||
          String(t.amount).includes(q) ||
          (t.date && t.date.includes(q))
      );
    }
    return [...list].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [friend?.transactions, selectedCatFilter, searchFilter]);

  if (!visible || !friend) return null;

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
        setSelectedCatFilter(created.id);
      }
      setNewCatName('');
      setShowAddCatModal(false);
    } catch (e) {
      setModalAlert({ title: 'Category Error', message: 'Could not add category: ' + e.message, type: 'danger' });
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
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
              <View style={[styles.friendInfo, { flex: 1 }]}>
                <View style={[styles.avatar, { backgroundColor: `${theme.primary}25` }]}>
                  {friend.photoUri ? (
                    <Image source={{ uri: friend.photoUri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  ) : friend.avatarEmoji ? (
                    <Text style={{ fontSize: 24 }}>{friend.avatarEmoji}</Text>
                  ) : (
                    <Text style={[styles.avatarText, { color: theme.primaryLight }]}>
                      {friend.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                    {friend.name}
                  </Text>
                  <Text style={[styles.friendStatus, { color: isOwed ? theme.success : theme.danger }]} numberOfLines={1}>
                    {isOwed ? t('owes_you', 'Owes you money') : t('you_owe', 'You owe this contact')}
                  </Text>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Hero Balance Box */}
            <View
              style={[
                styles.heroBox,
                {
                  backgroundColor: isOwed ? theme.successBg : theme.dangerBg,
                  borderColor: isOwed ? theme.success : theme.danger,
                },
              ]}
            >
              <Text style={[styles.heroLabel, { color: isOwed ? theme.success : theme.danger }]}>
                {isOwed ? t('TOTAL RECEIVABLE', 'TOTAL RECEIVABLE') : t('TOTAL PAYABLE', 'TOTAL PAYABLE')}
              </Text>
              <Text style={[styles.heroAmount, { color: isOwed ? theme.success : theme.danger }]}>
                {isOwed ? '+' : '-'}{formatCurrency(absBalance, currency.symbol)}
              </Text>
            </View>

            {/* Quick Action Buttons: Payment Reminder & Share Statement */}
            <View style={styles.actionsRow}>
              {/* Payment Reminder */}
              {isOwed && absBalance > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    if (onOpenReminder) {
                      onOpenReminder(friend);
                    }
                  }}
                  style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText} numberOfLines={1}>{t('Payment Reminder', 'Payment Reminder')}</Text>
                </TouchableOpacity>
              )}

              {/* Share Statement */}
              <TouchableOpacity
                onPress={() => setShowImageShare(true)}
                style={[
                  styles.actionBtn,
                  { backgroundColor: isOwed && absBalance > 0 ? theme.primary : '#25D366' },
                ]}
              >
                <Ionicons name="share-social-outline" size={16} color="#FFF" />
                <Text style={styles.actionBtnText} numberOfLines={1}>{t('share_statement', 'Share Statement')}</Text>
              </TouchableOpacity>
            </View>

            {/* New Entry and Settle controls */}
            <View style={styles.subActionsRow}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenAddEntry(friend.name);
                }}
                style={[styles.subBtn, { backgroundColor: theme.cardAlt }]}
              >
                <Ionicons name="add" size={16} color={theme.text} />
                <Text style={[styles.subBtnText, { color: theme.text }]}>{t('add', 'Add Entry')}</Text>
              </TouchableOpacity>

              {absBalance > 0 && (
                <TouchableOpacity
                  onPress={() => settleFriendDebt(friend.name)}
                  style={[styles.subBtn, { backgroundColor: `${theme.success}25` }]}
                >
                  <Ionicons name="checkmark-done" size={16} color={theme.success} />
                  <Text style={[styles.subBtnText, { color: theme.success }]}>{t('settled', 'Mark Settled')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  deleteFriendAccount(friend.name);
                  onClose();
                }}
                style={[styles.subBtn, { backgroundColor: theme.dangerBg }]}
              >
                <Ionicons name="trash-outline" size={16} color={theme.danger} />
                <Text style={[styles.subBtnText, { color: theme.danger }]}>{t('clear_debt', 'Clear Friend')}</Text>
              </TouchableOpacity>
            </View>

            {/* Search Filter inside friend transactions */}
            {(friend.transactions?.length > 2 || searchFilter.length > 0) && (
              <View style={[styles.expandedSearchBar, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                <Ionicons name="search-outline" size={16} color={theme.textMuted} />
                <TextInput
                  style={[styles.expandedSearchInput, { color: theme.text }]}
                  placeholder={`Search ${friend.name}'s transactions...`}
                  placeholderTextColor={theme.textMuted}
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                />
                {searchFilter.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchFilter('')}>
                    <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Transaction History Section Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Transaction History ({filteredTransactions.length})
              </Text>
            </View>

            {/* Isolated Friend Custom Categories Filter Pills (Friends tab only) */}
            <View style={{ marginBottom: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fCatFilterScroll}>
                <TouchableOpacity
                  onPress={() => setSelectedCatFilter('ALL')}
                  style={[
                    styles.fCatFilterChip,
                    {
                      backgroundColor: selectedCatFilter === 'ALL' ? theme.primary : theme.cardAlt,
                      borderColor: selectedCatFilter === 'ALL' ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.fCatFilterText, { color: selectedCatFilter === 'ALL' ? '#FFF' : theme.text }]}>
                    All ({friend.transactions?.length || 0})
                  </Text>
                </TouchableOpacity>

                {friendCategories.map((c) => {
                  const isSelected = selectedCatFilter === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCatFilter(isSelected ? 'ALL' : c.id)}
                      style={[
                        styles.fCatFilterChip,
                        {
                          backgroundColor: isSelected ? `${c.color || theme.primary}30` : theme.cardAlt,
                          borderColor: isSelected ? (c.color || theme.primary) : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12, marginRight: 4 }}>{c.emoji || '🤝'}</Text>
                      <Text
                        style={[
                          styles.fCatFilterText,
                          { color: isSelected ? (c.color || theme.primaryLight) : theme.text },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView style={styles.txList} showsVerticalScrollIndicator={false}>
              {filteredTransactions.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>No transactions found for this filter.</Text>
                </View>
              ) : (
                filteredTransactions.map((t) => {
                  const isLent = t.type === 'lent';
                  return (
                    <View
                      key={t.id}
                      style={[
                        styles.txCard,
                        {
                          backgroundColor: theme.cardAlt,
                          borderColor: theme.border,
                          borderLeftColor: isLent ? theme.success : theme.danger,
                          borderLeftWidth: 3.5,
                        },
                      ]}
                    >
                      {/* Top Row: Type Pill, Title & Amount */}
                      <View style={styles.txTopRow}>
                        <View style={styles.txTitleWrap}>
                          <View style={[styles.txBadge, { backgroundColor: isLent ? theme.successBg : theme.dangerBg }]}>
                            <Ionicons
                              name={isLent ? 'arrow-up-circle' : 'arrow-down-circle'}
                              size={16}
                              color={isLent ? theme.success : theme.danger}
                            />
                          </View>
                          <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                            {t.note || (isLent ? 'Money Lent' : 'Money Borrowed')}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.txAmount,
                            { color: isLent ? theme.success : theme.danger },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {isLent ? '+' : '-'}{formatCurrency(t.amount, currency.symbol)}
                        </Text>
                      </View>

                      {/* Bottom Row: Metadata & Actions */}
                      <View style={[styles.txBottomRow, { borderTopColor: `${theme.border}60` }]}>
                        <View style={styles.txMetaLeft}>
                          <Text style={[styles.txDate, { color: theme.textMuted }]}>
                            {formatDateDisplay(t.date)}
                          </Text>

                          {t.status === 'settled' && (
                            <View
                              style={[
                                styles.statusPill,
                                {
                                  backgroundColor: `${theme.success}18`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusPillText,
                                  { color: theme.success },
                                ]}
                              >
                                SETTLED
                              </Text>
                            </View>
                          )}

                          {(t.friendCategoryName || t.categoryName) && (
                            <View style={[styles.fCatBadge, { backgroundColor: `${theme.primary}20` }]}>
                              <Text style={{ fontSize: 10 }}>{t.friendCategoryEmoji || '🤝'}</Text>
                              <Text style={[styles.fCatBadgeText, { color: theme.primaryLight }]} numberOfLines={1}>
                                {t.friendCategoryName || t.categoryName}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Action Icons */}
                        <View style={styles.txActions}>
                          <TouchableOpacity
                            onPress={() => onEditTransaction && onEditTransaction(t)}
                            style={[styles.txIconBtn, { backgroundColor: `${theme.primary}18` }]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel="Edit Transaction"
                          >
                            <Ionicons name="create-outline" size={13} color={theme.primaryLight} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setSelectedTxForImage({
                              ...t,
                              title: `${isLent ? 'Loan to' : 'Borrow from'} ${friend.name}: ${t.note || 'Cash'}`,
                            })}
                            style={[styles.txIconBtn, { backgroundColor: `${theme.primary}18` }]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="image-outline" size={13} color={theme.primaryLight} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => deleteLendingRecord(t.id)}
                            style={[styles.txIconBtn, { backgroundColor: `${theme.danger}18` }]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={13} color={theme.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>

        {/* Dedicated Custom Category Creator Overlay for Friends Tab */}
        {showAddCatModal && (
          <View style={[StyleSheet.absoluteFillObject, styles.subModalOverlay, { backgroundColor: theme.modalOverlay, zIndex: 101 }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setShowAddCatModal(false)}
            />
            <View style={[styles.subModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Top Drag Pill */}
              <View style={styles.dragPillWrap}>
                <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
              </View>

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
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Category Name</Text>
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
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Choose Emoji</Text>
                <ScrollView
                  style={{ height: 136 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}
                >
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
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Choose Badge Color</Text>
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
        )}

        {/* Manage Friend Categories Overlay */}
        {showManageCatsModal && (
          <View style={[StyleSheet.absoluteFillObject, styles.subModalOverlay, { backgroundColor: theme.modalOverlay, zIndex: 102 }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => {
                setShowManageCatsModal(false);
                setEditingCat(null);
                setInlineDeletingCatId(null);
              }}
            />
            <View style={[styles.subModalCard, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: '85%' }]}>
              {/* Top Drag Pill */}
              <View style={styles.dragPillWrap}>
                <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
              </View>

              <View style={styles.subModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.iconBadgeSmall, { backgroundColor: `${theme.primary}25` }]}>
                    <Ionicons name="list" size={16} color={theme.primaryLight} />
                  </View>
                  <View>
                    <Text style={[styles.subModalTitle, { color: theme.text }]}>Manage Friend Categories</Text>
                    <Text style={[styles.subModalSub, { color: theme.textMuted }]}>Edit names, emojis, colors or delete</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => {
                  setShowManageCatsModal(false);
                  setEditingCat(null);
                  setInlineDeletingCatId(null);
                }}>
                  <Ionicons name="close" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Editing Category Card */}
              {editingCat && (
                <View style={{ padding: 12, backgroundColor: theme.cardAlt, borderRadius: 14, borderWidth: 1, borderColor: theme.primary, marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primaryLight, marginBottom: 6, textTransform: 'uppercase' }}>
                    Edit Category: {editingCat.name}
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, height: 40, marginBottom: 8 }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Category Name"
                    placeholderTextColor={theme.textMuted}
                  />
                  <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '700', marginBottom: 4 }}>SELECT EMOJI</Text>
                  <ScrollView
                    style={{ height: 124, marginBottom: 10 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 2 }}
                  >
                    {POPULAR_EMOJIS.map((em, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setEditEmoji(em)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: editEmoji === em ? `${theme.primary}35` : theme.inputBg,
                          borderWidth: editEmoji === em ? 2 : 1,
                          borderColor: editEmoji === em ? theme.primary : theme.border,
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{em}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setEditingCat(null)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.cardHover }}
                    >
                      <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 12 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        if (!editName.trim()) return;
                        await editFriendCategory({
                          id: editingCat.id,
                          name: editName.trim(),
                          emoji: editEmoji,
                          color: editColor,
                        });
                        setEditingCat(null);
                      }}
                      style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.primary }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <ScrollView style={{ marginVertical: 8, maxHeight: 260 }}>
                {friendCategories.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: theme.textMuted }}>No categories remaining.</Text>
                  </View>
                ) : (
                  friendCategories.map((c) => (
                    <View
                      key={c.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                        backgroundColor: theme.cardAlt,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 18 }}>{c.emoji || '🤝'}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }} numberOfLines={1}>{c.name}</Text>
                      </View>

                      {inlineDeletingCatId === c.id ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 11, color: theme.danger, fontWeight: '700' }}>Delete?</Text>
                          <TouchableOpacity
                            onPress={() => {
                              deleteFriendCategory(c.id);
                              setInlineDeletingCatId(null);
                            }}
                            style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.danger, borderRadius: 6 }}
                          >
                            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>Yes</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setInlineDeletingCatId(null)}
                            style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.cardHover, borderRadius: 6 }}
                          >
                            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>No</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingCat(c);
                              setEditName(c.name);
                              setEditEmoji(c.emoji || '🍽️');
                              setEditColor(c.color || '#3B82F6');
                            }}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              backgroundColor: `${theme.primary}20`,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="pencil-outline" size={14} color={theme.primaryLight} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setInlineDeletingCatId(c.id)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              backgroundColor: `${theme.danger}20`,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="trash-outline" size={14} color={theme.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
              {/* Redundant purple bottom button from Screenshot 6 removed completely */}
            </View>
          </View>
        )}

        {/* Photo 2 Styled Dialog for Delete Category */}
        <ConfirmDeleteModal
          useModal={false}
          visible={!!deletingCat}
          onClose={() => setDeletingCat(null)}
          onConfirm={() => {
            if (deletingCat) {
              deleteFriendCategory(deletingCat.id);
              setDeletingCat(null);
            }
          }}
          title="Delete Category?"
          message={`Are you sure you want to delete category "${deletingCat?.name}"?`}
          type="danger"
          confirmText="Delete"
          confirmIcon="trash-outline"
          showCancel={true}
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
      </Modal>

      {/* WhatsApp Image Statement Preview Modal */}
      <ReceiptImageShareModal
        visible={showImageShare}
        onClose={() => setShowImageShare(false)}
        type="friend"
        data={friend}
      />

      {/* WhatsApp Single Transaction Image Preview Modal */}
      <ReceiptImageShareModal
        visible={!!selectedTxForImage}
        onClose={() => setSelectedTxForImage(null)}
        type="transaction"
        data={selectedTxForImage}
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
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingVertical: 6,
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
    marginBottom: 14,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  friendName: {
    fontSize: 18,
    fontWeight: '800',
  },
  friendStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  heroBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  subBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 10,
    gap: 4,
  },
  subBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
  },
  expandedSearchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  txList: {
    marginTop: 4,
    maxHeight: 320,
  },
  txCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  txBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '900',
    maxWidth: 130,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  txMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 6,
  },
  txDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  txActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestCard: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  channelSegmentedWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 12,
  },
  channelTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  channelTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  channelIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  modalHelp: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  requestHeroCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  friendAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestFriendName: {
    fontSize: 14,
    fontWeight: '800',
  },
  requestFriendStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  amountDueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  amountDueText: {
    fontSize: 13,
    fontWeight: '900',
  },
  amountOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  amountOption: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  amountOptionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountOptionVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  customInputCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  customInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customCurrencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    marginRight: 6,
  },
  customTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    padding: 0,
  },
  upiCardContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  upiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  editUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  upiInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  upiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upiIdBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  upiPayeeText: {
    fontSize: 11,
  },
  upiLinkPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  upiLinkPreviewText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  sendPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendPrimaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  switchChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  switchChannelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fCatFilterScroll: {
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  fCatFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  fCatFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  fCatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Sub Modal for Creating Friend Category
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  subModalCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiRow: {
    gap: 8,
    paddingVertical: 4,
  },
  emojiChip: {
    width: 42,
    height: 42,
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
});
