import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { CashflowBarChart } from '../components/charts/CashflowBarChart';
import { formatCurrency } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';

export const AnalyticsScreen = () => {
  const { theme, currency, transactions } = useFinance();
  const [timeframe, setTimeframe] = useState('month'); // 'month' | '30days' | 'year' | 'all'

  // Filter transactions based on selected timeframe
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
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    const map = {};

    expenses.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      map[t.categoryId] = (map[t.categoryId] || 0) + amt;
    });

    const list = Object.entries(map).map(([categoryId, amount]) => ({
      categoryId,
      amount,
    }));

    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [categoryBreakdown]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const dailyAverageSpend = totalExpense / 30;

  // Monthly comparison data for CashflowBarChart
  const monthlyBarData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const curYear = now.getFullYear();

    // Group last 4-6 months
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

  const topCategory = categoryBreakdown[0]
    ? getCategoryById(categoryBreakdown[0].categoryId, 'expense')
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Financial Analytics</Text>
        <Text style={[styles.subText, { color: theme.textMuted }]}>
          Visual spending trends & budget efficiency
        </Text>
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

      {/* Period Overview Cards */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricTitle, { color: theme.textMuted }]}>INCOME</Text>
          <Text style={[styles.metricValue, { color: theme.success }]}>
            +{formatCurrency(totalIncome, currency.symbol)}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricTitle, { color: theme.textMuted }]}>EXPENSE</Text>
          <Text style={[styles.metricValue, { color: theme.danger }]}>
            -{formatCurrency(totalExpense, currency.symbol)}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricTitle, { color: theme.textMuted }]}>NET SAVINGS</Text>
          <Text
            style={[
              styles.metricValue,
              { color: netSavings >= 0 ? theme.primaryLight : theme.danger },
            ]}
          >
            {formatCurrency(netSavings, currency.symbol)}
          </Text>
        </View>
      </View>

      {/* Spending Breakdown by Category Section */}
      <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Category Distribution</Text>
          {topCategory && (
            <View style={[styles.topBadge, { backgroundColor: `${topCategory.color}20` }]}>
              <Text style={[styles.topBadgeText, { color: topCategory.color }]}>
                Top: {topCategory.name}
              </Text>
            </View>
          )}
        </View>

        <CategoryPieChart
          data={categoryBreakdown}
          totalAmount={totalExpense}
          size={200}
          strokeWidth={26}
        />
      </View>

      {/* Cash Flow Comparison Bar Chart Section */}
      <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Cash Flow Trend</Text>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>Income vs Expenses</Text>
        </View>

        <CashflowBarChart monthlyData={monthlyBarData} />
      </View>

      {/* Spending Insights Card */}
      <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.insightRow}>
          <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightTitle, { color: theme.text }]}>Smart Spending Insight</Text>
            <Text style={[styles.insightBody, { color: theme.textMuted }]}>
              Your current savings rate is {savingsRate}%. You are spending an average of{' '}
              {formatCurrency(dailyAverageSpend, currency.symbol)} per day during this period.
            </Text>
          </View>
        </View>
      </View>
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
  header: {
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
  timeframeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  chartCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  topBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  insightCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightBody: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
});
