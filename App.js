import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  BackHandler,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { FinanceProvider, useFinance } from './src/context/FinanceContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { LendingScreen } from './src/screens/LendingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TransactionModal } from './src/components/modals/TransactionModal';
import { TransferModal } from './src/components/modals/TransferModal';
import { BudgetModal } from './src/components/modals/BudgetModal';
import { RecurringModal } from './src/components/modals/RecurringModal';
import { AccountModal } from './src/components/modals/AccountModal';
import { ConfirmDeleteModal } from './src/components/modals/ConfirmDeleteModal';
import { LockScreen } from './src/components/security/LockScreen';

function MainApp() {
  const {
    theme,
    securitySettings,
    isAppUnlocked,
    setIsAppUnlocked,
    confirmDialog,
    closeConfirmDialog,
  } = useFinance();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modals state
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const [transferModalVisible, setTransferModalVisible] = useState(false);

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);

  // Handle Android Back Button so user returns to Home tab instead of closing app
  useEffect(() => {
    const handleHardwareBack = () => {
      // 1. Close open modals first
      if (txModalVisible) {
        setTxModalVisible(false);
        return true;
      }
      if (transferModalVisible) {
        setTransferModalVisible(false);
        return true;
      }
      if (budgetModalVisible) {
        setBudgetModalVisible(false);
        return true;
      }
      if (accountModalVisible) {
        setAccountModalVisible(false);
        return true;
      }
      if (recurringModalVisible) {
        setRecurringModalVisible(false);
        return true;
      }
      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }
      // 2. If on secondary tab, return to dashboard
      if (activeTab !== 'dashboard' && activeTab !== 'home') {
        setActiveTab('dashboard');
        return true;
      }
      return false; // let Android minimize/exit if already on home
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => backSub.remove();
  }, [
    txModalVisible,
    transferModalVisible,
    budgetModalVisible,
    accountModalVisible,
    recurringModalVisible,
    drawerOpen,
    activeTab,
  ]);

  // If security is enabled and app is locked, present LockScreen
  if (securitySettings.enabled && !isAppUnlocked) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <LockScreen
          correctPin={securitySettings.pin || '1234'}
          onUnlock={() => setIsAppUnlocked(true)}
        />
      </SafeAreaView>
    );
  }

  const openAddTransaction = (initialType = 'expense') => {
    setEditingTx({ type: initialType });
    setTxModalVisible(true);
  };

  const openEditTransaction = (tx) => {
    setEditingTx(tx);
    setTxModalVisible(true);
  };

  const openAddBudget = () => {
    setEditingBudget(null);
    setBudgetModalVisible(true);
  };

  const openEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetModalVisible(true);
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountModalVisible(true);
  };

  const openEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccountModalVisible(true);
  };

  const openAddRecurring = () => {
    setEditingRecurring(null);
    setRecurringModalVisible(true);
  };

  const openEditRecurring = (rec) => {
    setEditingRecurring(rec);
    setRecurringModalVisible(true);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'home':
        return (
          <DashboardScreen
            onOpenAddTransaction={openAddTransaction}
            onOpenTransfer={() => setTransferModalVisible(true)}
            onOpenAddAccount={openAddAccount}
            onOpenAddRecurring={openAddRecurring}
            onOpenSettings={() => setDrawerOpen(true)}
            onEditTransaction={openEditTransaction}
            onNavigateTab={setActiveTab}
          />
        );
      case 'transactions':
        return (
          <TransactionsScreen
            onEditTransaction={openEditTransaction}
            onOpenAddTransaction={openAddTransaction}
            onNavigateTab={setActiveTab}
            onBack={() => setActiveTab('dashboard')}
            onOpenMore={() => setDrawerOpen(true)}
          />
        );
      case 'analytics':
        return (
          <AnalyticsScreen
            onEditTransaction={openEditTransaction}
            onOpenAddTransaction={openAddTransaction}
            onNavigateTab={setActiveTab}
            onBack={() => setActiveTab('dashboard')}
            onOpenMore={() => setDrawerOpen(true)}
          />
        );
      case 'budgets':
        return (
          <BudgetsScreen
            onOpenAddBudget={openAddBudget}
            onEditBudget={openEditBudget}
            onOpenAddRecurring={openAddRecurring}
            onEditRecurring={openEditRecurring}
            onNavigateTab={setActiveTab}
            onBack={() => setActiveTab('dashboard')}
            onOpenMore={() => setDrawerOpen(true)}
          />
        );
      case 'accounts':
        return (
          <AccountsScreen
            onOpenAddAccount={openAddAccount}
            onEditAccount={openEditAccount}
            onOpenTransfer={() => setTransferModalVisible(true)}
            onNavigateTab={setActiveTab}
            onBack={() => setActiveTab('dashboard')}
            onOpenMore={() => setDrawerOpen(true)}
          />
        );
      case 'lending':
        return (
          <LendingScreen
            onNavigateTab={setActiveTab}
            onBack={() => setActiveTab('dashboard')}
            onOpenMore={() => setDrawerOpen(true)}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onLockApp={() => setIsAppUnlocked(false)}
            onNavigateTab={setActiveTab}
            onBack={() => setActiveTab('dashboard')}
            onOpenMore={() => setDrawerOpen(true)}
          />
        );
      default:
        return (
          <DashboardScreen
            onOpenAddTransaction={openAddTransaction}
            onOpenTransfer={() => setTransferModalVisible(true)}
            onOpenAddAccount={openAddAccount}
            onOpenAddRecurring={openAddRecurring}
            onOpenSettings={() => setDrawerOpen(true)}
            onEditTransaction={openEditTransaction}
            onNavigateTab={setActiveTab}
          />
        );
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'analytics', label: 'Analysis', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
    { id: 'lending', label: 'Friends', icon: 'swap-horizontal-outline', activeIcon: 'swap-horizontal' },
    { id: 'budgets', label: 'Budgets', icon: 'shield-outline', activeIcon: 'shield' },
    { id: 'accounts', label: 'Account', icon: 'wallet-outline', activeIcon: 'wallet' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Screen Body */}
      <View style={styles.screenWrapper}>{renderActiveScreen()}</View>

      {/* Modern Floating Bottom Navigation Bar */}
      <View style={[styles.bottomBarContainer, { backgroundColor: theme.bg }]}>
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setActiveTab(item.id)}
                style={styles.navItem}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={20}
                  color={isActive ? theme.primaryLight : theme.textMuted}
                />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: isActive ? theme.primaryLight : theme.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {isActive && (
                  <View style={[styles.activeDot, { backgroundColor: theme.primaryLight }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Confirmation Before Deletion Modal */}
      <ConfirmDeleteModal
        visible={confirmDialog.visible}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      {/* Transaction Modal */}
      <TransactionModal
        visible={txModalVisible}
        onClose={() => {
          setTxModalVisible(false);
          setEditingTx(null);
        }}
        initialData={editingTx}
      />

      {/* Transfer Modal */}
      <TransferModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
      />

      {/* Budget Modal */}
      <BudgetModal
        visible={budgetModalVisible}
        onClose={() => {
          setBudgetModalVisible(false);
          setEditingBudget(null);
        }}
        initialData={editingBudget}
      />

      {/* Account Modal */}
      <AccountModal
        visible={accountModalVisible}
        onClose={() => {
          setAccountModalVisible(false);
          setEditingAccount(null);
        }}
        initialData={editingAccount}
      />

      {/* Recurring Bills Modal */}
      <RecurringModal
        visible={recurringModalVisible}
        onClose={() => {
          setRecurringModalVisible(false);
          setEditingRecurring(null);
        }}
        initialData={editingRecurring}
      />

      {/* Slide-out Navigation Drawer from Top-Left 3-Bar Menu */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />

          <View style={[styles.drawerContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Drawer Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
              <View style={[styles.drawerBrandIcon, { backgroundColor: `${theme.primary}25` }]}>
                <Ionicons name="wallet" size={24} color={theme.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerBrandTitle, { color: theme.text }]}>WealthFlow</Text>
                <Text style={[styles.drawerBrandSub, { color: theme.textMuted }]}>Smart Finance Tracker</Text>
              </View>
              <TouchableOpacity onPress={() => setDrawerOpen(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Navigation Items */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setActiveTab('dashboard');
                  setDrawerOpen(false);
                }}
                style={[styles.drawerItem, activeTab === 'dashboard' && { backgroundColor: `${theme.primary}18` }]}
              >
                <Ionicons name="home-outline" size={20} color={activeTab === 'dashboard' ? theme.primaryLight : theme.text} />
                <Text style={[styles.drawerItemText, { color: activeTab === 'dashboard' ? theme.primaryLight : theme.text }]}>
                  Home Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab('analytics');
                  setDrawerOpen(false);
                }}
                style={[styles.drawerItem, activeTab === 'analytics' && { backgroundColor: `${theme.primary}18` }]}
              >
                <Ionicons name="stats-chart-outline" size={20} color={activeTab === 'analytics' ? theme.primaryLight : theme.text} />
                <Text style={[styles.drawerItemText, { color: activeTab === 'analytics' ? theme.primaryLight : theme.text }]}>
                  Analysis & Breakdown
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab('lending');
                  setDrawerOpen(false);
                }}
                style={[styles.drawerItem, activeTab === 'lending' && { backgroundColor: `${theme.primary}18` }]}
              >
                <Ionicons name="swap-horizontal-outline" size={20} color={activeTab === 'lending' ? theme.primaryLight : theme.text} />
                <Text style={[styles.drawerItemText, { color: activeTab === 'lending' ? theme.primaryLight : theme.text }]}>
                  Friends & Loans
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab('budgets');
                  setDrawerOpen(false);
                }}
                style={[styles.drawerItem, activeTab === 'budgets' && { backgroundColor: `${theme.primary}18` }]}
              >
                <Ionicons name="shield-outline" size={20} color={activeTab === 'budgets' ? theme.primaryLight : theme.text} />
                <Text style={[styles.drawerItemText, { color: activeTab === 'budgets' ? theme.primaryLight : theme.text }]}>
                  Budgets & Goals
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab('accounts');
                  setDrawerOpen(false);
                }}
                style={[styles.drawerItem, activeTab === 'accounts' && { backgroundColor: `${theme.primary}18` }]}
              >
                <Ionicons name="wallet-outline" size={20} color={activeTab === 'accounts' ? theme.primaryLight : theme.text} />
                <Text style={[styles.drawerItemText, { color: activeTab === 'accounts' ? theme.primaryLight : theme.text }]}>
                  Wallets & Accounts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDrawerOpen(false);
                  openAddRecurring();
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="repeat-outline" size={20} color="#8B5CF6" />
                <Text style={[styles.drawerItemText, { color: theme.text }]}>
                  Recurring Bills & Pay
                </Text>
              </TouchableOpacity>

              <View style={[styles.drawerDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity
                onPress={() => {
                  setActiveTab('settings');
                  setDrawerOpen(false);
                }}
                style={[styles.drawerItem, activeTab === 'settings' && { backgroundColor: `${theme.primary}18` }]}
              >
                <Ionicons name="settings-outline" size={20} color={activeTab === 'settings' ? theme.primaryLight : theme.text} />
                <Text style={[styles.drawerItemText, { color: activeTab === 'settings' ? theme.primaryLight : theme.text }]}>
                  Settings & Security
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDrawerOpen(false);
                  setIsAppUnlocked(false);
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="lock-closed-outline" size={20} color={theme.danger} />
                <Text style={[styles.drawerItemText, { color: theme.danger }]}>
                  Lock App Now
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Drawer Footer */}
            <View style={[styles.drawerFooter, { borderTopColor: theme.border }]}>
              <Text style={[styles.drawerFooterText, { color: theme.textMuted }]}>
                WealthFlow v2.2.0 • Offline Ready
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <MainApp />
      </FinanceProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 20 : 0,
  },
  screenWrapper: {
    flex: 1,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  // Slide-out Drawer Styles
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
  },
  drawerContent: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 8 : 44,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  drawerBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  drawerBrandSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 12,
    gap: 14,
    marginBottom: 2,
  },
  drawerItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  drawerDivider: {
    height: 1,
    marginHorizontal: 18,
    marginVertical: 8,
  },
  drawerFooter: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  drawerFooterText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
