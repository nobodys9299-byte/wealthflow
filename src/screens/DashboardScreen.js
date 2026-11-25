import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance, DEFAULT_HOME_SECTIONS } from '../context/FinanceContext';
import { SummaryCards } from '../components/SummaryCards';
import { AccountCard } from '../components/AccountCard';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';

export const DashboardScreen = ({
  onOpenAddTransaction,
  onOpenTransfer,
  onOpenAddAccount,
  onOpenAddRecurring,
  onOpenSettings,
  onEditTransaction,
  onNavigateTab,
}) => {
  const {
    theme,
    accounts,
    transactions,
    budgetStatusList,
    deleteTransaction,
    recurring = [],
    currency,
    netWorth,
    homeSections = DEFAULT_HOME_SECTIONS,
    updateHomeSections,
    logRecurringPaymentNow,
    t,
  } = useFinance();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income'
  const [filterAccountId, setFilterAccountId] = useState('all');

  // More Options Menu & Customize Home Sections state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [tempSections, setTempSections] = useState(homeSections);

  const selectedAccountObj = accounts.find((a) => a.id === filterAccountId);

  const alertedBudgets = useMemo(() => {
    return (budgetStatusList || []).filter(
      (b) => b.status === 'exceeded' || b.status === 'warning'
    );
  }, [budgetStatusList]);

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (filterType !== 'all') {
      list = list.filter((t) => t.type === filterType);
    }
    if (filterAccountId !== 'all') {
      list = list.filter((t) => t.accountId === filterAccountId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          String(t.amount).includes(q)
      );
    }
    return list;
  }, [transactions, filterType, filterAccountId, searchQuery]);

  const displayTransactions = useMemo(() => {
    let list = transactions;
    if (showSearch) {
      list = filteredTransactions;
    } else if (filterAccountId !== 'all') {
      list = transactions.filter((t) => t.accountId === filterAccountId);
    }
    return [...list].sort((a, b) => {
      const d = (b.date || '').localeCompare(a.date || '');
      if (d !== 0) return d;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [showSearch, filteredTransactions, transactions, filterAccountId]);

  const handleOpenCustomize = () => {
    setTempSections(homeSections && homeSections.length ? [...homeSections] : [...DEFAULT_HOME_SECTIONS]);
    setShowMoreMenu(false);
    setShowCustomizeModal(true);
  };

  const handleMoveSection = (index, direction) => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= tempSections.length) return;
    const updated = [...tempSections];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setTempSections(updated);
  };

  const handleToggleSection = (id) => {
    setTempSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: s.enabled === false ? true : false } : s))
    );
  };

  const handleSaveSections = () => {
    if (updateHomeSections) {
      updateHomeSections(tempSections);
    }
    setShowCustomizeModal(false);
  };

  const handleResetSections = () => {
    setTempSections([...DEFAULT_HOME_SECTIONS]);
    if (updateHomeSections) {
      updateHomeSections(DEFAULT_HOME_SECTIONS);
    }
    setShowCustomizeModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Top App Header with 3-Bar Hamburger Menu and Search */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {/* 3-bar Hamburger Menu Button for Settings */}
          <TouchableOpacity
            onPress={onOpenSettings}
            style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityLabel="Open Settings"
          >
            <Ionicons name="menu-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          <View>
            <Text style={[styles.welcomeSub, { color: theme.textMuted }]}>
              {t('welcome_back', 'Welcome back,')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                {t('home_dashboard', 'Home Dashboard')}
              </Text>
              <TouchableOpacity
                onPress={handleOpenCustomize}
                style={{ padding: 4 }}
                accessibilityLabel="Edit Home Dashboard"
              >
                <Ionicons name="pencil-outline" size={16} color={theme.primaryLight} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Top Right Search Button */}
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={[
              styles.iconBtn,
              {
                backgroundColor: showSearch ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            accessibilityLabel="Search Transactions"
          >
            <Ionicons
              name={showSearch ? 'close' : 'search-outline'}
              size={20}
              color={showSearch ? '#FFF' : theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Search & Filter Drawer */}
      {showSearch && (
        <View style={[styles.searchDrawer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t('search_placeholder', 'Search title, note, or amount...')}
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Type Filter Chips */}
          <View style={styles.filterChipRow}>
            {['all', 'expense', 'income'].map((typeKey) => {
              const active = filterType === typeKey;
              return (
                <TouchableOpacity
                  key={typeKey}
                  onPress={() => setFilterType(typeKey)}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? '#FFF' : theme.textMuted, textTransform: 'capitalize' },
                    ]}
                  >
                    {typeKey === 'all' ? t('all_types', 'All Types') : t(typeKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Account Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => setFilterAccountId('all')}
              style={[
                styles.accountChip,
                filterAccountId === 'all'
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: theme.cardAlt, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: filterAccountId === 'all' ? '#FFF' : theme.textMuted, fontSize: 12, fontWeight: '600' }}>
                {t('all_accounts', 'All Accounts')}
              </Text>
            </TouchableOpacity>
            {accounts.map((acc) => {
              const active = filterAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setFilterAccountId(acc.id)}
                  style={[
                    styles.accountChip,
                    active
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  ]}
                >
                  <Text style={{ fontSize: 12, marginRight: 4 }}>{acc.emoji || '🏦'}</Text>
                  <Text style={{ color: active ? '#FFF' : theme.textMuted, fontSize: 12, fontWeight: '600' }}>
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Net Worth and Cash Flow Summary */}
      <SummaryCards />

      {/* Quick Action Buttons (Balanced 3-Button Layout) */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          onPress={() => onOpenAddTransaction('expense')}
          style={[styles.actionBtn, { backgroundColor: theme.danger }]}
        >
          <Ionicons name="arrow-up" size={17} color="#FFF" />
          <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>{t('Expense')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenAddTransaction('income')}
          style={[styles.actionBtn, { backgroundColor: theme.success }]}
        >
          <Ionicons name="arrow-down" size={17} color="#FFF" />
          <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>{t('Income')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenTransfer}
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="swap-horizontal" size={17} color="#FFF" />
          <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>{t('Transfer')}</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Alerts Banner */}
      {alertedBudgets.length > 0 && (() => {
        const firstAlert = alertedBudgets[0];
        const catObj = getCategoryById(firstAlert.categoryId, 'expense');
        const catDisplayName = catObj ? `${catObj.emoji || '🏷️'} ${catObj.name}` : firstAlert.categoryId;
        return (
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
                {t('budget_alert', 'Budget Alert')} ({alertedBudgets.length} {alertedBudgets.length === 1 ? t('category', 'Category') : t('categories', 'Categories')})
              </Text>
              <Text style={[styles.alertDesc, { color: theme.text }]} numberOfLines={1}>
                {firstAlert.rawPercent}% of budget spent on {catDisplayName}. Tap to view.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.warning} />
          </TouchableOpacity>
        );
      })()}

      {/* Dynamic Sections (Accounts, Recurring bills, All transactions in user-defined order) */}
      {(homeSections || DEFAULT_HOME_SECTIONS).map((section) => {
        if (section.enabled === false) return null;

        if (section.id === 'accounts') {
          return (
            <View key="accounts">
              {/* Accounts Section */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Accounts')}</Text>
                <TouchableOpacity
                  onPress={onOpenAddAccount}
                  style={styles.seeAllBtn}
                >
                  <Ionicons name="add-circle-outline" size={16} color={theme.primaryLight} />
                  <Text style={[styles.seeAllText, { color: theme.primaryLight }]}>{t('Add', 'Add')}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsRow}>
                {accounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    compact
                    onPress={() => setFilterAccountId(filterAccountId === acc.id ? 'all' : acc.id)}
                    isSelected={filterAccountId === acc.id}
                  />
                ))}
              </ScrollView>
            </View>
          );
        }

        if (section.id === 'recurring') {
          if (!recurring || recurring.length === 0) {
            return null;
          }

          return (
            <View key="recurring">
              {/* Recurring Bills & Auto-Pay Section */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('recurring_bills', 'Recurring Pay & Bills')}</Text>
                  <View style={[styles.recBadge, { backgroundColor: '#8B5CF625' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B5CF6' }}>
                      {recurring.length}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onOpenAddRecurring}
                  style={[styles.addRecHeaderBtn, { backgroundColor: '#8B5CF618', borderColor: '#8B5CF640' }]}
                >
                  <Ionicons name="add" size={14} color="#8B5CF6" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#8B5CF6' }}>{t('add_recurring', 'Add Recurring')}</Text>
                </TouchableOpacity>
              </View>

              {recurring.length === 0 ? (
                <TouchableOpacity
                  onPress={onOpenAddRecurring}
                  style={[styles.emptyRecBox, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Ionicons name="repeat-outline" size={24} color="#8B5CF6" />
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[styles.emptyRecTitle, { color: theme.text }]}>{t('no_recurring', 'No recurring bills yet')}</Text>
                    <Text style={[styles.emptyRecSub, { color: theme.textMuted }]}>
                      {t('tap_add_recurring', 'Schedule subscriptions, rent & utility bills directly from Home')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recScroll}>
                  {recurring.map((rec) => {
                    const isIncome = rec.type === 'income';
                    const cat = getCategoryById(rec.categoryId, rec.type);
                    const dueDay = rec.dayOfMonth || (rec.nextDueDate ? new Date(rec.nextDueDate).getDate() : 1);
                    const accentColor = isIncome ? theme.success : (cat?.color || '#8B5CF6');

                    return (
                      <View
                        key={rec.id}
                        style={[
                          styles.recCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            borderTopColor: accentColor,
                            borderTopWidth: 3,
                          },
                        ]}
                      >
                        {/* Top Row: Category Icon Graphic & Frequency Badge */}
                        <View style={styles.recCardTop}>
                          <View style={[styles.recIconWrap, { backgroundColor: `${accentColor}25` }]}>
                            <Text style={{ fontSize: 16 }}>{cat?.emoji || (isIncome ? '💰' : '⚡')}</Text>
                          </View>

                          <View style={[styles.recFreqPill, { backgroundColor: `${accentColor}18` }]}>
                            <Ionicons name="repeat" size={10} color={accentColor} />
                            <Text style={[styles.recFreqText, { color: accentColor }]}>
                              {rec.frequency ? rec.frequency.toUpperCase() : 'MONTHLY'}
                            </Text>
                          </View>
                        </View>

                        {/* Category Graphic Tag */}
                        <Text style={[styles.recCatName, { color: accentColor }]} numberOfLines={1}>
                          {cat?.name || 'Recurring'}
                        </Text>

                        {/* Recurring Title */}
                        <Text style={[styles.recTitle, { color: theme.text }]} numberOfLines={1}>
                          {rec.title}
                        </Text>

                        {/* Bottom Row: Amount & Due Day Tag */}
                        <View style={styles.recBottomRow}>
                          <Text
                            style={[
                              styles.recAmount,
                              { color: isIncome ? theme.success : theme.text },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(rec.amount, currency.symbol)}
                          </Text>
                          <View style={[styles.recDueBadge, { backgroundColor: theme.cardAlt }]}>
                            <Text style={[styles.recDueText, { color: theme.textMuted }]}>
                              Day {dueDay}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          );
        }

        if (section.id === 'transactions') {
          return (
            <View key="transactions">
              {/* Transactions Section: Scrollable list of ALL transactions directly on Home */}
              <View style={[styles.sectionHeader, { marginTop: 22 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]} numberOfLines={1}>
                    {showSearch
                      ? t('Search Results', 'Search Results')
                      : filterAccountId !== 'all'
                      ? `${selectedAccountObj?.name || t('Account')} ${t('Ledger', 'Ledger')}`
                      : t('recent_transactions', 'All Transactions')}
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: `${theme.primary}20` }]}>
                    <Text style={[styles.countBadgeText, { color: theme.primaryLight }]}>
                      {displayTransactions.length}
                    </Text>
                  </View>
                  {filterAccountId !== 'all' && (
                    <TouchableOpacity
                      onPress={() => setFilterAccountId('all')}
                      style={[
                        styles.clearFilterPill,
                        { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}40` },
                      ]}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primaryLight }}>{t('all_accounts', 'Show All')}</Text>
                      <Ionicons name="close-circle" size={12} color={theme.primaryLight} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => onNavigateTab('transactions')}
                  style={styles.seeAllBtn}
                >
                  <Text style={[styles.seeAllText, { color: theme.primaryLight }]}>{t('see_all', 'Ledger')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.primaryLight} />
                </TouchableOpacity>
              </View>

              {displayTransactions.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    {showSearch
                      ? t('no_transactions_found', 'No transactions found matching your search and filter criteria.')
                      : filterAccountId !== 'all'
                      ? `No transactions recorded yet for ${selectedAccountObj?.name || 'this account'}.`
                      : t('no_transactions', 'No transactions recorded yet. Tap + to add one!')}
                  </Text>
                </View>
              ) : (
                displayTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={onEditTransaction}
                    onDelete={deleteTransaction}
                  />
                ))
              )}
            </View>
          );
        }

        return null;
      })}
      </ScrollView>

      {/* 3-Dots More Options Menu Modal */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity
          style={[styles.menuBackdrop, { backgroundColor: theme.modalOverlay }]}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={[styles.menuSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuHeaderTitle, { color: theme.text }]}>Dashboard Options</Text>
              <TouchableOpacity onPress={() => setShowMoreMenu(false)}>
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={handleOpenCustomize}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="options-outline" size={18} color={theme.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: theme.text }]}>Edit Home Dashboard</Text>
                <Text style={[styles.menuItemSub, { color: theme.textMuted }]}>
                  Add, remove, or reorder home sections
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowMoreMenu(false);
                onOpenAddAccount();
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="wallet-outline" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: theme.text }]}>Add New Account</Text>
                <Text style={[styles.menuItemSub, { color: theme.textMuted }]}>Bank, cash, or credit card</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowMoreMenu(false);
                onOpenAddRecurring();
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="repeat-outline" size={18} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: theme.text }]}>Add Recurring Bill</Text>
                <Text style={[styles.menuItemSub, { color: theme.textMuted }]}>Automate monthly bills & rent</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                onOpenSettings();
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#64748B20' }]}>
                <Ionicons name="settings-outline" size={18} color={theme.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: theme.text }]}>Settings & Backup</Text>
                <Text style={[styles.menuItemSub, { color: theme.textMuted }]}>Google Cloud backup, CSV export & themes</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Customize Home Sections Bottom Sheet Modal */}
      <Modal visible={showCustomizeModal} transparent animationType="slide" onRequestClose={() => setShowCustomizeModal(false)}>
        <View style={[styles.customizeOverlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableWithoutFeedback onPress={() => setShowCustomizeModal(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
          <View style={[styles.customizeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Grab Pill */}
            <View style={styles.dragPillWrap}>
              <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.customizeHeader}>
              <View>
                <Text style={[styles.customizeTitle, { color: theme.text }]}>Customize Home Dashboard</Text>
                <Text style={[styles.customizeSub, { color: theme.textMuted }]}>
                  Show, hide, or rearrange sections on the home screen
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomizeModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.customizeList} showsVerticalScrollIndicator={false}>
              {tempSections.map((sec, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === tempSections.length - 1;
                const isEnabled = sec.enabled !== false;

                const getIcon = () => {
                  if (sec.id === 'accounts') return 'wallet-outline';
                  if (sec.id === 'recurring') return 'repeat-outline';
                  return 'list-outline';
                };

                return (
                  <View
                    key={sec.id}
                    style={[
                      styles.sectionRow,
                      {
                        backgroundColor: theme.cardAlt,
                        borderColor: theme.border,
                        opacity: isEnabled ? 1 : 0.6,
                      },
                    ]}
                  >
                    {/* Toggle show/hide checkmark */}
                    <TouchableOpacity
                      onPress={() => handleToggleSection(sec.id)}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: isEnabled ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Ionicons name={isEnabled ? 'checkmark' : 'eye-off-outline'} size={14} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.sectionInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name={getIcon()} size={16} color={theme.primaryLight} />
                        <Text style={[styles.sectionRowName, { color: theme.text }]}>
                          {sec.label}
                        </Text>
                      </View>
                      <Text style={[styles.sectionRowStatus, { color: theme.textMuted }]}>
                        {isEnabled ? 'Visible on Home' : 'Hidden'}
                      </Text>
                    </View>

                    {/* Move Up / Move Down buttons */}
                    <View style={styles.reorderBtns}>
                      <TouchableOpacity
                        onPress={() => handleMoveSection(idx, 'up')}
                        disabled={isFirst}
                        style={[
                          styles.reorderBtn,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            opacity: isFirst ? 0.3 : 1,
                          },
                        ]}
                      >
                        <Ionicons name="arrow-up" size={15} color={theme.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleMoveSection(idx, 'down')}
                        disabled={isLast}
                        style={[
                          styles.reorderBtn,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            opacity: isLast ? 0.3 : 1,
                          },
                        ]}
                      >
                        <Ionicons name="arrow-down" size={15} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Bottom Actions: Reset & Save */}
            <View style={[styles.customizeFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                onPress={handleResetSections}
                style={[styles.resetBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="refresh-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.resetBtnText, { color: theme.textMuted }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveSections}
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: 12,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
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
  searchDrawer: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
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
    gap: 8,
    marginVertical: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    gap: 4,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
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
    textAlign: 'center',
  },
  // Recurring Section Styles on Home Tab
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addRecHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  emptyRecBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  emptyRecTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyRecSub: {
    fontSize: 11,
    marginTop: 2,
  },
  recScroll: {
    gap: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  recCard: {
    width: 155,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  recCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recFreqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recFreqText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  recCatName: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  recBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recAmount: {
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  recDueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  recDueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  clearFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  recPayNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  recPayNowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: 16,
  },
  menuSheet: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#33415550',
  },
  menuHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  customizeOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  customizeCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '80%',
  },
  customizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customizeTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  customizeSub: {
    fontSize: 12,
    marginTop: 2,
  },
  customizeList: {
    marginBottom: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionRowName: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionRowStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  reorderBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  reorderBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
});