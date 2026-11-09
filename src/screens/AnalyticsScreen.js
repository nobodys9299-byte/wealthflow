import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { CashflowBarChart } from '../components/charts/CashflowBarChart';
import { TransactionItem } from '../components/TransactionItem';
import { ReceiptImageShareModal } from '../components/modals/ReceiptImageShareModal';
import { formatCurrency } from '../utils/formatters';
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

export const AnalyticsScreen = ({ onEditTransaction, onOpenAddTransaction, onNavigateTab }) => {
  const { theme, currency, accounts, transactions, netWorth, deleteTransaction } = useFinance();

  const [activeView, setActiveView] = useState('account'); // 'account' | 'expense' | 'income'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('month'); // 'month' | '30days' | 'year' | 'all'

  // Search & Filter state for transactions inside each view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [selectedExpenseCat, setSelectedExpenseCat] = useState('all');
  const [selectedIncomeCat, setSelectedIncomeCat] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const currentViewObj = ANALYSIS_VIEWS.find((v) => v.id === activeView) || ANALYSIS_VIEWS[0];

  // Filter transactions based on timeframe
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    return transactions.filter((t) => {
      if (!t.date) return false;
      if (timeframe === 'month') {
        return t.date.startsWith(currentYearMonth);
      }
      if (timeframe === '30days') {
        const txDate = new Date(t.date);
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }
      if (timeframe === 'year') {
        return t.date.startsWith(currentYear);
      }
      return true; // 'all'
    });
  }, [transactions, timeframe]);

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
      const share = totalPositiveBalance > 0 && bal > 0 ? Math.round((bal / totalPositiveBalance) * 100) : 0;

      return {
        ...acc,
        inflows,
        outflows,
        txCount: accTx.length,
        share,
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

  // 1. Transactions List for Account Analysis
  const accountTransactionsList = useMemo(() => {
    let list = filteredTransactions;
    if (selectedAccountId !== 'all') {
      list = list.filter((t) => t.accountId === selectedAccountId);
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
  }, [filteredTransactions, selectedAccountId, searchQuery]);

  // 2. Transactions List for Expense Overview
  const expenseTransactionsList = useMemo(() => {
    let list = filteredTransactions.filter((t) => t.type === 'expense');
    if (selectedExpenseCat !== 'all') {
      list = list.filter((t) => t.categoryId === selectedExpenseCat);
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
  }, [filteredTransactions, selectedExpenseCat, searchQuery]);

  // 3. Transactions List for Income Overview
  const incomeTransactionsList = useMemo(() => {
    let list = filteredTransactions.filter((t) => t.type === 'income');
    if (selectedIncomeCat !== 'all') {
      list = list.filter((t) => t.categoryId === selectedIncomeCat);
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
  }, [filteredTransactions, selectedIncomeCat, searchQuery]);

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
      {/* Top Header with Title and Dropdown Option */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Financial Analysis</Text>
          <Text style={[styles.subText, { color: theme.textMuted }]}>
            {currentViewObj.subtitle}
          </Text>
        </View>

        {/* Dropdown Trigger Button */}
        <TouchableOpacity
          onPress={() => setDropdownOpen(true)}
          style={[styles.dropdownBtn, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}50` }]}
          activeOpacity={0.8}
        >
          <Ionicons name={currentViewObj.icon} size={16} color={theme.primaryLight} />
          <Text style={[styles.dropdownBtnText, { color: theme.primaryLight }]} numberOfLines={1}>
            {currentViewObj.title}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.primaryLight} />
        </TouchableOpacity>
      </View>

      {/* Segmented Quick Switch Tabs */}
      <View style={[styles.quickTabsRow, { backgroundColor: theme.cardAlt }]}>
        {ANALYSIS_VIEWS.map((v) => {
          const isSelected = activeView === v.id;
          return (
            <TouchableOpacity
              key={`tab_${v.id}`}
              onPress={() => {
                setActiveView(v.id);
                setSearchQuery('');
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
                {v.title.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timeframe Selector Pills */}
      <View style={[styles.timeframeRow, { backgroundColor: theme.cardAlt }]}>
        {[
          { id: 'month', label: 'This Month' },
          { id: '30days', label: 'Last 30 Days' },
          { id: 'year', label: 'This Year' },
          { id: 'all', label: 'All Time' },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setTimeframe(item.id)}
            style={[
              styles.timeframeBtn,
              timeframe === item.id && { backgroundColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.timeframeText,
                { color: timeframe === item.id ? '#FFF' : theme.textMuted },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ======================================================== */}
      {/* 1. ACCOUNT ANALYSIS VIEW                                */}
      {/* ======================================================== */}
      {activeView === 'account' && (
        <View style={styles.viewSection}>
          {/* Consolidated Net Worth Card */}
          <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroLabel, { color: theme.textMuted }]}>TOTAL CONSOLIDATED WEALTH</Text>
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
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Wallet & Account Breakdown</Text>
            <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>{accounts.length} Accounts</Text>
          </View>

          {accountMetrics.map((acc) => {
            const isNegative = acc.currentBalance < 0;
            const isFilterActive = selectedAccountId === acc.id;

            return (
              <TouchableOpacity
                key={acc.id}
                activeOpacity={0.8}
                onPress={() => setSelectedAccountId(isFilterActive ? 'all' : acc.id)}
                style={[
                  styles.accountCard,
                  { backgroundColor: theme.card, borderColor: isFilterActive ? theme.primary : theme.border },
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
                      {acc.type?.toUpperCase()} • {acc.txCount} txs • Tap to filter
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
                        width: `${Math.max(4, Math.min(100, acc.share))}%`,
                        backgroundColor: acc.color || theme.primary,
                      },
                    ]}
                  />
                </View>

                {/* Mini cashflow stats row */}
                <View style={[styles.accBottomRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.accMiniLabel, { color: theme.textMuted }]}>
                    In: <Text style={{ color: theme.success, fontWeight: '700' }}>+{formatCurrency(acc.inflows, currency.symbol)}</Text>
                  </Text>
                  <Text style={[styles.accMiniLabel, { color: theme.textMuted }]}>
                    Out: <Text style={{ color: theme.danger, fontWeight: '700' }}>-{formatCurrency(acc.outflows, currency.symbol)}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* ======================================================== */}
          {/* ACCOUNT TRANSACTIONS LIST                                */}
          {/* ======================================================== */}
          <View style={[styles.txSectionHeader, { marginTop: 14 }]}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Account Transactions
              </Text>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {accountTransactionsList.length} records • {selectedAccountId === 'all' ? 'All Accounts' : accounts.find(a => a.id === selectedAccountId)?.name}
              </Text>
            </View>

            {onOpenAddTransaction && (
              <TouchableOpacity
                onPress={() => onOpenAddTransaction('expense')}
                style={[styles.smallAddBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.smallAddBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Account Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            <TouchableOpacity
              onPress={() => setSelectedAccountId('all')}
              style={[
                styles.filterPill,
                {
                  backgroundColor: selectedAccountId === 'all' ? theme.primary : theme.cardAlt,
                  borderColor: selectedAccountId === 'all' ? theme.primaryLight : theme.border,
                },
              ]}
            >
              <Text style={[styles.filterPillText, { color: selectedAccountId === 'all' ? '#FFF' : theme.text }]}>
                All Accounts
              </Text>
            </TouchableOpacity>

            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={`pill_acc_${acc.id}`}
                  onPress={() => setSelectedAccountId(acc.id)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.cardAlt,
                      borderColor: isSelected ? theme.primaryLight : theme.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
                  <Text style={[styles.filterPillText, { color: isSelected ? '#FFF' : theme.text }]}>
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search account transactions..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Transaction items */}
          {accountTransactionsList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: theme.border }]}>
              <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
                No transactions found for this account.
              </Text>
            </View>
          ) : (
            accountTransactionsList.map((item) => (
              <View key={`tx_acc_${item.id}`} style={{ marginBottom: 6 }}>
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
                    Share Receipt Image
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
              const percent = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
              const isSelected = selectedExpenseCat === item.categoryId;

              return (
                <TouchableOpacity
                  key={item.categoryId}
                  activeOpacity={0.8}
                  onPress={() => setSelectedExpenseCat(isSelected ? 'all' : item.categoryId)}
                  style={[
                    styles.breakdownRowCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: isSelected ? cat.color : theme.border,
                      borderWidth: isSelected ? 2 : 1,
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
                        {percent}% of total spend • Tap to filter transactions
                      </Text>
                    </View>

                    <Text style={[styles.catRowAmount, { color: theme.danger }]}>
                      -{formatCurrency(item.amount, currency.symbol)}
                    </Text>
                  </View>

                  {/* Progress Fill */}
                  <View style={[styles.catProgressTrack, { backgroundColor: theme.cardAlt }]}>
                    <View
                      style={[
                        styles.catProgressFill,
                        { width: `${Math.max(4, percent)}%`, backgroundColor: cat.color },
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

          {/* ======================================================== */}
          {/* EXPENSE TRANSACTIONS LIST                                */}
          {/* ======================================================== */}
          <View style={[styles.txSectionHeader, { marginTop: 18 }]}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Expense Transactions
              </Text>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {expenseTransactionsList.length} records • {selectedExpenseCat === 'all' ? 'All Categories' : getCategoryById(selectedExpenseCat, 'expense')?.name}
              </Text>
            </View>

            {onOpenAddTransaction && (
              <TouchableOpacity
                onPress={() => onOpenAddTransaction('expense')}
                style={[styles.smallAddBtn, { backgroundColor: theme.danger }]}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.smallAddBtnText}>Add Expense</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            <TouchableOpacity
              onPress={() => setSelectedExpenseCat('all')}
              style={[
                styles.filterPill,
                {
                  backgroundColor: selectedExpenseCat === 'all' ? theme.primary : theme.cardAlt,
                  borderColor: selectedExpenseCat === 'all' ? theme.primaryLight : theme.border,
                },
              ]}
            >
              <Text style={[styles.filterPillText, { color: selectedExpenseCat === 'all' ? '#FFF' : theme.text }]}>
                All Categories
              </Text>
            </TouchableOpacity>

            {expenseBreakdown.map((item) => {
              const cat = getCategoryById(item.categoryId, 'expense');
              const isSelected = selectedExpenseCat === item.categoryId;
              return (
                <TouchableOpacity
                  key={`pill_exp_${item.categoryId}`}
                  onPress={() => setSelectedExpenseCat(item.categoryId)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.cardAlt,
                      borderColor: isSelected ? theme.primaryLight : theme.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{cat.emoji || '🏷️'}</Text>
                  <Text style={[styles.filterPillText, { color: isSelected ? '#FFF' : theme.text }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search expenses by title, merchant, note..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Expense Transaction Items */}
          {expenseTransactionsList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: theme.border }]}>
              <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
                No expenses found matching your filter.
              </Text>
            </View>
          ) : (
            expenseTransactionsList.map((item) => (
              <View key={`tx_exp_${item.id}`} style={{ marginBottom: 6 }}>
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
                    Share Receipt Image
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
              const percent = totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0;
              const isSelected = selectedIncomeCat === item.categoryId;

              return (
                <TouchableOpacity
                  key={item.categoryId}
                  activeOpacity={0.8}
                  onPress={() => setSelectedIncomeCat(isSelected ? 'all' : item.categoryId)}
                  style={[
                    styles.breakdownRowCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: isSelected ? cat.color : theme.border,
                      borderWidth: isSelected ? 2 : 1,
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
                        {percent}% of total income • Tap to filter transactions
                      </Text>
                    </View>

                    <Text style={[styles.catRowAmount, { color: theme.success }]}>
                      +{formatCurrency(item.amount, currency.symbol)}
                    </Text>
                  </View>

                  <View style={[styles.catProgressTrack, { backgroundColor: theme.cardAlt }]}>
                    <View
                      style={[
                        styles.catProgressFill,
                        { width: `${Math.max(4, percent)}%`, backgroundColor: cat.color },
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

          {/* ======================================================== */}
          {/* INCOME TRANSACTIONS LIST                                 */}
          {/* ======================================================== */}
          <View style={[styles.txSectionHeader, { marginTop: 18 }]}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Income Transactions
              </Text>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {incomeTransactionsList.length} records • {selectedIncomeCat === 'all' ? 'All Income Streams' : getCategoryById(selectedIncomeCat, 'income')?.name}
              </Text>
            </View>

            {onOpenAddTransaction && (
              <TouchableOpacity
                onPress={() => onOpenAddTransaction('income')}
                style={[styles.smallAddBtn, { backgroundColor: theme.success }]}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.smallAddBtnText}>Add Income</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Income Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            <TouchableOpacity
              onPress={() => setSelectedIncomeCat('all')}
              style={[
                styles.filterPill,
                {
                  backgroundColor: selectedIncomeCat === 'all' ? theme.primary : theme.cardAlt,
                  borderColor: selectedIncomeCat === 'all' ? theme.primaryLight : theme.border,
                },
              ]}
            >
              <Text style={[styles.filterPillText, { color: selectedIncomeCat === 'all' ? '#FFF' : theme.text }]}>
                All Streams
              </Text>
            </TouchableOpacity>

            {incomeBreakdown.map((item) => {
              const cat = getCategoryById(item.categoryId, 'income');
              const isSelected = selectedIncomeCat === item.categoryId;
              return (
                <TouchableOpacity
                  key={`pill_inc_${item.categoryId}`}
                  onPress={() => setSelectedIncomeCat(item.categoryId)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.cardAlt,
                      borderColor: isSelected ? theme.primaryLight : theme.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{cat.emoji || '💰'}</Text>
                  <Text style={[styles.filterPillText, { color: isSelected ? '#FFF' : theme.text }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search income by title, payer, note..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Income Transaction Items */}
          {incomeTransactionsList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: theme.border }]}>
              <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
                No income found matching your filter.
              </Text>
            </View>
          ) : (
            incomeTransactionsList.map((item) => (
              <View key={`tx_inc_${item.id}`} style={{ marginBottom: 6 }}>
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
                    Share Receipt Image
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {/* ======================================================== */}
      {/* DROPDOWN SELECTOR MODAL                                 */}
      {/* ======================================================== */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Select Analysis View</Text>
              <TouchableOpacity onPress={() => setDropdownOpen(false)}>
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {ANALYSIS_VIEWS.map((item) => {
              const isSelected = activeView === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setActiveView(item.id);
                    setSearchQuery('');
                    setDropdownOpen(false);
                  }}
                  style={[
                    styles.menuItem,
                    isSelected && { backgroundColor: `${theme.primary}18`, borderColor: theme.primary },
                  ]}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: `${theme.primary}25` }]}>
                    <Ionicons name={item.icon} size={20} color={theme.primaryLight} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.menuItemTitle,
                        { color: isSelected ? theme.primaryLight : theme.text, fontWeight: isSelected ? '800' : '700' },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.menuItemSub, { color: theme.textMuted }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primaryLight} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* WhatsApp Image Receipt Share Modal */}
      <ReceiptImageShareModal
        visible={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        type="transaction"
        data={selectedReceipt}
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
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownBtnText: {
    fontSize: 12,
    fontWeight: '800',
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

  // Modal Dropdown Menu
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownMenu: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 15,
  },
  menuItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
