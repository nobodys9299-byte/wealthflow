import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { generateLendingStatementPDF } from '../utils/pdfGenerator';
import { LendingModal } from '../components/modals/LendingModal';
import { FriendDetailModal } from '../components/modals/FriendDetailModal';
import { FriendReminderModal } from '../components/modals/FriendReminderModal';
import { ReceiptImageShareModal } from '../components/modals/ReceiptImageShareModal';

export const LendingScreen = ({ onNavigateTab, onBack, onOpenMore }) => {
  const {
    theme,
    currency,
    lendingSummary,
    settleFriendDebt,
    deleteFriendAccount,
  } = useFinance();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeFriend, setActiveFriend] = useState('');
  const [selectedFriendDetails, setSelectedFriendDetails] = useState(null);
  const [selectedReminderFriend, setSelectedReminderFriend] = useState(null);
  const [selectedShareFriend, setSelectedShareFriend] = useState(null);

  // Hardware back handler
  useEffect(() => {
    const handleBack = () => {
      if (selectedReminderFriend) {
        setSelectedReminderFriend(null);
        return true;
      }
      if (selectedShareFriend) {
        setSelectedShareFriend(null);
        return true;
      }
      if (selectedFriendDetails) {
        setSelectedFriendDetails(null);
        return true;
      }
      if (modalVisible) {
        setModalVisible(false);
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      if (onNavigateTab) {
        onNavigateTab('dashboard');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [selectedReminderFriend, selectedShareFriend, selectedFriendDetails, modalVisible, onBack, onNavigateTab]);

  const handleOpenAddForFriend = (friendName) => {
    setActiveFriend(friendName);
    setModalVisible(true);
  };

  const handleShareWhatsAppPDF = async (friend) => {
    await generateLendingStatementPDF(friend, currency.symbol);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header with More Menu Button */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
          <TouchableOpacity
            onPress={onOpenMore || (() => onNavigateTab && onNavigateTab('settings'))}
            style={[styles.menuBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityLabel="Open Menu"
          >
            <Ionicons name="menu-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: theme.text }]} numberOfLines={1}>
              Friends & Loans
            </Text>
            <Text style={[styles.subText, { color: theme.textMuted }]} numberOfLines={1}>
              Track money lent, borrowed & reminders
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            setActiveFriend('');
            setModalVisible(true);
          }}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText} numberOfLines={1}>New Loan</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Debt Balance Summary */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.heroLabel, { color: theme.textMuted }]}>NET DEBT POSITION</Text>
            <Text
              style={[
                styles.heroNetValue,
                { color: lendingSummary.netBalance >= 0 ? theme.success : theme.danger },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {lendingSummary.netBalance >= 0 ? '+' : ''}
              {formatCurrency(lendingSummary.netBalance, currency.symbol)}
            </Text>
          </View>
          {/* Modern Financial Split/Exchange Logo */}
          <View style={[styles.heroBadge, { backgroundColor: `${theme.primary}25` }]}>
            <Ionicons name="swap-horizontal" size={24} color={theme.primaryLight} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.heroBreakdown}>
          <View style={styles.breakdownCol}>
            <Text style={[styles.breakdownLabel, { color: theme.textMuted }]} numberOfLines={1}>
              You Are Owed (Lent)
            </Text>
            <Text style={[styles.breakdownVal, { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>
              +{formatCurrency(lendingSummary.totalLent, currency.symbol)}
            </Text>
          </View>

          <View style={styles.breakdownCol}>
            <Text style={[styles.breakdownLabel, { color: theme.textMuted }]} numberOfLines={1}>
              You Owe (Borrowed)
            </Text>
            <Text style={[styles.breakdownVal, { color: theme.danger }]} numberOfLines={1} adjustsFontSizeToFit>
              -{formatCurrency(lendingSummary.totalBorrowed, currency.symbol)}
            </Text>
          </View>
        </View>
      </View>

      {/* Friends List Header */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Friends & Contacts</Text>
          <View style={[styles.countBadge, { backgroundColor: `${theme.primary}20` }]}>
            <Text style={[styles.countBadgeText, { color: theme.primaryLight }]}>
              {lendingSummary.friends.length}
            </Text>
          </View>
        </View>
      </View>

      {lendingSummary.friends.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
          <View style={[styles.emptyIconBadge, { backgroundColor: `${theme.primary}20` }]}>
            <Ionicons name="swap-horizontal" size={32} color={theme.primaryLight} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Lending Records</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            Tap "New Loan" above to record money lent to or borrowed from friends.
          </Text>
        </View>
      ) : (
        lendingSummary.friends.map((friend) => {
          const isOwed = friend.balance >= 0;
          const isSettled = friend.balance === 0;

          return (
            <TouchableOpacity
              key={friend.name}
              activeOpacity={0.8}
              onPress={() => setSelectedFriendDetails(friend)}
              style={[
                styles.friendCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.friendInfo, { flex: 1, marginRight: 8 }]}>
                  <View style={[styles.friendAvatar, { backgroundColor: `${theme.primary}25` }]}>
                    <Text style={[styles.avatarText, { color: theme.primaryLight }]}>
                      {friend.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                      {friend.name}
                    </Text>
                    <Text style={[styles.friendMeta, { color: theme.textMuted }]} numberOfLines={1}>
                      {friend.transactions.length} record{friend.transactions.length !== 1 ? 's' : ''} • Tap for details
                    </Text>
                  </View>
                </View>

                {/* Amount / Balance */}
                <View style={{ alignItems: 'flex-end', maxWidth: 120 }}>
                  <Text
                    style={[
                      styles.friendBalance,
                      { color: isSettled ? theme.textMuted : isOwed ? theme.success : theme.danger },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {isSettled ? '' : isOwed ? '+' : '-'}{formatCurrency(Math.abs(friend.balance), currency.symbol)}
                  </Text>
                  <Text
                    style={[
                      styles.balanceSub,
                      { color: isSettled ? theme.textMuted : isOwed ? theme.success : theme.danger },
                    ]}
                    numberOfLines={1}
                  >
                    {isSettled ? 'Settled' : isOwed ? 'Owes You' : 'You Owe'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: WhatsApp Share, Entry & Settle */}
              <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                {/* Share Statement via WhatsApp */}
                <TouchableOpacity
                  onPress={() => setSelectedShareFriend(friend)}
                  style={[styles.shareBtn, { backgroundColor: '#25D36618', borderColor: '#25D36635' }]}
                >
                  <Ionicons name="share-social-outline" size={14} color="#25D366" />
                  <Text style={[styles.shareBtnText, { color: '#25D366' }]}>Share</Text>
                </TouchableOpacity>

                {/* Record New Entry for Friend */}
                <TouchableOpacity
                  onPress={() => handleOpenAddForFriend(friend.name)}
                  style={[styles.entryBtn, { backgroundColor: theme.cardAlt }]}
                >
                  <Ionicons name="add" size={14} color={theme.text} />
                  <Text style={[styles.entryBtnText, { color: theme.text }]}>Entry</Text>
                </TouchableOpacity>

                {/* Settle or Delete */}
                {!isSettled ? (
                  <TouchableOpacity
                    onPress={() => settleFriendDebt(friend.name)}
                    style={[styles.settleBtn, { backgroundColor: `${theme.success}18` }]}
                  >
                    <Ionicons name="checkmark-done" size={14} color={theme.success} />
                    <Text style={[styles.settleBtnText, { color: theme.success }]}>Settle</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => deleteFriendAccount(friend.name)}
                    style={[styles.deleteFriendBtn, { backgroundColor: `${theme.danger}18` }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.danger} />
                    <Text style={[styles.deleteFriendBtnText, { color: theme.danger }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Lending Modal */}
      <LendingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialFriend={activeFriend}
      />

      {/* Friend Detail Dialogue Box */}
      <FriendDetailModal
        visible={!!selectedFriendDetails}
        friend={selectedFriendDetails}
        onClose={() => setSelectedFriendDetails(null)}
        onOpenAddEntry={handleOpenAddForFriend}
        onOpenReminder={(friend) => setSelectedReminderFriend(friend)}
      />

      {/* Dedicated Friend Payment Reminder Dialogue Box */}
      <FriendReminderModal
        visible={!!selectedReminderFriend}
        friend={selectedReminderFriend}
        onClose={() => setSelectedReminderFriend(null)}
        onBackToDetails={(friend) => {
          setSelectedReminderFriend(null);
          setSelectedFriendDetails(friend);
        }}
      />

      {/* WhatsApp Image Statement Preview Modal */}
      <ReceiptImageShareModal
        visible={!!selectedShareFriend}
        onClose={() => setSelectedShareFriend(null)}
        type="friend"
        data={selectedShareFriend}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 90,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroNetValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  heroBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  expandBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  friendCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  friendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
  },
  friendMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  friendBalance: {
    fontSize: 16,
    fontWeight: '900',
  },
  balanceSub: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  shareBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  entryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  entryBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  settleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteFriendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  deleteFriendBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Popup Modal Styles
  popupContainer: {
    flex: 1,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  popupIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  popupSub: {
    fontSize: 11,
    marginTop: 2,
  },
  popupCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  summaryRibbon: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  ribbonItem: {
    flex: 1,
    alignItems: 'center',
  },
  ribbonLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  ribbonVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  ribbonDivider: {
    width: 1,
    height: '100%',
  },
  popupScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  popupFriendCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  popupCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  popupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  popupBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
