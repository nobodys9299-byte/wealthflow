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
import { SummaryCards } from '../components/SummaryCards';
import { AccountCard } from '../components/AccountCard';
import { TransactionItem } from '../components/TransactionItem';

export const DashboardScreen = ({
  onOpenAddTransaction,
  onOpenTransfer,
  onOpenAddAccount,
  onOpenSmartInbox,
  onNavigateTab,
}) => {
  const {
    theme,
    accounts,
    transactions,
    budgetStatusList,
    deleteTransaction,
  } = useFinance();

  const alertedBudgets = budgetStatusList.filter(
    (b) => b.status === 'exceeded' || b.status === 'warning'
  );

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top App Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.welcomeSub, { color: theme.textMuted }]}>
            Welcome back,
          </Text>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>
            WealthFlow Dashboard
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* SMS & Gmail Auto-fetch Inbox button with pulse dot */}
          <TouchableOpacity
            onPress={onOpenSmartInbox}
            style={[styles.smartInboxBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="mail-unread-outline" size={20} color={theme.primaryLight} />
            <View style={[styles.pulseDot, { backgroundColor: theme.danger }]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Net Worth and Cash Flow Summary */}
      <SummaryCards />

      {/* Smart Auto-Fetch Banner */}
      <TouchableOpacity
        onPress={onOpenSmartInbox}
        style={[styles.autoFetchBanner, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
        activeOpacity={0.8}
      >
        <View style={styles.bannerLeft}>
          <View style={[styles.bannerIcon, { backgroundColor: `${theme.primary}25` }]}>
            <Ionicons name="flash-outline" size={18} color={theme.primaryLight} />
          </View>
          <View>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              SMS & Gmail Bank Auto-Sync
            </Text>
            <Text style={[styles.bannerSub, { color: theme.textMuted }]}>
              Pending transactions detected • Requires confirmation
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </TouchableOpacity>

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          onPress={() => onOpenAddTransaction('expense')}
          style={[styles.actionBtn, { backgroundColor: theme.danger }]}
        >
          <Ionicons name="arrow-up" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenAddTransaction('income')}
          style={[styles.actionBtn, { backgroundColor: theme.success }]}
        >
          <Ionicons name="arrow-down" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenTransfer}
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="swap-horizontal" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>Transfer</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Alerts Banner */}
      {alertedBudgets.length > 0 && (
        <TouchableOpacity
          onPress={() => onNavigateTab('budgets')}
          style={[
            styles.alertBanner,
            {
              backgroundColor: theme.warningBg,
              borderColor: theme.warning,
            },
          ]}
        >
          <Ionicons name="warning-outline" size={20} color={theme.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: theme.warning }]}>
              Budget Alert ({alertedBudgets.length} Category)
            </Text>
            <Text style={[styles.alertDesc, { color: theme.text }]} numberOfLines={1}>
              {alertedBudgets[0].rawPercent}% of budget spent on {alertedBudgets[0].categoryId}. Tap to view.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.warning} />
        </TouchableOpacity>
      )}

      {/* Accounts Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Accounts & Wallets</Text>
        <TouchableOpacity
          onPress={onOpenAddAccount}
          style={styles.seeAllBtn}
        >
          <Ionicons name="add-circle-outline" size={16} color={theme.primaryLight} />
          <Text style={[styles.seeAllText, { color: theme.primaryLight }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsRow}>
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} compact />
        ))}
      </ScrollView>

      {/* Recent Transactions Section */}
      <View style={[styles.sectionHeader, { marginTop: 22 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        <TouchableOpacity
          onPress={() => onNavigateTab('transactions')}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: theme.primaryLight }]}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.primaryLight} />
        </TouchableOpacity>
      </View>

      {recentTransactions.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No transactions recorded yet. Tap + to add one!
          </Text>
        </View>
      ) : (
        recentTransactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onDelete={deleteTransaction}
          />
        ))
      )}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  smartInboxBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  autoFetchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  alertDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountsRow: {
    paddingVertical: 4,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
