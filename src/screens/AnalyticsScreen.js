import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { CashflowBarChart } from '../components/charts/CashflowBarChart';
import { TransactionItem } from '../components/TransactionItem';
import { ReceiptImageShareModal } from '../components/modals/ReceiptImageShareModal';
import { CalendarDatePickerModal } from '../components/common/CalendarDatePickerModal';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';

const ANALYSIS_VIEWS = [
  {
    id: 'account',
    title: 'Account Analysis',
    subtitle: 'Wallet balances, allocation & transactions',
    icon: 'wallet-outline',
  },
  {
    id: 'expense',
    title: 'Expense Overview',
    subtitle: 'Category spending breakdown & expense records',
    icon: 'pie-chart-outline',
  },
  {
    id: 'income',
    title: 'Income Overview',
    subtitle: 'Earnings streams, salary breakdown & income records',
    icon: 'trending-up-outline',
  },
];

export const AnalyticsScreen = ({ onEditTransaction, onOpenAddTransaction, onNavigateTab, onBack, onOpenMore }) => {
  const { theme, currency, accounts, transactions, netWorth, deleteTransaction, t } = useFinance();

  const [activeView, setActiveView] = useState('account'); // 'account' | 'expense' | 'income'
  const [timeframe, setTimeframe] = useState('month'); // 'month' | '30days' | 'year' | 'all' | 'custom'

  // Custom Date Range state
  const todayStr = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [datePickerMode, setDatePickerMode] = useState(null); // 'start' | 'end' | null

  // Custom Search & Filter state on main screen
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [filterFlowType, setFilterFlowType] = useState('all'); // 'all' | 'expense' | 'income'
  const [filterAccount, setFilterAccount] = useState('all'); // 'all' | account.id
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dedicated Detail Screen for tapped card/head
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailSearch, setDetailSearch] = useState('');
  const [shareImageModalData, setShareImageModalData] = useState(null);

  // Search & Filter state for individual transaction receipts
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Android hardware back handler
  useEffect(() => {
    const handleBack = () => {
      if (datePickerMode) {
        setDatePickerMode(null);
        return true;
      }
      if (shareImageModalData) {
        setShareImageModalData(null);
        return true;
      }
      if (selectedDetail) {
        setSelectedDetail(null);
        setDetailSearch('');
        setIsDetailExpanded(false);
        return true;
      }
      if (showAdvancedFilters) {
        setShowAdvancedFilters(false);
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
  }, [datePickerMode, shareImageModalData, selectedDetail, showAdvancedFilters, onBack, onNavigateTab]);

  const currentViewObj = ANALYSIS_VIEWS.find((v) => v.id === activeView) || ANALYSIS_VIEWS[0];

  // Filter transactions based on timeframe, search query, flow type, account, and custom date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    return transactions.filter((t) => {
      if (!t.date) return false;
      if (timeframe === 'month') {
        if (!t.date.startsWith(currentYearMonth)) return false;
      } else if (timeframe === '30days') {
        const txDate = new Date(t.date);
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 30) return false;
      } else if (timeframe === 'year') {
        if (!t.date.startsWith(currentYear)) return false;
      } else if (timeframe === 'custom') {
        if (t.date < customStartDate || t.date > customEndDate) return false;
      }

      // Flow type filter
      if (filterFlowType !== 'all' && t.type !== filterFlowType) {
        return false;
      }

      // Account filter
      if (filterAccount !== 'all' && t.accountId !== filterAccount) {
        return false;
      }

      // Search query filter
      if (mainSearchQuery.trim()) {
        const q = mainSearchQuery.toLowerCase().trim();
        const matchesTitle = t.title && t.title.toLowerCase().includes(q);
        const matchesNote = t.note && t.note.toLowerCase().includes(q);
        const matchesCat = t.categoryId && t.categoryId.toLowerCase().includes(q);
        const matchesAmt = String(t.amount).includes(q);
        const matchesDate = t.date && t.date.includes(q);
        if (!matchesTitle && !matchesNote && !matchesCat && !matchesAmt && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, timeframe, filterFlowType, filterAccount, mainSearchQuery]);

  // Search filtered transactions inside the tapped Head / Card Modal
  const filteredDetailTransactions = useMemo(() => {
    if (!selectedDetail?.transactions) return [];
    if (!detailSearch.trim()) return selectedDetail.transactions;
    const q = detailSearch.toLowerCase().trim();
    return selectedDetail.transactions.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        String(t.amount).includes(q) ||
        (t.date && t.date.includes(q))
    );
  }, [selectedDetail?.transactions, detailSearch]);

  // Aggregate expenses by category
  const expenseBreakdown = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    const map = {};

    expenses.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      map[t.categoryId] = (map[t.categoryId] || 0) + amt;
    });

    const list = Object.entries(map).map(([categoryId, amount]) => ({
      categoryId,
      amount,
      type: 'expense',
    }));

    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [filteredTransactions]);

  // Aggregate income by category
  const incomeBreakdown = useMemo(() => {
    const incomes = filteredTransactions.filter((t) => t.type === 'income');
    const map = {};

    incomes.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      map[t.categoryId] = (map[t.categoryId] || 0) + amt;
    });

    const list = Object.entries(map).map(([categoryId, amount]) => ({
      categoryId,
      amount,
      type: 'income',
    }));

    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [expenseBreakdown]);

  const totalIncome = useMemo(() => {
    return incomeBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [incomeBreakdown]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const dailyAverageSpend = totalExpense / (timeframe === 'month' ? 30 : timeframe === 'year' ? 365 : 30);

  // Per-account deep metrics
  const accountMetrics = useMemo(() => {
    const totalPositiveBalance = accounts
      .filter((a) => (parseFloat(a.currentBalance) || 0) > 0)
      .reduce((sum, a) => sum + (parseFloat(a.currentBalance) || 0), 0);

    return accounts.map((acc) => {
      const accTx = filteredTransactions.filter((t) => t.accountId === acc.id);
      const inflows = accTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const outflows = accTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const bal = parseFloat(acc.currentBalance) || 0;
      const exactShare = totalPositiveBalance > 0 && bal > 0 ? Number(((bal / totalPositiveBalance) * 100).toFixed(1)) : 0;

      return {
        ...acc,
        inflows,
        outflows,
        txCount: accTx.length,
        share: exactShare,
      };
    });
  }, [accounts, filteredTransactions]);

  // Monthly cashflow data for bar chart
  const monthlyBarData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = months[d.getMonth()];

      const monthTx = transactions.filter((t) => t.date && t.date.startsWith(prefix));
      const inc = monthTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const exp = monthTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      result.push({
        month: monthLabel,
        income: inc,
        expense: exp,
      });
    }
    return result;
  }, [transactions]);

  const topExpenseCategory = expenseBreakdown[0]
    ? getCategoryById(expenseBreakdown[0].categoryId, 'expense')
    : null;

  const topIncomeCategory = incomeBreakdown[0]
    ? getCategoryById(incomeBreakdown[0].categoryId, 'income')
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header with More Menu Button and Title */}
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
            <Text style={[styles.screenTitle, { color: theme.text }]} numberOfLines={1}>{t('analysis_breakdown', 'Financial Analysis')}</Text>
            <Text style={[styles.subText, { color: theme.textMuted }]} numberOfLines={1}>
              {currentViewObj.subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Quick Switch Tabs */}
      <View style={[styles.quickTabsRow, { backgroundColor: theme.cardAlt }]}>
        {ANALYSIS_VIEWS.map((v) => {
          const isSelected = activeView === v.id;
          const tabLabel = v.id === 'account' ? t('accounts', 'Accounts') : v.id === 'expense' ? t('expense', 'Expense') : t('income', 'Income');
          return (
            <TouchableOpacity
              key={`tab_${v.id}`}
              onPress={() => {
                setActiveView(v.id);
              }}
              style={[
                styles.quickTab,
                isSelected && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.quickTabText,
                  { color: isSelected ? '#FFF' : theme.textMuted, fontWeight: isSelected ? '800' : '600' },
                ]}
                numberOfLines={1}
              >
                {tabLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Search & Interactive Filter Bar (Timeframe is moved cleanly inside this filter panel) */}
      <View style={[styles.customFilterContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.searchBarRow}>
          <Ionicons name="search-outline" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.mainSearchInput, { color: theme.text }]}
            placeholder={t('search_placeholder', 'Search title, note, or amount...')}
            placeholderTextColor={theme.textMuted}
            value={mainSearchQuery}
            onChangeText={setMainSearchQuery}
          />
          {mainSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setMainSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          {/* Filter options toggle pill */}
          <TouchableOpacity
            onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={[
              styles.filterToggleBtn,
              (filterFlowType !== 'all' || filterAccount !== 'all' || timeframe !== 'month' || showAdvancedFilters) && {
                backgroundColor: `${theme.primary}25`,
                borderColor: theme.primaryLight,
              },
              { borderColor: theme.border },
            ]}
          >
            <Ionicons
              name={showAdvancedFilters ? 'funnel' : 'funnel-outline'}
              size={14}
              color={filterFlowType !== 'all' || filterAccount !== 'all' || timeframe !== 'month' ? theme.primaryLight : theme.textMuted}
            />
            <Text
              style={[
                styles.filterToggleText,
                {
                  color: filterFlowType !== 'all' || filterAccount !== 'all' || timeframe !== 'month' ? theme.primaryLight : theme.textMuted,
                  fontWeight: filterFlowType !== 'all' || filterAccount !== 'all' || timeframe !== 'month' ? '800' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {filterFlowType !== 'all' || filterAccount !== 'all' || timeframe !== 'month' ? 'Filtered' : 'Filter'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expandable Advanced Filters Panel */}
        {showAdvancedFilters && (
          <View style={[styles.advancedFiltersPanel, { borderTopColor: theme.border }]}>
            {/* 1. Timeframe & Date Range Filter Pills (Moved here from top bar) */}
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.filterGroupLabel, { color: theme.textMuted }]}>TIMEFRAME & DATES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { id: 'month', label: 'This Month' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'year', label: 'This Year' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: '📅 Custom Range' },
                ].map((item) => (
                  <TouchableOpacity
                    key={`tf_${item.id}`}
                    onPress={() => setTimeframe(item.id)}
                    style={[
                      styles.subFilterChip,
                      timeframe === item.id
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subFilterChipText,
                        { color: timeframe === item.id ? '#FFF' : theme.text, fontWeight: timeframe === item.id ? '800' : '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Custom Date Range Picker Strip */}
              {timeframe === 'custom' && (
                <View style={[styles.customDateRangeRow, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => setDatePickerMode('start')}
                    style={[styles.datePickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text style={[styles.datePickLabel, { color: theme.textMuted }]}>FROM</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="calendar-outline" size={13} color={theme.primaryLight} />
                      <Text style={[styles.datePickValue, { color: theme.text }]}>
                        {formatDateDisplay(customStartDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Ionicons name="arrow-forward" size={14} color={theme.textMuted} style={{ marginHorizontal: 4 }} />

                  <TouchableOpacity
                    onPress={() => setDatePickerMode('end')}
                    style={[styles.datePickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text style={[styles.datePickLabel, { color: theme.textMuted }]}>TO</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="calendar-outline" size={13} color={theme.primaryLight} />
                      <Text style={[styles.datePickValue, { color: theme.text }]}>
                        {formatDateDisplay(customEndDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 2. Flow Type Filter Pills */}
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.filterGroupLabel, { color: theme.textMuted }]}>FLOW TYPE</Text>
              <View style={styles.filterPillsRow}>
                {[
                  { id: 'all', label: 'All Flows' },
                  { id: 'expense', label: '💸 Expense' },
                  { id: 'income', label: '💰 Income' },
                ].map((f) => (
                  <TouchableOpacity
                    key={`flow_${f.id}`}
                    onPress={() => setFilterFlowType(f.id)}
                    style={[
                      styles.subFilterChip,
                      filterFlowType === f.id
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subFilterChipText,
                        { color: filterFlowType === f.id ? '#FFF' : theme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Wallet / Account Filter Pills */}
            <View style={{ marginBottom: 6 }}>
              <Text style={[styles.filterGroupLabel, { color: theme.textMuted }]}>ACCOUNT / WALLET</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setFilterAccount('all')}
                  style={[
                    styles.subFilterChip,
                    filterAccount === 'all'
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.subFilterChipText, { color: filterAccount === 'all' ? '#FFF' : theme.text }]}>
                    All Accounts
                  </Text>
                </TouchableOpacity>

                {accounts.map((acc) => {
                  const isSel = filterAccount === acc.id;
                  return (
                    <TouchableOpacity
                      key={`acc_pill_${acc.id}`}
                      onPress={() => setFilterAccount(isSel ? 'all' : acc.id)}
                      style={[
                        styles.subFilterChip,
                        isSel
                          ? { backgroundColor: theme.primary, borderColor: theme.primary }
                          : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                      ]}
                    >
                      <Text style={{ fontSize: 11, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
                      <Text style={[styles.subFilterChipText, { color: isSel ? '#FFF' : theme.text }]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Reset Button if active filters */}
            {(filterFlowType !== 'all' || filterAccount !== 'all' || timeframe !== 'month' || mainSearchQuery.trim().length > 0) && (
              <TouchableOpacity
                onPress={() => {
                  setFilterFlowType('all');
                  setFilterAccount('all');
                  setTimeframe('month');
                  setMainSearchQuery('');
                }}
                style={styles.resetFilterBtn}
              >
                <Ionicons name="reload-outline" size={12} color={theme.danger} />
                <Text style={[styles.resetFilterText, { color: theme.danger }]}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ======================================================== */}
      {/* 1. ACCOUNT ANALYSIS VIEW                                */}
      {/* ======================================================== */}
      {activeView === 'account' && (
        <View style={styles.viewSection}>
          {/* Consolidated Net Worth Card - Harmonious Display Panel */}
          <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: '#10B981', borderTopWidth: 3.5 }]}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroLabel, { color: '#10B981', fontWeight: '800' }]}>TOTAL CONSOLIDATED WEALTH</Text>
                <Text style={[styles.heroValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(netWorth, currency.symbol)}
                </Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: `${theme.primary}25` }]}>
                <Ionicons name="shield-checkmark" size={24} color={theme.primaryLight} />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Period Inflows (+)</Text>
                <Text style={[styles.metricVal, { color: theme.success }]}>
                  +{formatCurrency(totalIncome, currency.symbol)}
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Period Outflows (-)</Text>
                <Text style={[styles.metricVal, { color: theme.danger }]}>
                  -{formatCurrency(totalExpense, currency.symbol)}
                </Text>
              </View>
            </View>
          </View>

          {/* Section: Account Allocation & Balances */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Breakdown</Text>
            <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>{accounts.length} Accounts</Text>
          </View>

          {accountMetrics.map((acc) => {
            const isNegative = acc.currentBalance < 0;
            const accTxs = transactions.filter((t) => t.accountId === acc.id);

            return (
              <TouchableOpacity
                key={acc.id}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedDetail({
                    type: 'account',
                    data: acc,
                    title: acc.name,
                    emoji: acc.emoji || '🏦',
                    amount: acc.currentBalance,
                    transactions: accTxs,
                  });
                }}
                style={[
                  styles.accountCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.accCardTop}>
                  <View style={[styles.accEmojiBadge, { backgroundColor: `${acc.color || theme.primary}25` }]}>
                    <Text style={{ fontSize: 20 }}>{acc.emoji || '🏦'}</Text>
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[styles.accName, { color: theme.text }]} numberOfLines={1}>
                      {acc.name}
                    </Text>
                    <Text style={[styles.accSub, { color: theme.textMuted }]}>
                      {acc.type?.toUpperCase()} • {acc.txCount} txs
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.accBalance,
                        { color: isNegative ? theme.danger : theme.text },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {formatCurrency(acc.currentBalance, currency.symbol)}
                    </Text>
                    <Text style={[styles.accShareText, { color: theme.primaryLight }]}>
                      {acc.share}% of wealth
                    </Text>
                  </View>
                </View>

                {/* Progress bar showing share of wealth */}
                <View style={[styles.shareBarTrack, { backgroundColor: theme.cardAlt }]}>
                  <View
                    style={[
                      styles.shareBarFill,
                      {
                        width: `${acc.share <= 0 ? 0 : Math.min(100, Math.max(1, acc.share))}%`,
                        backgroundColor: acc.color || theme.primary,
                      },
                    ]}
                  />
                </View>

                {/* Mini cashflow stats row with tap to open full ledger hint */}
                <View style={[styles.accBottomRow, { borderTopColor: theme.border, justifyContent: 'space-between' }]}>
                  <Text style={[styles.accMiniLabel, { color: theme.textMuted }]}>
                    In: <Text style={{ color: theme.success, fontWeight: '700' }}>+{formatCurrency(acc.inflows, currency.symbol)}</Text> • Out: <Text style={{ color: theme.danger, fontWeight: '700' }}>-{formatCurrency(acc.outflows, currency.symbol)}</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primaryLight }}>
                      Open Ledger
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color={theme.primaryLight} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ======================================================== */}
      {/* 2. EXPENSE OVERVIEW                                     */}
      {/* ======================================================== */}
      {activeView === 'expense' && (
        <View style={styles.viewSection}>
          {/* Expense Metrics Summary */}
          <View style={styles.metricCardsGrid}>
            <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.overviewLabel, { color: theme.textMuted }]}>TOTAL EXPENSES</Text>
              <Text style={[styles.overviewVal, { color: theme.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                -{formatCurrency(totalExpense, currency.symbol)}
              </Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.overviewLabel, { color: theme.textMuted }]}>DAILY AVERAGE</Text>
              <Text style={[styles.overviewVal, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(dailyAverageSpend, currency.symbol)}
              </Text>
            </View>
          </View>

          {/* Category Pie Chart Card */}
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Expense Category Distribution</Text>
              {topExpenseCategory && (
                <View style={[styles.topBadge, { backgroundColor: `${topExpenseCategory.color}20` }]}>
                  <Text style={[styles.topBadgeText, { color: topExpenseCategory.color }]}>
                    Top: {topExpenseCategory.name}
                  </Text>
                </View>
              )}
            </View>

            <CategoryPieChart
              data={expenseBreakdown}
              totalAmount={totalExpense}
              size={190}
              strokeWidth={24}
              categoryType="expense"
            />
          </View>

          {/* Ranked Category Breakdown List */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Spend Ranking</Text>
            <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>
              {expenseBreakdown.length} Categories (Tap to filter)
            </Text>
          </View>

          {expenseBreakdown.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: theme.border }]}>
              <Text style={{ color: theme.textMuted }}>No expenses recorded for this timeframe.</Text>
            </View>
          ) : (
            expenseBreakdown.map((item, index) => {
              const cat = getCategoryById(item.categoryId, 'expense');
              const exactPercent = totalExpense > 0 ? Number(((item.amount / totalExpense) * 100).toFixed(1)) : 0;
              const catTxs = filteredTransactions.filter((t) => t.categoryId === item.categoryId && t.type === 'expense');

              return (
                <TouchableOpacity
                  key={item.categoryId}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedDetail({
                      type: 'category',
                      data: { ...cat, totalAmount: item.amount, type: 'expense' },
                      title: cat.name,
                      emoji: cat.emoji || '🏷️',
                      amount: item.amount,
                      categoryType: 'expense',
                      transactions: catTxs,
                    });
                  }}
                  style={[
                    styles.breakdownRowCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.breakdownRowTop}>
                    <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}25` }]}>
                      <Text style={{ fontSize: 18 }}>{cat.emoji || '🏷️'}</Text>
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={[styles.catRowTitle, { color: theme.text }]} numberOfLines={1}>
                        #{index + 1} {cat.name}
                      </Text>
                      <Text style={[styles.catRowPercent, { color: theme.textMuted }]}>
                        {exactPercent}% of spend • Tap to open ledger ({catTxs.length} txs) →
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.catRowAmount, { color: theme.danger }]}>
                        -{formatCurrency(item.amount, currency.symbol)}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.primaryLight} style={{ marginTop: 2 }} />
                    </View>
                  </View>

                  {/* Progress Fill */}
                  <View style={[styles.catProgressTrack, { backgroundColor: theme.cardAlt }]}>
                    <View
                      style={[
                        styles.catProgressFill,
                        { width: `${exactPercent <= 0 ? 0 : Math.min(100, Math.max(1, exactPercent))}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Monthly Comparison Bar Chart */}
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 14 }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Monthly Cash Flow Trend</Text>
            </View>
            <CashflowBarChart monthlyData={monthlyBarData} />
          </View>
        </View>
      )}

      {/* ======================================================== */}
      {/* 3. INCOME OVERVIEW                                      */}
      {/* ======================================================== */}
      {activeView === 'income' && (
        <View style={styles.viewSection}>
          {/* Income Metrics Summary */}
          <View style={styles.metricCardsGrid}>
            <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.overviewLabel, { color: theme.textMuted }]}>TOTAL INCOME</Text>
              <Text style={[styles.overviewVal, { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>
                +{formatCurrency(totalIncome, currency.symbol)}
              </Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.overviewLabel, { color: theme.textMuted }]}>SAVINGS RATE</Text>
              <Text style={[styles.overviewVal, { color: theme.primaryLight }]} numberOfLines={1} adjustsFontSizeToFit>
                {savingsRate}% Saved
              </Text>
            </View>
          </View>

          {/* Income Category Pie Chart */}
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Income Streams Distribution</Text>
              {topIncomeCategory && (
                <View style={[styles.topBadge, { backgroundColor: `${topIncomeCategory.color}20` }]}>
                  <Text style={[styles.topBadgeText, { color: topIncomeCategory.color }]}>
                    Top: {topIncomeCategory.name}
                  </Text>
                </View>
              )}
            </View>

            <CategoryPieChart
              data={incomeBreakdown}
              totalAmount={totalIncome}
              size={190}
              strokeWidth={24}
              categoryType="income"
            />
          </View>

          {/* Ranked Income Sources List */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Income Sources Ranking</Text>
            <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>
              {incomeBreakdown.length} Streams (Tap to filter)
            </Text>
          </View>

          {incomeBreakdown.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: theme.border }]}>
              <Text style={{ color: theme.textMuted }}>No income recorded for this timeframe.</Text>
            </View>
          ) : (
            incomeBreakdown.map((item, index) => {
              const cat = getCategoryById(item.categoryId, 'income');
              const exactPercent = totalIncome > 0 ? Number(((item.amount / totalIncome) * 100).toFixed(1)) : 0;
              const catTxs = filteredTransactions.filter((t) => t.categoryId === item.categoryId && t.type === 'income');

              return (
                <TouchableOpacity
                  key={item.categoryId}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedDetail({
                      type: 'category',
                      data: { ...cat, totalAmount: item.amount, type: 'income' },
                      title: cat.name,
                      emoji: cat.emoji || '💰',
                      amount: item.amount,
                      categoryType: 'income',
                      transactions: catTxs,
                    });
                  }}
                  style={[
                    styles.breakdownRowCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.breakdownRowTop}>
                    <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}25` }]}>
                      <Text style={{ fontSize: 18 }}>{cat.emoji || '💰'}</Text>
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={[styles.catRowTitle, { color: theme.text }]} numberOfLines={1}>
                        #{index + 1} {cat.name}
                      </Text>
                      <Text style={[styles.catRowPercent, { color: theme.textMuted }]}>
                        {exactPercent}% of income • Tap to open ledger ({catTxs.length} txs) →
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.catRowAmount, { color: theme.success }]}>
                        +{formatCurrency(item.amount, currency.symbol)}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.primaryLight} style={{ marginTop: 2 }} />
                    </View>
                  </View>

                  <View style={[styles.catProgressTrack, { backgroundColor: theme.cardAlt }]}>
                    <View
                      style={[
                        styles.catProgressFill,
                        { width: `${exactPercent <= 0 ? 0 : Math.min(100, Math.max(1, exactPercent))}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Monthly Comparison Bar Chart */}
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 14 }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Cashflow Inflow vs Outflow</Text>
            </View>
            <CashflowBarChart monthlyData={monthlyBarData} />
          </View>
        </View>
      )}

      {/* WhatsApp Image Receipt Share Modal */}
      <ReceiptImageShareModal
        visible={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        type="transaction"
        data={selectedReceipt}
      />

      {/* ======================================================== */}
      {/* DEDICATED NEW SCREEN MODAL FOR TAPPED CARD / HEAD        */}
      {/* Opens in 75% height with Expand to Full Screen option   */}
      {/* ======================================================== */}
      <Modal
        visible={!!selectedDetail && !shareImageModalData}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSelectedDetail(null);
          setDetailSearch('');
        }}
      >
        <View style={[styles.detailModalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View
            style={[
              styles.detailModalCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                height: '85%',
                maxHeight: '92%',
              },
            ]}
          >
            {/* Top Drag / Grab Bar Pill */}
            <View style={styles.dragPillWrap}>
              <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
            </View>

            {/* Top Detail Header: Category/Account Info on Left, Controls & Cross Sign on Right */}
            <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
              {/* Left Side: Title, Emoji, and Subtitle */}
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>{selectedDetail?.emoji || '📋'}</Text>
                  <Text style={[styles.detailTitle, { color: theme.text }]} numberOfLines={1}>
                    {selectedDetail?.title}
                  </Text>
                </View>
                <Text style={[styles.detailSub, { color: theme.textMuted }]} numberOfLines={1}>
                  {selectedDetail?.type === 'account'
                    ? `${formatCurrency(selectedDetail?.amount || 0, currency.symbol)} Balance • ${selectedDetail?.transactions?.length || 0} Records`
                    : `${selectedDetail?.categoryType === 'income' ? '+' : '-'}${formatCurrency(selectedDetail?.amount || 0, currency.symbol)} • ${selectedDetail?.transactions?.length || 0} Records`}
                </Text>
              </View>

              {/* Right Side: Share and Close Cross Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShareImageModalData({
                      type: selectedDetail.type,
                      data: {
                        ...selectedDetail.data,
                        name: selectedDetail.title,
                        emoji: selectedDetail.emoji,
                        currentBalance: selectedDetail.amount,
                        totalAmount: selectedDetail.amount,
                        type: selectedDetail.categoryType || selectedDetail.data?.type || 'account',
                        transactions: selectedDetail.transactions || [],
                      },
                    });
                  }}
                  style={styles.shareAllImageBtn}
                >
                  <Ionicons name="share-social-outline" size={14} color="#FFF" />
                  <Text style={styles.shareAllImageBtnText}>Share</Text>
                </TouchableOpacity>

                {/* Cross Close Sign Added to Right Side */}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDetail(null);
                    setDetailSearch('');
                  }}
                  style={[styles.backIconBtn, { backgroundColor: theme.cardAlt }]}
                  accessibilityLabel="Close Ledger"
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar inside Detail Screen */}
            <View style={[styles.detailSearchRow, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.detailSearchInput, { color: theme.text }]}
                placeholder={`Search ${selectedDetail?.title} transactions...`}
                placeholderTextColor={theme.textMuted}
                value={detailSearch}
                onChangeText={setDetailSearch}
              />
              {detailSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDetailSearch('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable List of Transactions */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {filteredDetailTransactions.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                  <Ionicons name="receipt-outline" size={36} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 8 }}>
                    No transactions found for {selectedDetail?.title}.
                  </Text>
                </View>
              ) : (
                filteredDetailTransactions.map((item) => (
                  <View key={`detail_item_${item.id}`} style={{ marginBottom: 8 }}>
                    <TransactionItem
                      transaction={item}
                      onPress={() => onEditTransaction && onEditTransaction(item)}
                      onEdit={onEditTransaction}
                      onDelete={deleteTransaction}
                    />
                    <TouchableOpacity
                      onPress={() => setSelectedReceipt(item)}
                      style={[styles.quickShareBtn, { backgroundColor: theme.cardAlt }]}
                    >
                      <Ionicons name="image-outline" size={13} color="#25D366" />
                      <Text style={[styles.quickShareText, { color: theme.textMuted }]}>
                        Share Single Receipt Image
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WhatsApp Full Image Statement Modal (Entire Account or Entire Category at once) */}
      <ReceiptImageShareModal
        visible={!!shareImageModalData}
        onClose={() => setShareImageModalData(null)}
        type={shareImageModalData?.type || 'account'}
        data={shareImageModalData?.data}
      />

      {/* Calendar Date Picker Modal for Custom Date Range */}
      <CalendarDatePickerModal
        visible={!!datePickerMode}
        selectedDate={datePickerMode === 'end' ? customEndDate : customStartDate}
        onSelectDate={(newDate) => {
          if (datePickerMode === 'start') {
            setCustomStartDate(newDate);
            if (newDate > customEndDate) {
              setCustomEndDate(newDate);
            }
          } else {
            setCustomEndDate(newDate);
            if (newDate < customStartDate) {
              setCustomStartDate(newDate);
            }
          }
        }}
        onClose={() => setDatePickerMode(null)}
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
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  quickTabsRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 12,
  },
  quickTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  quickTabText: {
    fontSize: 12,
  },
  timeframeRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    marginBottom: 16,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewSection: {
    gap: 12,
  },
  heroCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
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
  heroValue: {
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
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: '100%',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  accountCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  accCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accEmojiBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accName: {
    fontSize: 15,
    fontWeight: '800',
  },
  accSub: {
    fontSize: 11,
    marginTop: 1,
  },
  accBalance: {
    fontSize: 15,
    fontWeight: '800',
  },
  accShareText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  shareBarTrack: {
    height: 5,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  shareBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  accBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  accMiniLabel: {
    fontSize: 11,
  },
  metricCardsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  overviewVal: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  topBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  breakdownRowCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  breakdownRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  catRowPercent: {
    fontSize: 11,
    marginTop: 1,
  },
  catRowAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  catProgressTrack: {
    height: 5,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },

  // Transactions Section Styles
  txSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallAddBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillsScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  quickShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    marginTop: 2,
    marginBottom: 4,
  },
  quickShareText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Dedicated Detail Screen Modal styles
  detailModalContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  detailSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  shareAllImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  shareAllImageBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  detailSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  detailSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  // Custom Filter Container Styles
  customFilterContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 11,
  },
  advancedFiltersPanel: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  filterGroupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  subFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  subFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // 75% height popup modal styles
  detailModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
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
  customDateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  datePickBtn: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  datePickLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  datePickValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
