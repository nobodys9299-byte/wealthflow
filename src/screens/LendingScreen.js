import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { generateLendingStatementPDF } from '../utils/pdfGenerator';
import { LendingModal } from '../components/modals/LendingModal';
import { FriendDetailModal } from '../components/modals/FriendDetailModal';

export const LendingScreen = () => {
  const {
    theme,
    currency,
    lendingSummary,
    lendingRecords,
    settleFriendDebt,
    deleteLendingRecord,
  } = useFinance();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeFriend, setActiveFriend] = useState('');
  const [selectedFriendDetails, setSelectedFriendDetails] = useState(null);

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
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Friends & Loans</Text>
          <Text style={[styles.subText, { color: theme.textMuted }]}>
            Track money lent, borrowed & WhatsApp statements
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setActiveFriend('');
            setModalVisible(true);
          }}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>New Loan</Text>
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
          <View>
            <Text style={[styles.heroLabel, { color: theme.textMuted }]}>NET DEBT POSITION</Text>
            <Text
              style={[
                styles.heroNetValue,
                { color: lendingSummary.netBalance >= 0 ? theme.success : theme.danger },
              ]}
            >
              {lendingSummary.netBalance >= 0 ? '+' : ''}
              {formatCurrency(lendingSummary.netBalance, currency.symbol)}
            </Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: `${theme.primary}25` }]}>
            <Text style={{ fontSize: 20 }}>🤝</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.heroBreakdown}>
          <View style={styles.breakdownCol}>
            <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>You Are Owed (Lent)</Text>
            <Text style={[styles.breakdownVal, { color: theme.success }]}>
              +{formatCurrency(lendingSummary.totalLent, currency.symbol)}
            </Text>
          </View>

          <View style={styles.breakdownCol}>
            <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>You Owe (Borrowed)</Text>
            <Text style={[styles.breakdownVal, { color: theme.danger }]}>
              -{formatCurrency(lendingSummary.totalBorrowed, currency.symbol)}
            </Text>
          </View>
        </View>
      </View>

      {/* Friends List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Friends & Contacts</Text>
        <Text style={[styles.countText, { color: theme.textMuted }]}>
          {lendingSummary.friends.length} Contacts
        </Text>
      </View>

      {lendingSummary.friends.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
          <Text style={{ fontSize: 36 }}>🤝</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Lending Records</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            Tap "New Loan" above to record money lent to or borrowed from friends.
          </Text>
        </View>
      ) : (
        lendingSummary.friends.map((friend) => {
          const isOwed = friend.balance >= 0;
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
                <View style={styles.friendInfo}>
                  <View style={[styles.friendAvatar, { backgroundColor: `${theme.primary}25` }]}>
                    <Text style={[styles.avatarText, { color: theme.primaryLight }]}>
                      {friend.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.friendName, { color: theme.text }]}>{friend.name}</Text>
                    <Text style={[styles.friendMeta, { color: theme.textMuted }]}>
                      {friend.transactions.length} records • Tap for history & UPI request
                    </Text>
                  </View>
                </View>

                {/* Amount */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.friendBalance,
                      { color: isOwed ? theme.success : theme.danger },
                    ]}
                  >
                    {isOwed ? '+' : '-'}{formatCurrency(Math.abs(friend.balance), currency.symbol)}
                  </Text>
                  <Text style={[styles.balanceSub, { color: isOwed ? theme.success : theme.danger }]}>
                    {isOwed ? 'Owes You' : 'You Owe'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Details, WhatsApp Share & Settle */}
              <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                {/* View Details / UPI Request */}
                <TouchableOpacity
                  onPress={() => setSelectedFriendDetails(friend)}
                  style={[styles.shareBtn, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}40` }]}
                >
                  <Ionicons name="list" size={16} color={theme.primaryLight} />
                  <Text style={[styles.shareBtnText, { color: theme.primaryLight }]}>History & UPI</Text>
                </TouchableOpacity>

                {/* Share PDF via WhatsApp */}
                <TouchableOpacity
                  onPress={() => handleShareWhatsAppPDF(friend)}
                  style={[styles.shareBtn, { backgroundColor: '#25D36620', borderColor: '#25D36640' }]}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={[styles.shareBtnText, { color: '#25D366' }]}>PDF</Text>
                </TouchableOpacity>

                {/* Record New Entry for Friend */}
                <TouchableOpacity
                  onPress={() => handleOpenAddForFriend(friend.name)}
                  style={[styles.entryBtn, { backgroundColor: theme.cardAlt }]}
                >
                  <Ionicons name="add" size={16} color={theme.text} />
                  <Text style={[styles.entryBtnText, { color: theme.text }]}>Entry</Text>
                </TouchableOpacity>

                {/* Settle */}
                {friend.balance !== 0 && (
                  <TouchableOpacity
                    onPress={() => settleFriendDebt(friend.name)}
                    style={[styles.settleBtn, { backgroundColor: `${theme.success}20` }]}
                  >
                    <Ionicons name="checkmark-done" size={16} color={theme.success} />
                    <Text style={[styles.settleBtnText, { color: theme.success }]}>Settle</Text>
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

      {/* Friend Detail & WhatsApp UPI Request Modal */}
      <FriendDetailModal
        visible={!!selectedFriendDetails}
        friend={selectedFriendDetails}
        onClose={() => setSelectedFriendDetails(null)}
        onOpenAddEntry={handleOpenAddForFriend}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 90,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 20,
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
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
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
    marginVertical: 14,
  },
  heroBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendAvatar: {
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
    fontSize: 16,
    fontWeight: '700',
  },
  friendMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  friendBalance: {
    fontSize: 18,
    fontWeight: '900',
  },
  balanceSub: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  shareBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  entryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  settleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
