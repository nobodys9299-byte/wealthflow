import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { AccountVisual } from './common/CategoryVisual';

const AccountCardComponent = ({ account, onEdit, onDelete, compact = false, onPress, isSelected = false }) => {
  const { theme, currency } = useFinance();
  const isNegative = account.currentBalance < 0;

  if (compact) {
    const CardWrapper = onPress ? TouchableOpacity : View;
    return (
      <CardWrapper
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.compactCard,
          {
            backgroundColor: isSelected ? `${theme.primary}20` : theme.card,
            borderColor: isSelected ? theme.primary : theme.border,
            borderWidth: isSelected ? 1.5 : 1,
          },
        ]}
      >
        <AccountVisual account={account} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.compactName, { color: isSelected ? theme.primaryLight : theme.text }]} numberOfLines={1}>
            {account.name}
          </Text>
          <Text
            style={[
              styles.compactBalance,
              { color: isNegative ? theme.danger : theme.text },
            ]}
          >
            {formatCurrency(account.currentBalance, currency.symbol)}
          </Text>
        </View>
      </CardWrapper>
    );
  }

  return (
    <View
      style={[
        styles.fullCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
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
              {account.type?.toUpperCase()} ACCOUNT
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
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
        </View>
      </View>

      <View style={styles.balanceSection}>
        <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>Current Balance</Text>
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
          <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>Starting</Text>
          <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(account.initialBalance, currency.symbol)}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>Income</Text>
          <Text style={[styles.statValue, { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>
            +{formatCurrency(account.totalIncome || 0, currency.symbol)}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>Expenses</Text>
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
    borderRadius: 22,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    width: 170,
    marginRight: 10,
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
