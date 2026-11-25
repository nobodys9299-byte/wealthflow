import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { AccountVisual } from './common/CategoryVisual';
import { UI_TOKENS } from '../constants/theme';

const AccountCardComponent = ({
  account,
  onEdit,
  onDelete,
  compact = false,
  isSelected = false,
  reorderMode = false,
  isDragging = false,
  dragHandleHandlers,
}) => {
  const { theme, currency, t } = useFinance();
  const isNegative = account.currentBalance < 0;

  if (compact) {
    const isHighlighted = isDragging || reorderMode || isSelected;
    return (
      <View
        style={[
          styles.compactCard,
          UI_TOKENS.shadow.card,
          {
            backgroundColor: isDragging
              ? `${theme.primary}28`
              : reorderMode
              ? `${theme.primary}15`
              : isSelected
              ? `${theme.primary}20`
              : theme.card,
            borderColor: isHighlighted ? theme.primary : theme.border,
            borderWidth: isHighlighted ? 1.5 : 1,
          },
        ]}
      >
        <View style={styles.compactTopRow}>
          <AccountVisual account={account} size={36} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.compactName,
                { color: isHighlighted ? theme.primaryLight : theme.text },
              ]}
              numberOfLines={1}
            >
              {account.name}
            </Text>
            <Text
              style={[
                styles.compactBalance,
                { color: isNegative ? theme.danger : theme.text },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(account.currentBalance, currency.symbol)}
            </Text>
          </View>
          {(reorderMode || isDragging) && (
            <View
              {...(dragHandleHandlers || {})}
              style={[
                styles.dragGripBadge,
                {
                  backgroundColor: isDragging ? theme.primary : `${theme.primary}22`,
                },
              ]}
            >
              <Ionicons
                name="reorder-three-outline"
                size={16}
                color={isDragging ? '#FFF' : theme.primaryLight}
              />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fullCard,
        UI_TOKENS.shadow.card,
        {
          backgroundColor: theme.card,
          borderColor: isDragging || reorderMode ? theme.primary : theme.border,
          borderWidth: isDragging || reorderMode ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.leftInfo, { flex: 1, marginRight: 8 }]}>
          <AccountVisual account={account} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.accName, { color: theme.text }]} numberOfLines={1}>
              {account.name}
            </Text>
            <Text style={[styles.accType, { color: account.color }]} numberOfLines={1}>
              {t(account.type || 'account', account.type?.toUpperCase())} {t('account', 'ACCOUNT')}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {reorderMode || isDragging ? (
            <View
              {...(dragHandleHandlers || {})}
              style={[
                styles.dragHandlePill,
                {
                  backgroundColor: isDragging ? theme.primary : `${theme.primary}20`,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Ionicons
                name="reorder-three-outline"
                size={18}
                color={isDragging ? '#FFF' : theme.primaryLight}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: isDragging ? '#FFF' : theme.primaryLight,
                }}
              >
                Drag
              </Text>
            </View>
          ) : (
            <>
              {onEdit && (
                <TouchableOpacity onPress={() => onEdit(account)} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={() => onDelete(account.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.balanceSection}>
        <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>{t('current_balance', 'Current Balance')}</Text>
        <Text
          style={[
            styles.balanceValue,
            { color: isNegative ? theme.danger : theme.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(account.currentBalance, currency.symbol)}
        </Text>
      </View>

      <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>{t('starting', 'Starting')}</Text>
          <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(account.initialBalance, currency.symbol)}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>{t('income', 'Income')}</Text>
          <Text style={[styles.statValue, { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>
            +{formatCurrency(account.totalIncome || 0, currency.symbol)}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>{t('expenses', 'Expenses')}</Text>
          <Text style={[styles.statValue, { color: theme.danger }]} numberOfLines={1} adjustsFontSizeToFit>
            -{formatCurrency(account.totalExpense || 0, currency.symbol)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullCard: {
    padding: 16,
    borderRadius: UI_TOKENS.radius.card,
    borderWidth: 1,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accName: {
    fontSize: 16,
    fontWeight: '700',
  },
  accType: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 6,
  },
  dragHandlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  dragGripBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    marginVertical: 14,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statCol: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  compactCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 174,
    maxWidth: 196,
    marginRight: 10,
    gap: 8,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactName: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactBalance: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
});

export const AccountCard = React.memo(AccountCardComponent);
