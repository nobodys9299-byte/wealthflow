import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { FinanceProvider, useFinance } from './src/context/FinanceContext';
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
import { SmartInboxModal } from './src/components/modals/SmartInboxModal';
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

  const [smartInboxVisible, setSmartInboxVisible] = useState(false);

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
        return (
          <DashboardScreen
            onOpenAddTransaction={openAddTransaction}
            onOpenTransfer={() => setTransferModalVisible(true)}
            onOpenAddAccount={openAddAccount}
            onOpenSmartInbox={() => setSmartInboxVisible(true)}
            onOpenSettings={() => setActiveTab('settings')}
            onEditTransaction={openEditTransaction}
            onNavigateTab={setActiveTab}
          />
        );
      case 'transactions':
        return (
          <TransactionsScreen
            onEditTransaction={openEditTransaction}
            onOpenAddTransaction={openAddTransaction}
          />
        );
      case 'analytics':
        return <AnalyticsScreen />;
      case 'budgets':
        return (
          <BudgetsScreen
            onOpenAddBudget={openAddBudget}
            onEditBudget={openEditBudget}
            onOpenAddRecurring={openAddRecurring}
            onEditRecurring={openEditRecurring}
          />
        );
      case 'accounts':
        return (
          <AccountsScreen
            onOpenAddAccount={openAddAccount}
            onEditAccount={openEditAccount}
            onOpenTransfer={() => setTransferModalVisible(true)}
            onNavigateTab={setActiveTab}
          />
        );
      case 'lending':
        return <LendingScreen />;
      case 'settings':
        return (
          <SettingsScreen
            onLockApp={() => setIsAppUnlocked(false)}
            onOpenSmartInbox={() => setSmartInboxVisible(true)}
            onNavigateTab={setActiveTab}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'transactions', label: 'Activity', icon: 'receipt-outline', activeIcon: 'receipt' },
    { id: 'lending', label: 'Friends', icon: 'swap-horizontal-outline', activeIcon: 'swap-horizontal' },
    { id: 'budgets', label: 'Budgets', icon: 'shield-outline', activeIcon: 'shield' },
    { id: 'accounts', label: 'Wallets', icon: 'wallet-outline', activeIcon: 'wallet' },
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

      {/* SMS & Bank Smart Inbox Modal */}
      <SmartInboxModal
        visible={smartInboxVisible}
        onClose={() => setSmartInboxVisible(false)}
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
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
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
});
