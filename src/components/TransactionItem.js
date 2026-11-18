import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import { CategoryVisual } from './common/CategoryVisual';

const TransactionItemComponent = ({ transaction, onPress, onEdit, onDelete }) => {
  const { theme, currency, accounts } = useFinance();
  const isIncome = transaction.type === 'income';
  const category = getCategoryById(transaction.categoryId, transaction.type);
  const account = accounts.find((a) => a.id === transaction.accountId);

  const handleItemPress = () => {
    if (onEdit) {
      onEdit(transaction);
    } else if (onPress) {
      onPress(transaction);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleItemPress}
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
      <View style={[styles.details, { flex: 1, marginRight: 6 }]}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {transaction.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.categoryName, { color: category.color }]} numberOfLines={1}>
            {category.name}
          </Text>
          {account && (
            <>
              <Text style={{ color: theme.border }}>•</Text>
              <View style={styles.accountBadge}>
                <Text style={[styles.accountName, { color: theme.textMuted }]} numberOfLines={1}>
                  {account.name}
                </Text>
              </View>
            </>
          )}
          <Text style={{ color: theme.border }}>•</Text>
          <Text style={[styles.date, { color: theme.textMuted }]} numberOfLines={1}>
            {formatDateDisplay(transaction.date)}
          </Text>
        </View>
      </View>

      {/* Amount and action buttons */}
      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? theme.success : theme.danger },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, currency.symbol)}
        </Text>

        <View style={styles.actionButtonsRow}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => onEdit(transaction)}
            >
              <Ionicons name="pencil" size={15} color={theme.primaryLight} />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => onDelete(transaction.id)}
            >
              <Ionicons name="trash-outline" size={15} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
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
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    padding: 3,
    opacity: 0.85,
  },
});

export const TransactionItem = React.memo(TransactionItemComponent);
