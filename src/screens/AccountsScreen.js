import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { AccountCard } from '../components/AccountCard';
import { formatCurrency } from '../utils/formatters';
import { generateAccountStatementPDF } from '../utils/pdfGenerator';
import { CategoryManagerModal } from '../components/modals/CategoryManagerModal';
import { ReceiptImageShareModal } from '../components/modals/ReceiptImageShareModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AccountsScreen = ({
  onOpenAddAccount,
  onEditAccount,
  onOpenTransfer,
  onNavigateTab,
  onBack,
  onOpenMore,
}) => {
  const {
    theme,
    currency,
    accounts,
    transactions,
    netWorth,
    deleteAccount,
    reorderAccounts,
    runWithSystemPicker,
    t,
  } = useFinance();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedAccountForImage, setSelectedAccountForImage] = useState(null);
  const [isReorderingAccounts, setIsReorderingAccounts] = useState(false);

  const handleMoveAccount = (index, delta) => {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= accounts.length) return;
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (_e) {}
    const updated = [...accounts];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    if (reorderAccounts) {
      reorderAccounts(updated);
    }
  };

  // Handle hardware and UI back button so pressing back navigates to home instead of quitting
  useEffect(() => {
    const handleBackPress = () => {
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

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [onBack, onNavigateTab]);

  const handleShareStatement = async (acc) => {
    await generateAccountStatementPDF(acc, transactions, currency.symbol, { runWithSystemPicker });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header with More Menu Button */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <TouchableOpacity
            onPress={onOpenMore || (() => onNavigateTab && onNavigateTab('settings'))}
            style={[styles.menuBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityLabel="Open Menu"
          >
            <Ionicons name="menu-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: theme.text }]} numberOfLines={1}>
              {t('account_categories', 'Account & Categories')}
            </Text>
            <Text style={[styles.subText, { color: theme.textMuted }]} numberOfLines={1}>
              {t('Manage bank accounts, wallets, and custom categories', 'Manage bank accounts, wallets, and custom categories')}
            </Text>
          </View>
        </View>
      </View>

      {/* Net Worth Summary Strip - Harmonious Top Display Panel */}
      <View style={[styles.netWorthCard, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: '#10B981', borderTopWidth: 3.5 }]}>
        <View style={styles.netWorthLeft}>
          <Text style={[styles.netWorthLabel, { color: '#10B981', fontWeight: '800' }]}>{t('total_consolidated_wealth', 'TOTAL CONSOLIDATED WEALTH')}</Text>
          <Text style={[styles.netWorthValue, { color: theme.text }]}>
            {formatCurrency(netWorth, currency.symbol)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onOpenTransfer}
          style={[styles.transferBtn, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40`, borderWidth: 1 }]}
        >
          <Ionicons name="swap-horizontal" size={18} color={theme.primaryLight} />
          <Text style={[styles.transferBtnText, { color: theme.primaryLight }]}>{t('transfer', 'Transfer')}</Text>
        </TouchableOpacity>
      </View>

      {/* Management Action Cards */}
      <View style={styles.actionCardsWrap}>
        {/* Add Account Option (Placed above Add & Manage Categories) */}
        <TouchableOpacity
          onPress={onOpenAddAccount}
          style={[styles.categoryCard, { backgroundColor: theme.cardAlt, borderColor: theme.border, marginBottom: 10 }]}
          activeOpacity={0.8}
        >
          <View style={styles.catCardLeft}>
            <View style={[styles.catCardIcon, { backgroundColor: `${theme.primary}25` }]}>
              <Ionicons name="wallet-outline" size={20} color={theme.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catCardTitle, { color: theme.text }]}>{t('add_account', 'Add Account')}</Text>
              <Text style={[styles.catCardSub, { color: theme.textMuted }]}>
                {t('Add bank, cash wallet, credit card, or savings vault', 'Add bank, cash wallet, credit card, or savings vault')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Add & Manage Categories Option */}
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
              <Text style={[styles.catCardTitle, { color: theme.text }]}>{t('Add & Manage Categories', 'Add & Manage Categories')}</Text>
              <Text style={[styles.catCardSub, { color: theme.textMuted }]}>
                {t('Create, edit, or delete custom expense and income categories', 'Create, edit, or delete custom expense and income categories')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* List of Accounts */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Active Accounts', 'Active Accounts')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {accounts.length > 1 && (
            <TouchableOpacity
              onPress={() => setIsReorderingAccounts((prev) => !prev)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
                backgroundColor: isReorderingAccounts ? theme.success : `${theme.primary}18`,
              }}
            >
              <Ionicons
                name={isReorderingAccounts ? 'checkmark' : 'swap-vertical'}
                size={13}
                color={isReorderingAccounts ? '#FFF' : theme.primaryLight}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isReorderingAccounts ? '#FFF' : theme.primaryLight,
                }}
              >
                {isReorderingAccounts ? 'Done' : 'Arrange'}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.countText, { color: theme.textMuted }]}>
            {accounts.length} {t('Total', 'Total')}
          </Text>
        </View>
      </View>

      {accounts.map((acc, accIdx) => (
        <View key={acc.id} style={{ marginBottom: 14 }}>
          <AccountCard
            account={acc}
            onEdit={onEditAccount}
            onDelete={accounts.length > 1 ? deleteAccount : null}
            reorderMode={isReorderingAccounts}
            canMoveBackward={accIdx > 0}
            canMoveForward={accIdx < accounts.length - 1}
            onMoveBackward={() => handleMoveAccount(accIdx, -1)}
            onMoveForward={() => handleMoveAccount(accIdx, 1)}
            onLongPress={() => setIsReorderingAccounts((prev) => !prev)}
          />
          {/* Statement Share Action Bar */}
          <TouchableOpacity
            onPress={() => setSelectedAccountForImage({
              ...acc,
              transactions: transactions.filter((t) => t.accountId === acc.id),
            })}
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
