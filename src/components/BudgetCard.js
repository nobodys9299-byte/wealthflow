import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import { CategoryVisual } from './common/CategoryVisual';

export const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const { theme, currency } = useFinance();
  const category = getCategoryById(budget.categoryId, 'expense');

  let statusColor = theme.success;
  let statusBadgeBg = theme.successBg;
  let statusText = 'On Track';

  if (budget.status === 'exceeded') {
    statusColor = theme.danger;
    statusBadgeBg = theme.dangerBg;
    statusText = 'Over Budget!';
  } else if (budget.status === 'warning') {
    statusColor = theme.warning;
    statusBadgeBg = theme.warningBg;
    statusText = 'Near Limit';
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: budget.status === 'exceeded' ? theme.danger : theme.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.catInfo}>
          <CategoryVisual category={category} size={44} />
          <View>
            <Text style={[styles.catName, { color: theme.text }]}>{category.name}</Text>
            <Text style={[styles.subText, { color: theme.textMuted }]}>
              Limit: {formatCurrency(budget.limit, currency.symbol)} / month
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(budget)} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(budget.categoryId)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarTrack, { backgroundColor: theme.cardAlt }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(100, budget.rawPercent)}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {/* Bottom Metrics */}
      <View style={styles.metricsRow}>
        <Text style={[styles.metricSpent, { color: theme.text }]}>
          Spent: <Text style={{ fontWeight: '800' }}>{formatCurrency(budget.spent, currency.symbol)}</Text>
        </Text>
        <Text style={[styles.metricPercent, { color: statusColor }]}>
          {budget.rawPercent}%
        </Text>
        <Text style={[styles.metricRemaining, { color: theme.textMuted }]}>
          {budget.status === 'exceeded' ? 'Over by ' : 'Left: '}
          <Text style={{ fontWeight: '700', color: budget.status === 'exceeded' ? theme.danger : theme.text }}>
            {formatCurrency(Math.abs(budget.limit - budget.spent), currency.symbol)}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    padding: 4,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricSpent: {
    fontSize: 12,
  },
  metricPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricRemaining: {
    fontSize: 12,
  },
});
