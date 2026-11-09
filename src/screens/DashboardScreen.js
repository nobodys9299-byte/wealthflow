import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { SummaryCards } from '../components/SummaryCards';
import { AccountCard } from '../components/AccountCard';
import { TransactionItem } from '../components/TransactionItem';

export const DashboardScreen = ({
  onOpenAddTransaction,
  onOpenTransfer,
  onOpenAddAccount,
  onOpenSmartInbox,
  onOpenSettings,
  onEditTransaction,
  onNavigateTab,
}) => {
  const {
    theme,
    accounts,
    transactions,
    budgetStatusList,
    deleteTransaction,
  } = useFinance();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income'
  const [filterAccountId, setFilterAccountId] = useState('all');

  const alertedBudgets = budgetStatusList.filter(
    (b) => b.status === 'exceeded' || b.status === 'warning'
  );

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (filterType !== 'all') {
      list = list.filter((t) => t.type === filterType);
    }
    if (filterAccountId !== 'all') {
      list = list.filter((t) => t.accountId === filterAccountId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          String(t.amount).includes(q)
      );
    }
    return list;
  }, [transactions, filterType, filterAccountId, searchQuery]);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top App Header with 3-Bar Hamburger Menu and Search */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {/* 3-bar Hamburger Menu Button for Settings */}
          <TouchableOpacity
            onPress={onOpenSettings}
            style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityLabel="Open Settings"
          >
            <Ionicons name="menu-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          <View>
            <Text style={[styles.welcomeSub, { color: theme.textMuted }]}>
              Welcome back,
            </Text>
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>
              WealthFlow
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Top Right Search Button */}
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={[
              styles.iconBtn,
              {
                backgroundColor: showSearch ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            accessibilityLabel="Search Transactions"
          >
            <Ionicons
              name={showSearch ? 'close' : 'search-outline'}
              size={20}
              color={showSearch ? '#FFF' : theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Search & Filter Drawer */}
      {showSearch && (
        <View style={[styles.searchDrawer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search title, note, or amount..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Type Filter Chips */}
          <View style={styles.filterChipRow}>
            {['all', 'expense', 'income'].map((t) => {
              const active = filterType === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setFilterType(t)}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? '#FFF' : theme.textMuted, textTransform: 'capitalize' },
                    ]}
                  >
                    {t === 'all' ? 'All Types' : t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Account Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => setFilterAccountId('all')}
              style={[
                styles.accountChip,
                filterAccountId === 'all'
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: theme.cardAlt, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: filterAccountId === 'all' ? '#FFF' : theme.textMuted, fontSize: 12, fontWeight: '600' }}>
                All Accounts
              </Text>
            </TouchableOpacity>
            {accounts.map((acc) => {
              const active = filterAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setFilterAccountId(acc.id)}
                  style={[
                    styles.accountChip,
                    active
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  ]}
                >
                  <Text style={{ fontSize: 12, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
                  <Text style={{ color: active ? '#FFF' : theme.textMuted, fontSize: 12, fontWeight: '600' }}>
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Net Worth and Cash Flow Summary */}
      <SummaryCards />

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          onPress={() => onOpenAddTransaction('expense')}
          style={[styles.actionBtn, { backgroundColor: theme.danger }]}
        >
          <Ionicons name="arrow-up" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenAddTransaction('income')}
          style={[styles.actionBtn, { backgroundColor: theme.success }]}
        >
          <Ionicons name="arrow-down" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenTransfer}
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="swap-horizontal" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>Transfer</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Alerts Banner */}
      {alertedBudgets.length > 0 && (
        <TouchableOpacity
          onPress={() => onNavigateTab('budgets')}
          style={[
            styles.alertBanner,
            {
              backgroundColor: theme.warningBg,
              borderColor: theme.warning,
            },
          ]}
        >
          <Ionicons name="warning-outline" size={20} color={theme.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: theme.warning }]}>
              Budget Alert ({alertedBudgets.length} Category)
            </Text>
            <Text style={[styles.alertDesc, { color: theme.text }]} numberOfLines={1}>
              {alertedBudgets[0].rawPercent}% of budget spent on {alertedBudgets[0].categoryId}. Tap to view.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.warning} />
        </TouchableOpacity>
      )}

      {/* Accounts Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Accounts & Wallets</Text>
        <TouchableOpacity
          onPress={onOpenAddAccount}
          style={styles.seeAllBtn}
        >
          <Ionicons name="add-circle-outline" size={16} color={theme.primaryLight} />
          <Text style={[styles.seeAllText, { color: theme.primaryLight }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsRow}>
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} compact />
        ))}
      </ScrollView>

      {/* Transactions Section: Filtered Search Results OR Recent Activity */}
      <View style={[styles.sectionHeader, { marginTop: 22 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {showSearch ? `Search Results (${filteredTransactions.length})` : 'Recent Activity'}
        </Text>
        <TouchableOpacity
          onPress={() => onNavigateTab('transactions')}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: theme.primaryLight }]}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.primaryLight} />
        </TouchableOpacity>
      </View>

      {(showSearch ? filteredTransactions : recentTransactions).length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {showSearch
              ? 'No transactions found matching your search and filter criteria.'
              : 'No transactions recorded yet. Tap + to add one!'}
          </Text>
        </View>
      ) : (
        (showSearch ? filteredTransactions : recentTransactions).map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onEdit={onEditTransaction}
            onDelete={deleteTransaction}
          />
        ))
      )}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchDrawer: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
  },
  autoFetchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  alertDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountsRow: {
    paddingVertical: 4,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});