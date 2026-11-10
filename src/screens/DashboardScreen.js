import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { SummaryCards } from '../components/SummaryCards';
import { AccountCard } from '../components/AccountCard';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';

export const DashboardScreen = ({
  onOpenAddTransaction,
  onOpenTransfer,
  onOpenAddAccount,
  onOpenAddRecurring,
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
    recurring = [],
    currency,
    netWorth,
  } = useFinance();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income'
  const [filterAccountId, setFilterAccountId] = useState('all');

  const selectedAccountObj = accounts.find((a) => a.id === filterAccountId);

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

  const displayTransactions = useMemo(() => {
    if (showSearch) return filteredTransactions;
    if (filterAccountId !== 'all') {
      return transactions.filter((t) => t.accountId === filterAccountId);
    }
    return transactions;
  }, [showSearch, filteredTransactions, transactions, filterAccountId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
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

      {/* Quick Action Buttons (Balanced 3-Button Layout) */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          onPress={() => onOpenAddTransaction('expense')}
          style={[styles.actionBtn, { backgroundColor: theme.danger }]}
        >
          <Ionicons name="arrow-up" size={17} color="#FFF" />
          <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenAddTransaction('income')}
          style={[styles.actionBtn, { backgroundColor: theme.success }]}
        >
          <Ionicons name="arrow-down" size={17} color="#FFF" />
          <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenTransfer}
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="swap-horizontal" size={17} color="#FFF" />
          <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>Transfer</Text>
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Accounts</Text>
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
          <AccountCard
            key={acc.id}
            account={acc}
            compact
            onPress={() => setFilterAccountId(filterAccountId === acc.id ? 'all' : acc.id)}
            isSelected={filterAccountId === acc.id}
          />
        ))}
      </ScrollView>

      {/* Recurring Bills & Auto-Pay Section */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recurring Pay & Bills</Text>
          <View style={[styles.recBadge, { backgroundColor: '#8B5CF625' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B5CF6' }}>
              {recurring.length}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onOpenAddRecurring}
          style={[styles.addRecHeaderBtn, { backgroundColor: '#8B5CF618', borderColor: '#8B5CF640' }]}
        >
          <Ionicons name="add" size={14} color="#8B5CF6" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#8B5CF6' }}>Add Recurring</Text>
        </TouchableOpacity>
      </View>

      {recurring.length === 0 ? (
        <TouchableOpacity
          onPress={onOpenAddRecurring}
          style={[styles.emptyRecBox, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="repeat-outline" size={24} color="#8B5CF6" />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={[styles.emptyRecTitle, { color: theme.text }]}>No recurring bills yet</Text>
            <Text style={[styles.emptyRecSub, { color: theme.textMuted }]}>
              Schedule subscriptions, rent & utility bills directly from Home
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recScroll}>
          {recurring.map((rec) => {
            const isIncome = rec.type === 'income';
            const cat = getCategoryById(rec.categoryId, rec.type);
            const dueDay = rec.dayOfMonth || (rec.nextDueDate ? new Date(rec.nextDueDate).getDate() : 1);
            const accentColor = isIncome ? theme.success : (cat?.color || '#8B5CF6');

            return (
              <TouchableOpacity
                key={rec.id}
                onPress={onOpenAddRecurring}
                style={[
                  styles.recCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderTopColor: accentColor,
                    borderTopWidth: 3,
                  },
                ]}
                activeOpacity={0.8}
              >
                {/* Top Row: Category Icon Graphic & Frequency Badge */}
                <View style={styles.recCardTop}>
                  <View style={[styles.recIconWrap, { backgroundColor: `${accentColor}25` }]}>
                    <Text style={{ fontSize: 16 }}>{cat?.emoji || (isIncome ? '💰' : '⚡')}</Text>
                  </View>

                  <View style={[styles.recFreqPill, { backgroundColor: `${accentColor}18` }]}>
                    <Ionicons name="repeat" size={10} color={accentColor} />
                    <Text style={[styles.recFreqText, { color: accentColor }]}>
                      {rec.frequency ? rec.frequency.toUpperCase() : 'MONTHLY'}
                    </Text>
                  </View>
                </View>

                {/* Category Graphic Tag */}
                <Text style={[styles.recCatName, { color: accentColor }]} numberOfLines={1}>
                  {cat?.name || 'Recurring'}
                </Text>

                {/* Recurring Title */}
                <Text style={[styles.recTitle, { color: theme.text }]} numberOfLines={1}>
                  {rec.title}
                </Text>

                {/* Bottom Row: Amount & Due Day Tag */}
                <View style={styles.recBottomRow}>
                  <Text
                    style={[
                      styles.recAmount,
                      { color: isIncome ? theme.success : theme.text },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(rec.amount, currency.symbol)}
                  </Text>
                  <View style={[styles.recDueBadge, { backgroundColor: theme.cardAlt }]}>
                    <Text style={[styles.recDueText, { color: theme.textMuted }]}>
                      Day {dueDay}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Transactions Section: Scrollable list of ALL transactions directly on Home */}
      <View style={[styles.sectionHeader, { marginTop: 22 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]} numberOfLines={1}>
            {showSearch
              ? 'Search Results'
              : filterAccountId !== 'all'
              ? `${selectedAccountObj?.name || 'Account'} Ledger`
              : 'All Transactions'}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: `${theme.primary}20` }]}>
            <Text style={[styles.countBadgeText, { color: theme.primaryLight }]}>
              {displayTransactions.length}
            </Text>
          </View>
          {filterAccountId !== 'all' && (
            <TouchableOpacity
              onPress={() => setFilterAccountId('all')}
              style={[
                styles.clearFilterPill,
                { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}40` },
              ]}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primaryLight }}>Show All</Text>
              <Ionicons name="close-circle" size={12} color={theme.primaryLight} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onNavigateTab('transactions')}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: theme.primaryLight }]}>Ledger</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.primaryLight} />
        </TouchableOpacity>
      </View>

      {displayTransactions.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {showSearch
              ? 'No transactions found matching your search and filter criteria.'
              : filterAccountId !== 'all'
              ? `No transactions recorded yet for ${selectedAccountObj?.name || 'this account'}.`
              : 'No transactions recorded yet. Tap + to add one!'}
          </Text>
        </View>
      ) : (
        displayTransactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onEdit={onEditTransaction}
            onDelete={deleteTransaction}
          />
        ))
      )}
      </ScrollView>
    </View>
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
    gap: 8,
    marginVertical: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    gap: 4,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
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
  // Recurring Section Styles on Home Tab
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addRecHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  emptyRecBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  emptyRecTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyRecSub: {
    fontSize: 11,
    marginTop: 2,
  },
  recScroll: {
    gap: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  recCard: {
    width: 155,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  recCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recFreqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recFreqText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  recCatName: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  recBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recAmount: {
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  recDueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  recDueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  clearFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
});