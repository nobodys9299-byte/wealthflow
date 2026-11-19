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
import { BudgetCard } from '../components/BudgetCard';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';

export const BudgetsScreen = ({
  onOpenAddBudget,
  onEditBudget,
  onOpenAddRecurring,
  onEditRecurring,
  onNavigateTab,
  onBack,
  onOpenMore,
}) => {
  const {
    theme,
    currency,
    budgetStatusList,
    deleteCategoryBudget,
    recurring,
    deleteRecurring,
    t,
  } = useFinance();

  // Hardware Back Handler
  useEffect(() => {
    const handleBack = () => {
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
  }, [onBack, onNavigateTab]);

  const totalBudgetLimit = useMemo(() => {
    return budgetStatusList.reduce((sum, b) => sum + b.limit, 0);
  }, [budgetStatusList]);

  const totalBudgetSpent = useMemo(() => {
    return budgetStatusList.reduce((sum, b) => sum + b.spent, 0);
  }, [budgetStatusList]);

  const overallPercent = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;
  const overallRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
            <Text style={[styles.screenTitle, { color: theme.text }]} numberOfLines={1}>{t('budget_goals', 'Budgets & Goals')}</Text>
            <Text style={[styles.subText, { color: theme.textMuted }]} numberOfLines={1}>
              {t('Monthly limits & recurring subscriptions', 'Monthly limits & recurring subscriptions')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onOpenAddBudget}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText} numberOfLines={1}>{t('New Budget', 'New Budget')}</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Budget Hero Progress Card - Harmonious Display Panel */}
      <View
        style={[
          styles.overallCard,
          {
            backgroundColor: theme.card,
            borderColor: overallPercent >= 100 ? theme.danger : theme.border,
            borderTopColor: '#8B5CF6',
            borderTopWidth: 3.5,
          },
        ]}
      >
        <View style={styles.overallTop}>
          <View>
            <Text style={[styles.overallLabel, { color: '#8B5CF6', fontWeight: '800' }]}>
              {t('monthly_budget_pool', 'MONTHLY BUDGET POOL')}
            </Text>
            <Text style={[styles.overallValue, { color: theme.text }]}>
              {formatCurrency(totalBudgetSpent, currency.symbol)}{' '}
              <Text style={{ fontSize: 16, color: theme.textMuted, fontWeight: '500' }}>
                / {formatCurrency(totalBudgetLimit, currency.symbol)}
              </Text>
            </Text>
          </View>

          <View
            style={[
              styles.overallBadge,
              {
                backgroundColor:
                  overallPercent >= 100
                    ? theme.dangerBg
                    : overallPercent >= 80
                    ? theme.warningBg
                    : theme.successBg,
              },
            ]}
          >
            <Text
              style={[
                styles.overallBadgeText,
                {
                  color:
                    overallPercent >= 100
                      ? theme.danger
                      : overallPercent >= 80
                      ? theme.warning
                      : theme.success,
                },
              ]}
            >
              {overallPercent}% {t('Used', 'Used')}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.cardAlt }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, overallPercent)}%`,
                backgroundColor:
                  overallPercent >= 100
                    ? theme.danger
                    : overallPercent >= 80
                    ? theme.warning
                    : theme.success,
              },
            ]}
          />
        </View>

        <View style={styles.overallBottomRow}>
          <Text style={[styles.overallMeta, { color: theme.textMuted }]}>
            {overallRemaining > 0
              ? `${formatCurrency(overallRemaining, currency.symbol)} ${t('remaining safe to spend', 'remaining safe to spend')}`
              : t('You have reached or exceeded this month’s allocated budget', 'You have reached or exceeded this month’s allocated budget')}
          </Text>
        </View>
      </View>

      {/* Category Budgets List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Category Budgets', 'Category Budgets')}</Text>
        <Text style={[styles.countBadge, { color: theme.textMuted }]}>
          {budgetStatusList.length} {t('Categories', 'Categories')}
        </Text>
      </View>

      {budgetStatusList.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
          <Ionicons name="pie-chart-outline" size={38} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.text }]}>{t('No category budgets configured', 'No category budgets configured')}</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            {t('Tap "New Budget" above to set limits on dining, groceries, shopping, etc.', 'Tap "New Budget" above to set limits on dining, groceries, shopping, etc.')}
          </Text>
        </View>
      ) : (
        budgetStatusList.map((item) => (
          <BudgetCard
            key={item.categoryId}
            budget={item}
            onEdit={onEditBudget}
            onDelete={deleteCategoryBudget}
          />
        ))
      )}

      {/* Recurring Subscriptions & Fixed Bills Section */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('recurring_bills', 'Recurring Bills & Pay')}</Text>
          <Text style={[styles.subText, { color: theme.textMuted }]}>{t('Auto-tracked bills, salary & subscriptions', 'Auto-tracked bills, salary & subscriptions')}</Text>
        </View>

        <TouchableOpacity
          onPress={onOpenAddRecurring}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>{t('Add Bill', 'Add Bill')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.recurringCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {recurring.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: theme.textMuted, fontSize: 13 }}>{t('no_recurring', 'No recurring bills added yet.')}</Text>
          </View>
        ) : (
          recurring.map((rec) => {
            const cat = getCategoryById(rec.categoryId, rec.type);
            const isIncome = rec.type === 'income';

            return (
              <TouchableOpacity
                key={rec.id}
                activeOpacity={0.7}
                onPress={() => onEditRecurring && onEditRecurring(rec)}
                style={[styles.recurringRow, { borderBottomColor: theme.border }]}
              >
                <View style={[styles.recIcon, { backgroundColor: `${cat.color}20` }]}>
                  <Text style={{ fontSize: 18 }}>{cat.emoji || '⚡'}</Text>
                </View>

                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.recTitle, { color: theme.text }]} numberOfLines={1}>
                    {rec.title}
                  </Text>
                  <Text style={[styles.recMeta, { color: theme.textMuted }]} numberOfLines={1}>
                    {rec.frequency?.toUpperCase() || 'MONTHLY'} • Due: {formatDateDisplay(rec.nextDueDate || new Date().toISOString().split('T')[0])} (Day {rec.dayOfMonth || 1})
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={[styles.recAmount, { color: isIncome ? theme.success : theme.danger }]}>
                    {isIncome ? '+' : '-'}{formatCurrency(rec.amount, currency.symbol)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => onEditRecurring && onEditRecurring(rec)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="pencil" size={15} color={theme.primaryLight} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteRecurring(rec.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={15} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  overallCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 20,
  },
  overallTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  overallLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  overallValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  overallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  overallBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  overallBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overallMeta: {
    fontSize: 12,
    fontWeight: '500',
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
  countBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  recurringCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  recIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  recAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});
