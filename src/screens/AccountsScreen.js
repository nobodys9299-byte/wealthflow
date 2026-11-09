import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { AccountCard } from '../components/AccountCard';
import { formatCurrency } from '../utils/formatters';

export const AccountsScreen = ({
  onOpenAddAccount,
  onEditAccount,
  onOpenTransfer,
}) => {
  const {
    theme,
    currency,
    accounts,
    netWorth,
    deleteAccount,
  } = useFinance();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Accounts & Wallets</Text>
          <Text style={[styles.subText, { color: theme.textMuted }]}>
            Multi-currency cash, banks, and cards
          </Text>
        </View>

        <TouchableOpacity
          onPress={onOpenAddAccount}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Add Account</Text>
        </TouchableOpacity>
      </View>

      {/* Net Worth Summary Strip */}
      <View style={[styles.netWorthCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.netWorthLeft}>
          <Text style={[styles.netWorthLabel, { color: theme.textMuted }]}>CONSOLIDATED NET WORTH</Text>
          <Text style={[styles.netWorthValue, { color: theme.text }]}>
            {formatCurrency(netWorth, currency.symbol)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onOpenTransfer}
          style={[styles.transferBtn, { backgroundColor: theme.primaryBg }]}
        >
          <Ionicons name="swap-horizontal" size={18} color={theme.primary} />
          <Text style={[styles.transferBtnText, { color: theme.primary }]}>Transfer</Text>
        </TouchableOpacity>
      </View>

      {/* List of Accounts */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Accounts</Text>
        <Text style={[styles.countText, { color: theme.textMuted }]}>
          {accounts.length} Total
        </Text>
      </View>

      {accounts.map((acc) => (
        <AccountCard
          key={acc.id}
          account={acc}
          onEdit={onEditAccount}
          onDelete={accounts.length > 1 ? deleteAccount : null}
        />
      ))}
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
  netWorthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  netWorthLeft: {
    flex: 1,
  },
  netWorthLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  netWorthValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  transferBtnText: {
    fontSize: 13,
    fontWeight: '800',
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
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
