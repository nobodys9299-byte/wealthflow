import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  BackHandler,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import { generateTransactionPDF } from '../utils/pdfGenerator';
import { ReceiptImageShareModal } from '../components/modals/ReceiptImageShareModal';

export const TransactionsScreen = ({ onEditTransaction, onOpenAddTransaction, onNavigateTab, onBack, onOpenMore }) => {
  const { theme, currency, transactions, accounts, deleteTransaction, t } = useFinance();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Hardware back handler
  useEffect(() => {
    const handleBack = () => {
      if (selectedReceipt) {
        setSelectedReceipt(null);
        return true;
      }
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
  }, [selectedReceipt, onBack, onNavigateTab]);

  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const titleMatch = (t.title || '').toLowerCase().includes(query);
        const noteMatch = (t.note || '').toLowerCase().includes(query);
        const catMatch = (t.categoryId || '').toLowerCase().includes(query);
        if (!titleMatch && !noteMatch && !catMatch) return false;
      }

      return true;
    });
    return [...list].sort((a, b) => {
      const d = (b.date || '').localeCompare(a.date || '');
      if (d !== 0) return d;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [transactions, search, filterType, filterAccount]);

  const totalFilteredSum = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const amt = parseFloat(t.amount) || 0;
      return t.type === 'income' ? acc + amt : acc - amt;
    }, 0);
  }, [filteredTransactions]);

  const handleShareReceipt = async (transaction) => {
    const cat = getCategoryById(transaction.categoryId, transaction.type);
    const acc = accounts.find((a) => a.id === transaction.accountId);
    await generateTransactionPDF(transaction, cat, acc, currency.symbol);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header with More Menu Button */}
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
            <Text style={[styles.screenTitle, { color: theme.text }]} numberOfLines={1}>{t('transactions', 'Transactions')}</Text>
            <Text style={[styles.subText, { color: theme.textMuted }]} numberOfLines={1}>
              {filteredTransactions.length} {t('records found', 'records found')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onOpenAddTransaction('expense')}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText} numberOfLines={1}>{t('add', 'Add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t('search_placeholder', 'Search by title, merchant, note...')}
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {['all', 'expense', 'income'].map((tType) => (
            <TouchableOpacity
              key={`type_${tType}`}
              onPress={() => setFilterType(tType)}
              style={[
                styles.pill,
                {
                  backgroundColor: filterType === tType ? theme.primary : theme.card,
                  borderColor: filterType === tType ? theme.primaryLight : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: filterType === tType ? '#FFF' : theme.text },
                ]}
              >
                {t(tType === 'all' ? 'All Types' : tType === 'expense' ? 'Expense' : 'Income').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}

          {accounts.map((acc) => (
            <TouchableOpacity
              key={`acc_pill_${acc.id}`}
              onPress={() => setFilterAccount(filterAccount === acc.id ? 'all' : acc.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: filterAccount === acc.id ? theme.primary : theme.card,
                  borderColor: filterAccount === acc.id ? theme.primaryLight : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: filterAccount === acc.id ? '#FFF' : theme.text },
                ]}
              >
                {acc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Total Filtered Summary Pill */}
      <View style={[styles.filteredSumBanner, { backgroundColor: theme.cardAlt }]}>
        <Text style={[styles.sumLabel, { color: theme.textMuted }]}>Net for this filter:</Text>
        <Text
          style={[
            styles.sumValue,
            { color: totalFilteredSum >= 0 ? theme.success : theme.danger },
          ]}
        >
          {totalFilteredSum >= 0 ? '+' : ''}
          {formatCurrency(totalFilteredSum, currency.symbol)}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 6 }}>
            <TransactionItem
              transaction={item}
              onPress={() => onEditTransaction && onEditTransaction(item)}
              onDelete={deleteTransaction}
            />
            {/* Quick Share Receipt Image via WhatsApp */}
            <TouchableOpacity
              onPress={() => setSelectedReceipt(item)}
              style={[styles.quickShareBtn, { backgroundColor: theme.cardAlt }]}
            >
              <Ionicons name="image-outline" size={13} color="#25D366" />
              <Text style={[styles.quickShareText, { color: theme.textMuted }]}>
                Share Receipt Image
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyWrap, { borderColor: theme.border }]}>
            <Ionicons name="receipt-outline" size={42} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No transactions found</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Try adjusting your search terms or filters
            </Text>
          </View>
        }
      />

      {/* WhatsApp Image Receipt Share Modal */}
      <ReceiptImageShareModal
        visible={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        type="transaction"
        data={selectedReceipt}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterSection: {
    marginBottom: 10,
  },
  filterPills: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filteredSumBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sumLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sumValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  quickShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: -6,
    marginBottom: 8,
    marginRight: 6,
  },
  quickShareText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 30,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
});
