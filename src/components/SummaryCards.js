import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

export const SummaryCards = () => {
  const { theme, currency, netWorth, currentMonthStats } = useFinance();

  return (
    <View style={styles.container}>
      {/* Net Worth Primary Hero Card */}
      <View
        style={[
          styles.netWorthCard,
          {
            backgroundColor: theme.isDark ? '#1E1B4B' : '#4F46E5', // deep rich indigo
          },
        ]}
      >
        <View style={styles.netWorthHeader}>
          <View>
            <Text style={styles.netWorthLabel}>TOTAL NET WORTH</Text>
            <Text style={styles.netWorthValue}>
              {formatCurrency(netWorth, currency.symbol)}
            </Text>
          </View>
          <View style={styles.savingsRateBadge}>
            <Ionicons name="sparkles" size={12} color="#FDE047" />
            <Text style={styles.savingsRateText}>
              {currentMonthStats.savingsRate}% Saved this mo.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cashFlowRow}>
          <View style={styles.cashFlowItem}>
            <View style={styles.iconCircleIncome}>
              <Ionicons name="arrow-down-outline" size={14} color="#10B981" />
            </View>
            <View>
              <Text style={styles.cashFlowLabel}>Income ({currentMonthStats.monthName.split(' ')[0]})</Text>
              <Text style={styles.incomeValue}>
                +{formatCurrency(currentMonthStats.income, currency.symbol)}
              </Text>
            </View>
          </View>

          <View style={styles.cashFlowItem}>
            <View style={styles.iconCircleExpense}>
              <Ionicons name="arrow-up-outline" size={14} color="#F43F5E" />
            </View>
            <View>
              <Text style={styles.cashFlowLabel}>Expenses</Text>
              <Text style={styles.expenseValue}>
                -{formatCurrency(currentMonthStats.expense, currency.symbol)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  netWorthCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  netWorthLabel: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  netWorthValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  savingsRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  savingsRateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 16,
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cashFlowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircleIncome: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleExpense: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashFlowLabel: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '600',
  },
  incomeValue: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  expenseValue: {
    color: '#FDA4AF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
});
