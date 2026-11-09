import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { AccountCard } from '../components/AccountCard';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency } from '../utils/formatters';
import { generateAccountStatementPDF } from '../utils/pdfGenerator';
import { CategoryManagerModal } from '../components/modals/CategoryManagerModal';
import { ReceiptImageShareModal } from '../components/modals/ReceiptImageShareModal';

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
    deleteTransaction,
  } = useFinance();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedAccountForImage, setSelectedAccountForImage] = useState(null);
  const [selectedReceiptForImage, setSelectedReceiptForImage] = useState(null);
  const [selectedFilterAccount, setSelectedFilterAccount] = useState('all');
  const [accountSearch, setAccountSearch] = useState('');

  const filteredAccountTransactions = transactions.filter((t) => {
    if (selectedFilterAccount !== 'all' && t.accountId !== selectedFilterAccount) return false;
    if (accountSearch.trim()) {
      const q = accountSearch.toLowerCase().trim();
      return (
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        String(t.amount).includes(q)
      );
    }
    return true;
  });

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

      {/* Add / Manage Categories Section */}
      <TouchableOpacity
        onPress={() => setCategoryModalVisible(true)}
        style={[styles.categoryCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
        activeOpacity={0.8}
      >
        <View style={styles.catCardLeft}>
          <View style={[styles.catCardIcon, { backgroundColor: '#8B5CF625' }]}>
            <Ionicons name="pricetags-outline" size={20} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.catCardTitle, { color: theme.text }]}>Add & Manage Categories</Text>
            <Text style={[styles.catCardSub, { color: theme.textMuted }]}>
              Create or remove custom expense and income categories
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </TouchableOpacity>

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
            onPress={() => setSelectedAccountForImage(acc)}
            style={[styles.statementBar, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="image-outline" size={16} color="#25D366" />
              <Text style={[styles.statementText, { color: theme.text }]}>
                Share <Text style={{ fontWeight: '800' }}>{acc.name}</Text> Statement as Image
              </Text>
            </View>
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Account Transactions Ledger Section */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Wallet Transactions Ledger</Text>
          <Text style={[styles.countText, { color: theme.textMuted }]}>
            {filteredAccountTransactions.length} records • {selectedFilterAccount === 'all' ? 'All Wallets' : accounts.find(a => a.id === selectedFilterAccount)?.name}
          </Text>
        </View>
      </View>

      {/* Account Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
        <TouchableOpacity
          onPress={() => setSelectedFilterAccount('all')}
          style={[
            styles.filterPill,
            {
              backgroundColor: selectedFilterAccount === 'all' ? theme.primary : theme.cardAlt,
              borderColor: selectedFilterAccount === 'all' ? theme.primaryLight : theme.border,
            },
          ]}
        >
          <Text style={[styles.filterPillText, { color: selectedFilterAccount === 'all' ? '#FFF' : theme.text }]}>
            All Wallets
          </Text>
        </TouchableOpacity>

        {accounts.map((acc) => {
          const isSelected = selectedFilterAccount === acc.id;
          return (
            <TouchableOpacity
              key={`wallet_pill_${acc.id}`}
              onPress={() => setSelectedFilterAccount(acc.id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected ? theme.primary : theme.cardAlt,
                  borderColor: isSelected ? theme.primaryLight : theme.border,
                },
              ]}
            >
              <Text style={{ fontSize: 13, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
              <Text style={[styles.filterPillText, { color: isSelected ? '#FFF' : theme.text }]}>
                {acc.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search wallet transactions..."
          placeholderTextColor={theme.textMuted}
          value={accountSearch}
          onChangeText={setAccountSearch}
        />
        {accountSearch.length > 0 && (
          <TouchableOpacity onPress={() => setAccountSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Transactions List */}
      {filteredAccountTransactions.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
          <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            No transactions found for this wallet.
          </Text>
        </View>
      ) : (
        filteredAccountTransactions.map((item) => (
          <View key={`wallet_tx_${item.id}`} style={{ marginBottom: 6 }}>
            <TransactionItem
              transaction={item}
              onPress={() => onEditAccount && onEditAccount(item)}
              onDelete={deleteTransaction}
            />
            <TouchableOpacity
              onPress={() => setSelectedReceiptForImage(item)}
              style={[styles.quickShareBtn, { backgroundColor: theme.cardAlt }]}
            >
              <Ionicons name="image-outline" size={13} color="#25D366" />
              <Text style={[styles.quickShareText, { color: theme.textMuted }]}>
                Share Receipt Image
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
      />

      {/* WhatsApp Account Statement Image Preview Modal */}
      <ReceiptImageShareModal
        visible={!!selectedAccountForImage}
        onClose={() => setSelectedAccountForImage(null)}
        type="account"
        data={selectedAccountForImage}
      />

      {/* WhatsApp Transaction Receipt Image Preview Modal */}
      <ReceiptImageShareModal
        visible={!!selectedReceiptForImage}
        onClose={() => setSelectedReceiptForImage(null)}
        type="transaction"
        data={selectedReceiptForImage}
      />
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
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  catCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  catCardSub: {
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
  filterPillsScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  quickShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    marginTop: 2,
    marginBottom: 4,
  },
  quickShareText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
