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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance, DEFAULT_FRIEND_CATEGORIES } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { ReceiptImageShareModal } from './ReceiptImageShareModal';

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
}) => {
  const {
    theme,
    currency,
    settleFriendDebt,
    deleteFriendAccount,
    deleteLendingRecord,
    userUpiSettings,
    friendCategories = DEFAULT_FRIEND_CATEGORIES,
    addFriendCategory,
    deleteFriendCategory,
  } = useFinance();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmountType, setRequestAmountType] = useState('full'); // 'full' | 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [isExpandedPopup, setIsExpandedPopup] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [showImageShare, setShowImageShare] = useState(false);
  const [selectedTxForImage, setSelectedTxForImage] = useState(null);

  // Custom Friend Category Creator state (Friends tab only)
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍽️');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');

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
    return list;
  }, [friend?.transactions, selectedCatFilter, searchFilter]);

  if (!visible || !friend) return null;

  const handleSendWhatsAppRequest = async () => {
    const upiId = userUpiSettings?.upiId || '';
    const payeeName = userUpiSettings?.payeeName || 'WealthFlow User';

    let amountToRequest = absBalance;
    if (requestAmountType === 'custom') {
      const num = parseFloat(customAmount);
      if (isNaN(num) || num <= 0) {
        alert('Please enter a valid request amount');
        return;
      }
      amountToRequest = num;
    }

    if (amountToRequest <= 0) {
      alert('There is no unsettled balance to request');
      return;
    }

    const upiLink = upiId
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountToRequest}&cu=INR`
      : '';

    const message = `Hi ${friend.name}! 👋\n\nfriendly reminder regarding our pending balance:\n💵 *Amount Due: ${currency.symbol}${amountToRequest}*\n\n${
      upiId ? `💳 *Pay via UPI ID:* ${upiId}\n📱 *Pay Directly:* ${upiLink}\n\n` : ''
    }Thank you!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(whatsappUrl);
      } else {
        alert('Could not open WhatsApp directly. You can copy the message.');
      }
    } catch (e) {
      console.warn(e);
      window.open && window.open(whatsappUrl, '_blank');
    }

    setShowRequestModal(false);
  };

  const handleSendDirectSMS = async () => {
    let amountToRequest = absBalance;
    if (requestAmountType === 'custom') {
      const num = parseFloat(customAmount);
      if (isNaN(num) || num <= 0) {
        alert('Please enter a valid request amount');
        return;
      }
      amountToRequest = num;
    }

    if (amountToRequest <= 0) {
      alert('There is no unsettled balance to request');
      return;
    }

    const upiId = userUpiSettings?.upiId || '';
    const payeeName = userUpiSettings?.payeeName || 'WealthFlow User';
    const upiLink = upiId
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountToRequest}&cu=INR`
      : '';

    const message = `Hi ${friend.name}, friendly reminder regarding our pending balance: ${currency.symbol}${amountToRequest}.${upiId ? ` Pay via UPI: ${upiId} (${upiLink})` : ''} Thank you!`;
    const smsUrl = Platform.OS === 'ios'
      ? `sms:&body=${encodeURIComponent(message)}`
      : `sms:?body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(smsUrl);
      } else {
        alert('Could not launch SMS app.');
      }
    } catch (e) {
      console.warn(e);
      alert('Could not launch SMS app: ' + e.message);
    }

    setShowRequestModal(false);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      alert('Please enter a category name (e.g. Goa Trip, Chai Split)');
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
      alert('Could not add category: ' + e.message);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          <View
            style={[
              styles.card,
              isExpandedPopup && styles.cardExpanded,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.friendInfo, { flex: 1 }]}>
                <View style={[styles.avatar, { backgroundColor: `${theme.primary}25` }]}>
                  <Text style={[styles.avatarText, { color: theme.primaryLight }]}>
                    {friend.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                    {friend.name}
                  </Text>
                  <Text style={[styles.friendStatus, { color: isOwed ? theme.success : theme.danger }]} numberOfLines={1}>
                    {isOwed ? 'Owes you money' : 'You owe this contact'}
                  </Text>
                </View>
              </View>

              {/* Header Action Buttons: Expand Pop-up & Close */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setIsExpandedPopup(!isExpandedPopup)}
                  style={[styles.headerIconBtn, { backgroundColor: theme.cardAlt }]}
                  accessibilityLabel="Expand to Pop-up Display"
                >
                  <Ionicons
                    name={isExpandedPopup ? 'contract-outline' : 'expand-outline'}
                    size={18}
                    color={theme.primaryLight}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
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
                {isOwed ? 'TOTAL RECEIVABLE' : 'TOTAL PAYABLE'}
              </Text>
              <Text style={[styles.heroAmount, { color: isOwed ? theme.success : theme.danger }]}>
                {isOwed ? '+' : '-'}{formatCurrency(absBalance, currency.symbol)}
              </Text>
            </View>

            {/* Quick Action Buttons: WhatsApp, Direct SMS & Share Image */}
            <View style={styles.actionsRow}>
              {/* WhatsApp Friendly Reminder */}
              {isOwed && absBalance > 0 && (
                <TouchableOpacity
                  onPress={() => setShowRequestModal(true)}
                  style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              )}

              {/* Direct SMS Reminder */}
              {isOwed && absBalance > 0 && (
                <TouchableOpacity
                  onPress={() => setShowRequestModal(true)}
                  style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>Direct SMS</Text>
                </TouchableOpacity>
              )}

              {/* Share Image to WhatsApp */}
              <TouchableOpacity
                onPress={() => setShowImageShare(true)}
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="image-outline" size={16} color="#FFF" />
                <Text style={styles.actionBtnText}>Share Image</Text>
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
                <Text style={[styles.subBtnText, { color: theme.text }]}>Add Entry</Text>
              </TouchableOpacity>

              {absBalance > 0 && (
                <TouchableOpacity
                  onPress={() => settleFriendDebt(friend.name)}
                  style={[styles.subBtn, { backgroundColor: `${theme.success}25` }]}
                >
                  <Ionicons name="checkmark-done" size={16} color={theme.success} />
                  <Text style={[styles.subBtnText, { color: theme.success }]}>Mark Settled</Text>
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
                <Text style={[styles.subBtnText, { color: theme.danger }]}>Clear Friend</Text>
              </TouchableOpacity>
            </View>

            {/* Search Filter if in Expanded View */}
            {isExpandedPopup && (
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
              <TouchableOpacity
                onPress={() => setIsExpandedPopup(!isExpandedPopup)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name={isExpandedPopup ? 'contract' : 'scan-outline'} size={14} color={theme.primaryLight} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primaryLight }}>
                  {isExpandedPopup ? 'Standard View' : 'Expand Pop-up'}
                </Text>
              </TouchableOpacity>
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

                <TouchableOpacity
                  onPress={() => setShowAddCatModal(true)}
                  style={[
                    styles.fCatFilterChip,
                    {
                      backgroundColor: `${theme.primary}18`,
                      borderColor: `${theme.primary}50`,
                      borderStyle: 'dashed',
                    },
                  ]}
                >
                  <Ionicons name="add" size={14} color={theme.primaryLight} />
                  <Text style={[styles.fCatFilterText, { color: theme.primaryLight }]}>
                    New Category
                  </Text>
                </TouchableOpacity>
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
                        styles.txItem,
                        { backgroundColor: theme.cardAlt, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.txLeft}>
                        <View style={[styles.txBadge, { backgroundColor: isLent ? theme.successBg : theme.dangerBg }]}>
                          <Ionicons
                            name={isLent ? 'arrow-up-circle' : 'arrow-down-circle'}
                            size={16}
                            color={isLent ? theme.success : theme.danger}
                          />
                        </View>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                            {t.note || (isLent ? 'Money Lent' : 'Money Borrowed')}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                            <Text style={[styles.txDate, { color: theme.textMuted }]}>
                              {formatDateDisplay(t.date)} • {t.status?.toUpperCase() || 'PENDING'}
                            </Text>
                            {(t.friendCategoryName || t.categoryName) && (
                              <View style={[styles.fCatBadge, { backgroundColor: `${theme.primary}20` }]}>
                                <Text style={{ fontSize: 10 }}>{t.friendCategoryEmoji || '🤝'}</Text>
                                <Text style={[styles.fCatBadgeText, { color: theme.primaryLight }]}>
                                  {t.friendCategoryName || t.categoryName}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text
                          style={[
                            styles.txAmount,
                            { color: isLent ? theme.success : theme.danger },
                          ]}
                        >
                          {isLent ? '+' : '-'}{formatCurrency(t.amount, currency.symbol)}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          {/* Share single entry as image */}
                          <TouchableOpacity
                            onPress={() => setSelectedTxForImage({
                              ...t,
                              title: `${isLent ? 'Loan to' : 'Borrow from'} ${friend.name}: ${t.note || 'Cash'}`,
                            })}
                          >
                            <Ionicons name="image-outline" size={15} color={theme.primaryLight} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteLendingRecord(t.id)}>
                            <Ionicons name="trash-outline" size={15} color={theme.danger} />
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

        {/* UPI Request Config Overlay (View-based to prevent Android nested modal white screens) */}
        {showRequestModal && (
          <View style={[StyleSheet.absoluteFillObject, styles.subModalOverlay, { backgroundColor: theme.modalOverlay, zIndex: 100 }]}>
            <View style={[styles.requestCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Send Payment Request</Text>
                <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
                Send a friendly reminder to <Text style={{ fontWeight: '700', color: theme.text }}>{friend.name}</Text> with your UPI payment details.
              </Text>

              {/* Amount options */}
              <View style={styles.amountOptions}>
                <TouchableOpacity
                  onPress={() => setRequestAmountType('full')}
                  style={[
                    styles.amountOption,
                    {
                      backgroundColor: requestAmountType === 'full' ? theme.primary : theme.cardAlt,
                      borderColor: requestAmountType === 'full' ? theme.primaryLight : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.amountOptionLabel, { color: requestAmountType === 'full' ? '#FFF' : theme.textMuted }]}>
                    Full Pending Balance
                  </Text>
                  <Text style={[styles.amountOptionVal, { color: requestAmountType === 'full' ? '#FFF' : theme.text }]}>
                    {formatCurrency(absBalance, currency.symbol)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRequestAmountType('custom')}
                  style={[
                    styles.amountOption,
                    {
                      backgroundColor: requestAmountType === 'custom' ? theme.primary : theme.cardAlt,
                      borderColor: requestAmountType === 'custom' ? theme.primaryLight : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.amountOptionLabel, { color: requestAmountType === 'custom' ? '#FFF' : theme.textMuted }]}>
                    Custom Amount
                  </Text>
                  {requestAmountType === 'custom' ? (
                    <TextInput
                      style={[styles.customInput, { color: '#FFF' }]}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#FFF8"
                      value={customAmount}
                      onChangeText={setCustomAmount}
                      autoFocus
                    />
                  ) : (
                    <Text style={[styles.amountOptionVal, { color: theme.textMuted }]}>Enter amount</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Send buttons: WhatsApp & Direct SMS */}
              <View style={styles.sendButtonsRow}>
                <TouchableOpacity
                  onPress={handleSendWhatsAppRequest}
                  style={[styles.sendBtn, { backgroundColor: '#25D366' }]}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                  <Text style={styles.sendBtnText}>Send WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendDirectSMS}
                  style={[styles.sendBtn, { backgroundColor: '#3B82F6' }]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
                  <Text style={styles.sendBtnText}>Send Direct SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Dedicated Custom Category Creator Overlay for Friends Tab */}
        {showAddCatModal && (
          <View style={[StyleSheet.absoluteFillObject, styles.subModalOverlay, { backgroundColor: theme.modalOverlay, zIndex: 101 }]}>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  cardExpanded: {
    maxHeight: '96%',
    height: '96%',
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
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 10,
    marginTop: 1,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  requestCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalHelp: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  amountOptions: {
    gap: 10,
    marginBottom: 16,
  },
  amountOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  amountOptionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountOptionVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  customInput: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    padding: 0,
  },
  sendButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: 'rgba(0,0,0,0.65)',
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
