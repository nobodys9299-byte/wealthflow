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
  onPress,
  onLongPress,
  isSelected = false,
  reorderMode = false,
  positionIndex,
  onMoveBackward,
  onMoveForward,
  canMoveBackward = false,
  canMoveForward = false,
}) => {
  const { theme, currency, t } = useFinance();
  const isNegative = account.currentBalance < 0;

  if (compact) {
    const CardWrapper = onPress || onLongPress ? TouchableOpacity : View;
    return (
      <CardWrapper
        onPress={reorderMode ? undefined : onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
        activeOpacity={reorderMode ? 1 : 0.8}
        style={[
          styles.compactCard,
          UI_TOKENS.shadow.card,
          {
            backgroundColor: reorderMode
              ? `${theme.primary}15`
              : isSelected
              ? `${theme.primary}20`
              : theme.card,
            borderColor: reorderMode || isSelected ? theme.primary : theme.border,
            borderWidth: reorderMode || isSelected ? 1.5 : 1,
          },
        ]}
      >
        <View style={styles.compactTopRow}>
          <AccountVisual account={account} size={36} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.compactName,
                { color: reorderMode || isSelected ? theme.primaryLight : theme.text },
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
          {reorderMode && positionIndex !== undefined && (
            <View style={[styles.posBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.posBadgeText}>#{positionIndex + 1}</Text>
            </View>
          )}
        </View>

        {reorderMode && (
          <View style={[styles.reorderBar, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              onPress={onMoveBackward}
              disabled={!canMoveBackward}
              style={[
                styles.reorderArrowBtn,
                {
                  backgroundColor: theme.cardAlt,
                  borderColor: theme.border,
                  opacity: canMoveBackward ? 1 : 0.32,
                },
              ]}
              accessibilityLabel={`Move ${account.name} left`}
            >
              <Ionicons name="chevron-back" size={16} color={theme.primaryLight} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onMoveForward}
              disabled={!canMoveForward}
              style={[
                styles.reorderArrowBtn,
                {
                  backgroundColor: theme.cardAlt,
                  borderColor: theme.border,
                  opacity: canMoveForward ? 1 : 0.32,
                },
              ]}
              accessibilityLabel={`Move ${account.name} right`}
            >
              <Ionicons name="chevron-forward" size={16} color={theme.primaryLight} />
            </TouchableOpacity>
          </View>
        )}
      </CardWrapper>
    );
  }

  const FullWrapper = onLongPress ? TouchableOpacity : View;

  return (
    <FullWrapper
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.95}
      style={[
        styles.fullCard,
        UI_TOKENS.shadow.card,
        {
          backgroundColor: theme.card,
          borderColor: reorderMode ? theme.primary : theme.border,
          borderWidth: reorderMode ? 1.5 : 1,
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
          {reorderMode ? (
            <>
              <TouchableOpacity
                onPress={onMoveBackward}
                disabled={!canMoveBackward}
                style={[styles.orderIconBtn, { backgroundColor: theme.cardAlt, opacity: canMoveBackward ? 1 : 0.35 }]}
              >
                <Ionicons name="arrow-up" size={15} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onMoveForward}
                disabled={!canMoveForward}
                style={[styles.orderIconBtn, { backgroundColor: theme.cardAlt, opacity: canMoveForward ? 1 : 0.35 }]}
              >
                <Ionicons name="arrow-down" size={15} color={theme.text} />
              </TouchableOpacity>
            </>
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
    </FullWrapper>
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
  orderIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
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
  posBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  posBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  reorderBar: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  reorderArrowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  reorderArrowLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export const AccountCard = React.memo(AccountCardComponent);
