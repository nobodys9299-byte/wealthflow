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
import { generateAccountStatementPDF } from '../utils/pdfGenerator';

export const AccountsScreen = ({
  onOpenAddAccount,
  onEditAccount,
  onOpenTransfer,
  onNavigateTab,
}) => {
  const {
    theme,
    currency,
    accounts,
    transactions,
    netWorth,
    deleteAccount,
  } = useFinance();

  const handleShareStatement = async (acc) => {
    await generateAccountStatementPDF(acc, transactions, currency.symbol);
  };

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
            Multi-currency cash, banks, and statements
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
        <View key={acc.id} style={{ marginBottom: 14 }}>
          <AccountCard
            account={acc}
            onEdit={onEditAccount}
            onDelete={accounts.length > 1 ? deleteAccount : null}
          />
          {/* Statement Share Action Bar */}
          <TouchableOpacity
            onPress={() => handleShareStatement(acc)}
            style={[styles.statementBar, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={[styles.statementText, { color: theme.text }]}>
                Share <Text style={{ fontWeight: '800' }}>{acc.name}</Text> Statement as PDF
              </Text>
            </View>
            <Ionicons name="share-outline" size={16} color={theme.primaryLight} />
          </TouchableOpacity>
        </View>
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
    marginBottom: 14,
  },
  netWorthLeft: {
    flex: 1,
  },
  netWorthLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
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
  lendingPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  promoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F125',
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  promoSub: {
    fontSize: 11,
    marginTop: 2,
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
  statementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -4,
  },
  statementText: {
    fontSize: 12,
  },
});
