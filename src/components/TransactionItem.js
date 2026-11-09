import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import { CategoryVisual } from './common/CategoryVisual';

export const TransactionItem = ({ transaction, onPress, onDelete }) => {
  const { theme, currency, accounts } = useFinance();
  const isIncome = transaction.type === 'income';
  const category = getCategoryById(transaction.categoryId, transaction.type);
  const account = accounts.find((a) => a.id === transaction.accountId);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress && onPress(transaction)}
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Category Visual Badge with Artwork/Emoji */}
      <CategoryVisual category={category} size={46} isTransfer={transaction.isTransfer} />

      {/* Details */}
      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {transaction.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.categoryName, { color: category.color }]}>
            {category.name}
          </Text>
          {account && (
            <>
              <Text style={{ color: theme.border }}>•</Text>
              <View style={styles.accountBadge}>
                <Text style={[styles.accountName, { color: theme.textMuted }]}>
                  {account.name}
                </Text>
              </View>
            </>
          )}
          <Text style={{ color: theme.border }}>•</Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>
            {formatDateDisplay(transaction.date)}
          </Text>
        </View>
      </View>

      {/* Amount and delete button */}
      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? theme.success : theme.danger },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, currency.symbol)}
        </Text>

        {onDelete && (
          <TouchableOpacity
            style={styles.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => onDelete(transaction.id)}
          >
            <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    opacity: 0.6,
  },
});
