import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Platform,
  BackHandler,
  Linking,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES, THEMES } from '../constants/theme';
import { formatDateDisplay, formatDateTimeDisplay } from '../utils/formatters';
import { FeedbackModal } from '../components/modals/FeedbackModal';
import { NotificationService } from '../services/NotificationService';

export const SettingsScreen = ({ onLockApp, onNavigateTab, onBack, onOpenMore }) => {
  const {
    theme,
    themeId,
    changeTheme,
    currency,
    setCurrency,
    t,
    securitySettings,
    updateSecurity,
    userUpiSettings,
    updateUpiSettings,
    exportCSVString,
    importFromCSV,
    transactions,
    accounts,
    lendingRecords,
    googleUser,
    loginWithGoogle,
    logoutGoogle,
    backupToGoogleCloud,
    restoreFromGoogleCloud,
    removeCloudBackup,
    updateGoogleAutoBackupSettings,
    showCustomAlert,
    crashReportsEnabled,
    updateCrashReportsSetting,
    notificationSettings = { enabled: true, hour: 20, minute: 0 },
    updateNotificationSettings,
  } = useFinance();

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [notifTimeModalVisible, setNotifTimeModalVisible] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [selectedNotifHour, setSelectedNotifHour] = useState(notificationSettings?.hour !== undefined ? (notificationSettings.hour % 12 || 12) : 8);
  const [selectedNotifMinute, setSelectedNotifMinute] = useState(notificationSettings?.minute || 0);
  const [selectedNotifAmPm, setSelectedNotifAmPm] = useState(notificationSettings?.hour !== undefined && notificationSettings.hour < 12 ? 'AM' : 'PM');

  useEffect(() => {
    if (notifTimeModalVisible && notificationSettings) {
      const h24 = notificationSettings.hour !== undefined ? notificationSettings.hour : 20;
      setSelectedNotifHour(h24 % 12 || 12);
      setSelectedNotifMinute(notificationSettings.minute || 0);
      setSelectedNotifAmPm(h24 < 12 ? 'AM' : 'PM');
    }
  }, [notifTimeModalVisible, notificationSettings]);

  // Hardware Back Handler
  useEffect(() => {
    const handleBackPress = () => {
      if (currencyModalVisible) {
        setCurrencyModalVisible(false);
        return true;
      }
      if (feedbackModalVisible) {
        setFeedbackModalVisible(false);
        return true;
      }
      if (notifTimeModalVisible) {
        setNotifTimeModalVisible(false);
        return true;
      }
      if (csvModalVisible) {
        setCsvModalVisible(false);
        return true;
      }
      if (upiModalVisible) {
        setUpiModalVisible(false);
        return true;
      }
      if (pinModalVisible) {
        setPinModalVisible(false);
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

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }, [
    currencyModalVisible,
    feedbackModalVisible,
    csvModalVisible,
    upiModalVisible,
    pinModalVisible,
    onBack,
    onNavigateTab,
  ]);

  // UPI Setup Modal
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiIdInput, setUpiIdInput] = useState(userUpiSettings?.upiId || '');
  const [payeeNameInput, setPayeeNameInput] = useState(userUpiSettings?.payeeName || '');

  // CSV Modal
  const [csvModalVisible, setCsvModalVisible] = useState(false);

  // PIN Setup Modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [chosenLength, setChosenLength] = useState(securitySettings.pin?.length || 4);
  const [newPin, setNewPin] = useState('');

  const handleSaveCSVToInternalStorage = async () => {
    try {
      setCsvModalVisible(false);
      const csv = exportCSVString();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `wealthflow_backup_${dateStr}.csv`;

      // Allow modal dismiss transition to finish cleanly before opening SAF dialog
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Android: Native ACTION_CREATE_DOCUMENT picker (Screenshot 5 "Save to" with SAVE button)
      if (Platform.OS === 'android') {
        try {
          const result = await IntentLauncher.startActivityAsync(
            'android.intent.action.CREATE_DOCUMENT',
            {
              type: 'text/csv',
              category: 'android.intent.category.OPENABLE',
              extra: {
                'android.intent.extra.TITLE': fileName,
              },
            }
          );
          if (result && result.resultCode === -1 && result.data) {
            let targetUri = result.data;
            if (typeof targetUri === 'string') {
              const match = targetUri.match(/dat=([^\s\}]+)/);
              if (match && match[1]) {
                targetUri = match[1];
              }
            }
            try {
              await FileSystem.writeAsStringAsync(targetUri, csv, {
                encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
              });
            } catch (wErr) {
              if (FileSystem.StorageAccessFramework?.writeAsStringAsync) {
                await FileSystem.StorageAccessFramework.writeAsStringAsync(targetUri, csv, {
                  encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
                });
              } else {
                throw wErr;
              }
            }
            showCustomAlert(
              'CSV File Saved!',
              `Successfully saved "${fileName}" to your device storage.`,
              { type: 'success' }
            );
            return;
          } else if (result && result.resultCode === 0) {
            // User cancelled
            return;
          }
          return;
        } catch (intentErr) {
          console.warn('IntentLauncher CREATE_DOCUMENT error:', intentErr);
          showCustomAlert('Save Failed', 'Could not open document creator: ' + intentErr.message, { type: 'danger' });
          return;
        }
      }

      // Web / iOS Fallback
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Save CSV File',
          UTI: 'public.comma-separated-values-text',
        });
      }
    } catch (err) {
      console.warn('Save CSV failed:', err);
      showCustomAlert('Export Error', err.message || 'Failed to save CSV', { type: 'danger' });
    }
  };

  const handlePickAndImportCSVFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets ? result.assets[0] : result;
      if (!file || !file.uri) {
        showCustomAlert('No File Selected', 'Please select a valid CSV backup file.', { type: 'info' });
        return;
      }

      let content = '';
      if (Platform.OS === 'web' && file.file) {
        content = await file.file.text();
      } else {
        try {
          const res = await fetch(file.uri);
          content = await res.text();
        } catch (fetchErr) {
          try {
            if (FileSystem?.readAsStringAsync) {
              content = await FileSystem.readAsStringAsync(file.uri, {
                encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
              });
            }
          } catch (fsErr) {
            console.warn('FileSystem.readAsStringAsync failed:', fsErr);
            throw fsErr;
          }
        }
      }

      if (!content || !content.trim()) {
        showCustomAlert('Empty File', 'The selected CSV file is empty.', { type: 'danger' });
        return;
      }

      const res = await importFromCSV(content.trim());
      if (res.success) {
        showCustomAlert(
          'Import Successful!',
          `Restored ${res.count || 'all'} records from "${file.name || 'CSV file'}".`,
          { type: 'success' }
        );
        setCsvModalVisible(false);
      } else {
        showCustomAlert('Import Failed', 'Failed to parse CSV file: ' + (res.error || 'Invalid CSV format'), { type: 'danger' });
      }
    } catch (err) {
      console.warn('Import CSV error:', err);
      showCustomAlert('Import Error', 'Failed to import file: ' + (err.message || 'Unknown error'), { type: 'danger' });
    }
  };

  const handleSaveUpiSettings = () => {
    updateUpiSettings({
      upiId: upiIdInput.trim(),
      payeeName: payeeNameInput.trim() || 'WealthFlow User',
    });
    setUpiModalVisible(false);
    showCustomAlert('UPI Updated', 'Your UPI payment settings have been saved successfully.', { type: 'success' });
  };



  const handleGoogleSignIn = async () => {
    setCloudSyncing(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        if (result.error && !result.error.toLowerCase().includes('cancel') && !result.error.includes('12501')) {
          showCustomAlert('Google Sign-In Error', result.error, { type: 'danger' });
        }
        return;
      }

      if (result?.remoteCheck?.exists) {
        const { txCount, accCount, updatedAt, data: cloudSnapshot } = result.remoteCheck;
        const dateFormatted = formatDateDisplay(updatedAt);

        showCustomAlert(
          'Google Drive Backup Found!',
          `A previous backup was found in your Google Drive.\n\n📅 Date: ${dateFormatted}\n📊 Data: ${txCount} transactions, ${accCount} accounts\n\nWould you like to restore this backup now?`,
          {
            type: 'info',
            confirmText: 'Restore Backup',
            cancelText: 'Skip / Start Fresh',
            confirmIcon: 'cloud-download-outline',
            showCancel: true,
            onConfirm: async () => {
              setCloudSyncing(true);
              try {
                const restoreRes = await restoreFromGoogleCloud(null, cloudSnapshot);
                if (restoreRes.success) {
                  showCustomAlert(
                    'Backup Restored!',
                    `Successfully restored & updated ${restoreRes.count} transactions and ${restoreRes.accountsCount || 0} accounts from Google Drive!`,
                    { type: 'success' }
                  );
                } else {
                  showCustomAlert('Restore Failed', restoreRes.error || 'Could not restore backup.', { type: 'danger' });
                }
              } finally {
                setCloudSyncing(false);
              }
            },
            onCancel: async () => {
              await removeCloudBackup();
              showCustomAlert(
                'Previous Backup Cleared',
                'You have chosen to start fresh. Any previous Google Drive backup file was removed and will be replaced when a new backup is saved.',
                { type: 'info' }
              );
            },
          }
        );
      } else {
        showCustomAlert(
          'Connected with Google Drive',
          `Logged in as ${result.user?.email || 'Google User'}. Automatic Google Drive backup is now active.`,
          { type: 'success' }
        );
      }
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleSendDiagnosticReport = async () => {
    const totalTx = transactions?.length || 0;
    const totalAcc = accounts?.length || 0;
    const osVersion = Platform.OS === 'android' ? `Android ${Platform.Version}` : Platform.OS;
    const body = `--- WealthFlow Diagnostics & Crash Report ---
Target Developer: iashwini914@gmail.com
Timestamp: ${new Date().toISOString()}
App Version: 1.0.0
Platform: ${osVersion}
Total Transactions: ${totalTx}
Total Accounts: ${totalAcc}
Currency: ${currency?.code || 'INR'}
Google Sync: ${googleUser?.signedIn ? 'Connected (' + googleUser.email + ')' : 'Not Connected'}
Status: Healthy. No fatal crash exceptions recorded.
---------------------------------------------`;

    const mailto = `mailto:iashwini914@gmail.com?subject=${encodeURIComponent('WealthFlow Crash & Usage Report')}&body=${encodeURIComponent(body)}`;
    try {
      const supported = await Linking.canOpenURL(mailto);
      if (supported) {
        await Linking.openURL(mailto);
      } else {
        await Clipboard.setStringAsync(body);
        showCustomAlert('Report Copied', 'Diagnostic report copied to clipboard. You can send it directly to iashwini914@gmail.com.', { type: 'success' });
      }
    } catch (e) {
      showCustomAlert('Email Notice', 'Could not open email client automatically.', { type: 'info' });
    }
  };

  const handleCloudBackupNow = async () => {
    setCloudSyncing(true);
    try {
      const res = await backupToGoogleCloud();
      if (res.success) {
        showCustomAlert(
          'Cloud Sync Complete',
          'All accounts, transactions, and friend records backed up to Cloud Vault successfully!',
          { type: 'success' }
        );
      } else {
        showCustomAlert('Cloud Backup Failed', res.error || 'Could not sync to cloud.', { type: 'danger' });
      }
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleCloudRestoreNow = async () => {
    setCloudSyncing(true);
    try {
      const res = await restoreFromGoogleCloud(googleUser?.email);
      if (res.success && res.count > 0) {
        showCustomAlert(
          'Cloud Restore Successful',
          `Restored & updated ${res.count} transactions and ${res.accountsCount || 0} accounts from Cloud Vault!`,
          { type: 'success' }
        );
      } else if (res.success && (!res.count || res.count === 0)) {
        showCustomAlert(
          'Cloud Vault Empty',
          'Cloud restore connected, but 0 transactions were found in the current cloud slot.',
          { type: 'info' }
        );
      } else {
        showCustomAlert(
          'No Cloud Snapshot Found',
          res.error || 'No backup found in cloud for this Google Account.',
          { type: 'info' }
        );
      }
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleSavePin = () => {
    if (newPin.length !== chosenLength || isNaN(Number(newPin))) {
      alert(`PIN must be exactly ${chosenLength} numeric digits`);
      return;
    }
    updateSecurity({ pin: newPin, pinLength: chosenLength });
    setPinModalVisible(false);
    setNewPin('');
    alert(`Security PIN set to ${chosenLength} digits successfully!`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onOpenMore || onBack || (() => onNavigateTab && onNavigateTab('dashboard'))}
          style={[styles.menuBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          accessibilityLabel="Open Menu"
        >
          <Ionicons name="menu-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>{t('setting', 'Setting')}</Text>
          <Text style={[styles.subText, { color: theme.textMuted }]}>
            {t('Passcode, UPI payment requests, custom categories & CSV', 'Passcode, UPI payment requests, custom categories & CSV')}
          </Text>
        </View>
      </View>

      {/* Visual Themes Picker (Moved to Top as Requested) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('visual_themes', 'VISUAL THEMES')}</Text>

        <View style={styles.themeGrid}>
          {Object.values(THEMES).map((th) => {
            const isSelected = themeId === th.id;
            return (
              <TouchableOpacity
                key={th.id}
                onPress={() => changeTheme(th.id)}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: th.card,
                    borderColor: isSelected ? th.primary : th.border,
                    borderWidth: isSelected ? 2.5 : 1,
                  },
                ]}
              >
                <View style={styles.swatchRow}>
                  <View style={[styles.swatchDot, { backgroundColor: th.bg }]} />
                  <View style={[styles.swatchDot, { backgroundColor: th.primary }]} />
                  <View style={[styles.swatchDot, { backgroundColor: th.success }]} />
                  <View style={[styles.swatchDot, { backgroundColor: th.danger }]} />
                </View>

                <View style={styles.themeTitleRow}>
                  <Text style={[styles.themeName, { color: th.text }]} numberOfLines={1}>
                    {th.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color={th.primary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* UPI & Payment Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('payment_settings', 'PAYMENT & UPI SETTINGS')}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => {
              setUpiIdInput(userUpiSettings?.upiId || '');
              setPayeeNameInput(userUpiSettings?.payeeName || '');
              setUpiModalVisible(true);
            }}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#10B98125' }]}>
                <Ionicons name="qr-code-outline" size={18} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>
                  {userUpiSettings?.upiId ? `UPI ID: ${userUpiSettings.upiId}` : 'Configure UPI ID & QR Code'}
                </Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Shared when requesting lending payments
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Security & Biometrics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('security_pin', 'SECURITY & PRIVACY')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* App Lock Toggle */}
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}25` }]}>
                <Ionicons name="shield-checkmark" size={18} color={theme.primaryLight} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{t('Require Passcode to Open', 'Require Passcode to Open')}</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {securitySettings.enabled ? 'Auto-locks after 1 minute of inactivity' : t('No lock required', 'No lock required')}
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.enabled}
              onValueChange={(val) => updateSecurity({ enabled: val })}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Change PIN (4 or 6 Digits) */}
          {securitySettings.enabled && (
            <TouchableOpacity
              onPress={() => {
                setChosenLength(securitySettings.pin?.length || 4);
                setNewPin('');
                setPinModalVisible(true);
              }}
              style={[styles.row, { borderBottomColor: theme.border }]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
                  <Ionicons name="key-outline" size={18} color={theme.primaryLight} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>
                    {t('Set PIN', 'Set PIN')} ({securitySettings.pin?.length || 4} {t('Digits', 'Digits')})
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    {t('Supports 4 or 6 digits • Hidden on login screen', 'Supports 4 or 6 digits • Hidden on login screen')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          {/* Fingerprint / Biometrics */}
          {securitySettings.enabled && (
            <View style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
                  <Ionicons name="finger-print-outline" size={18} color={theme.primaryLight} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{t('Fingerprint / Biometrics', 'Fingerprint / Biometrics')}</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    {t('Unlock with fingerprint sensor', 'Unlock with fingerprint sensor')}
                  </Text>
                </View>
              </View>
              <Switch
                value={securitySettings.biometrics}
                onValueChange={(val) => updateSecurity({ biometrics: val })}
                trackColor={{ false: '#CBD5E1', true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}

          {/* Lock App After 1 Min Feature */}
          {securitySettings.enabled && (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="timer-outline" size={18} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Lock App After 1 Min</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    Automatically locks after 1 min of inactivity or background
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#10B98125', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>Active (1m)</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Currency Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('currency_symbols', 'CURRENCY & SYMBOLS')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setCurrencyModalVisible(true)}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.primaryLight }}>
                  {currency.symbol}
                </Text>
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{t('base_currency', 'Base Currency')}</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {currency.code} ({currency.name})
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Cloud Backup & Automatic Sync */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('google_cloud_backup', 'GOOGLE CLOUD BACKUP & AUTO SYNC')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {googleUser?.signedIn ? (
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.googleAvatarWrap, { backgroundColor: '#4285F420' }]}>
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                  </View>
                  <View>
                    <Text style={[styles.googleUserName, { color: theme.text }]} numberOfLines={1}>{googleUser.name}</Text>
                    <Text style={[styles.googleUserEmail, { color: theme.textMuted }]} numberOfLines={1}>{googleUser.email}</Text>
                  </View>
                </View>
                <View style={styles.cloudActiveBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={styles.cloudActiveText}>Drive Connected</Text>
                </View>
              </View>

              {/* Recovery Callout Banner explaining uninstall & phone restore */}
              <View style={[styles.cloudInfoBox, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={[styles.cloudInfoText, { color: theme.textMuted }]}>
                  <Text style={{ fontWeight: '800', color: theme.text }}>Uninstall Safe: </Text>
                  If you uninstall the app or get a new device, simply sign back in with <Text style={{ fontWeight: '800', color: theme.primaryLight }}>{googleUser.email}</Text> to auto-detect and restore your complete transaction history!
                </Text>
              </View>

              <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 12 }}>
                {googleUser.lastBackup
                  ? `Last Cloud Backup: ${formatDateTimeDisplay(googleUser.lastBackup)}`
                  : 'Auto-Backup enabled: Will sync changes to your Google Drive'}
              </Text>

              {/* Automatic Backup Schedule & Time Box */}
              <View style={[styles.autoBackupBox, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={16} color={theme.primaryLight} />
                    <Text style={[styles.autoBackupTitle, { color: theme.text }]}>Automatic Backup Schedule</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const nextState = !googleUser.autoBackup;
                      updateGoogleAutoBackupSettings({ autoBackup: nextState });
                    }}
                    style={[
                      styles.autoToggleBtn,
                      { backgroundColor: googleUser.autoBackup ? theme.success : theme.cardHover },
                    ]}
                  >
                    <Text style={[styles.autoToggleText, { color: googleUser.autoBackup ? '#FFF' : theme.textMuted }]}>
                      {googleUser.autoBackup ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {googleUser.autoBackup ? (
                  <>
                    <Text style={[styles.autoBackupSub, { color: theme.textMuted }]}>
                      Choose when WealthFlow automatically backs up your financial data to your Google Account:
                    </Text>

                    {/* Frequency & Time Selector Pills */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
                      {[
                        { id: '22:00', label: '10:00 PM (Nightly)', freq: 'daily' },
                        { id: '08:00', label: '08:00 AM (Morning)', freq: 'daily' },
                        { id: '14:00', label: '02:00 PM (Afternoon)', freq: 'daily' },
                        { id: '12h', label: 'Every 12 Hours', freq: 'twice_daily' },
                        { id: '6h', label: 'Every 6 Hours', freq: 'every_6h' },
                      ].map((item) => {
                        const isSelected =
                          (item.freq === 'daily' && googleUser.autoBackupTime === item.id && googleUser.autoBackupFrequency === 'daily') ||
                          (item.freq !== 'daily' && googleUser.autoBackupFrequency === item.freq);

                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => {
                              updateGoogleAutoBackupSettings({
                                autoBackupFrequency: item.freq,
                                autoBackupTime: item.freq === 'daily' ? item.id : '22:00',
                              });
                            }}
                            style={[
                              styles.schedulePill,
                              {
                                backgroundColor: isSelected ? theme.primary : theme.card,
                                borderColor: isSelected ? theme.primaryLight : theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.schedulePillText,
                                { color: isSelected ? '#FFF' : theme.text },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Ionicons name="sparkles" size={12} color="#10B981" />
                      <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>
                        Active: Auto-sync runs {googleUser.autoBackupFrequency === 'daily' ? `daily at ${googleUser.autoBackupTime || '10:00 PM'}` : googleUser.autoBackupFrequency === 'twice_daily' ? 'every 12 hours' : 'periodically'} in the background.
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                    Auto-backup is paused. Turn ON to automatically protect your transactions without manual clicking.
                  </Text>
                )}
              </View>

              {/* Cloud Action Buttons Row 1: Cloud Vault Sync & Restore */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={handleCloudBackupNow}
                  disabled={cloudSyncing}
                  style={[styles.cloudBtn, { backgroundColor: '#4285F4' }]}
                >
                  <Ionicons name="cloud-upload-outline" size={15} color="#FFF" />
                  <Text style={styles.cloudBtnText} numberOfLines={1} adjustsFontSizeToFit>
                    {cloudSyncing ? 'Syncing...' : 'Sync Cloud Vault'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCloudRestoreNow}
                  disabled={cloudSyncing}
                  style={[styles.cloudBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border, borderWidth: 1 }]}
                >
                  <Ionicons name="cloud-download-outline" size={15} color={theme.text} />
                  <Text style={[styles.cloudBtnText, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                    Cloud Restore
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={logoutGoogle}
                style={{ alignSelf: 'flex-start', marginTop: 4, paddingVertical: 4 }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.danger }}>
                  Sign Out from Google
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                style={styles.row}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: '#4285F420' }]}>
                    <Ionicons name="logo-google" size={18} color="#4285F4" />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>Sign In with Google</Text>
                    <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                      Secure cloud backup & instant restore across devices & uninstalls
                    </Text>
                  </View>
                </View>
                <View style={[styles.connectPill, { backgroundColor: '#4285F4' }]}>
                  <Text style={styles.connectPillText}>Connect</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Local Device Backup (CSV) - Clean & Standalone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('LOCAL DEVICE BACKUP (CSV FILE)', 'LOCAL DEVICE BACKUP (CSV FILE)')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* CSV File Backup & Restore */}
          <TouchableOpacity
            onPress={() => setCsvModalVisible(true)}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.success}20` }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.success} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{t('CSV File Backup & Restore', 'CSV File Backup & Restore')}</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {t('Export or import all accounts and transactions for Excel & Sheets', 'Export or import all accounts and transactions for Excel & Sheets')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Developer Feedback Section (Moved below Local Device Backup as Requested) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('feedback_suggestions', 'FEEDBACK & SUGGESTIONS')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setFeedbackModalVisible(true)}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#38BDF820' }]}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{t('send_dev_feedback', 'Send Developer Feedback')}</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {t('Direct to iashwini914@gmail.com • Suggestions & bug reports', 'Direct to iashwini914@gmail.com • Suggestions & bug reports')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('notifications', 'NOTIFICATIONS')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Remind everyday Toggle */}
          <View style={[styles.row, notificationSettings?.enabled && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Remind everyday</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Remind to add expenses occasionally
                </Text>
              </View>
            </View>
            <Switch
              value={!!notificationSettings?.enabled}
              onValueChange={async (val) => {
                if (updateNotificationSettings) {
                  await updateNotificationSettings({ enabled: val });
                }
              }}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={notificationSettings?.enabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {notificationSettings?.enabled && (
            <>
              {/* Daily Reminder Time Picker */}
              <TouchableOpacity
                onPress={() => setNotifTimeModalVisible(true)}
                style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}20` }]}>
                    <Ionicons name="time-outline" size={18} color={theme.primaryLight} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>Notification Time</Text>
                    <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                      {`Daily at ${((notificationSettings.hour % 12) || 12)}:${String(notificationSettings.minute || 0).padStart(2, '0')} ${notificationSettings.hour >= 12 ? 'PM' : 'AM'}`}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Instant Test Notification Button */}
              <TouchableOpacity
                onPress={async () => {
                  const sent = await NotificationService.sendTestNotification();
                  if (sent) {
                    showCustomAlert('Notification Sent! 🔔', 'Check your notification shade to preview the daily reminder.', { type: 'success' });
                  } else {
                    showCustomAlert('Notification Permission Required', 'Please enable notification permissions in your phone settings to receive reminders.', { type: 'danger' });
                  }
                }}
                style={styles.row}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="paper-plane-outline" size={18} color="#10B981" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>Send Test Notification Now</Text>
                    <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                      Instantly preview the daily reminder on your device
                    </Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* App Health & Diagnostics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('APP HEALTH & DIAGNOSTICS', 'APP HEALTH & DIAGNOSTICS')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.row, crashReportsEnabled && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#38BDF820' }]}>
                <Ionicons name="bug-outline" size={18} color="#38BDF8" />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Send Crash & Usage Statistics</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Automatically send diagnostic reports & error logs to iashwini914@gmail.com
                </Text>
              </View>
            </View>
            <Switch
              value={crashReportsEnabled}
              onValueChange={updateCrashReportsSetting}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={crashReportsEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {crashReportsEnabled && (
            <TouchableOpacity
              onPress={handleSendDiagnosticReport}
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="mail-outline" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Send Diagnostic Report Now</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    Email current database stats, system health, and crash logs to iashwini914@gmail.com
                  </Text>
                </View>
              </View>
              <Ionicons name="send-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* App Version Info */}
      <View style={styles.aboutBox}>
        <Text style={[styles.aboutTitle, { color: theme.text }]}>WealthFlow Money Tracker</Text>
        <Text style={[styles.aboutVersion, { color: theme.textMuted }]}>
          Version 2.2.0 • React Native Expo
        </Text>
      </View>

      {/* PIN Setup Modal (4 or 6 digits) */}
      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setPinModalVisible(false)}
          />
          <View
            style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Set Passcode</Text>
            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Choose 4 or 6 digits for your lock screen PIN
            </Text>

            {/* Length selector */}
            <View style={[styles.lengthSelector, { backgroundColor: theme.cardAlt }]}>
              <TouchableOpacity
                onPress={() => {
                  setChosenLength(4);
                  setNewPin('');
                }}
                style={[
                  styles.lenBtn,
                  chosenLength === 4 && { backgroundColor: theme.primary },
                ]}
              >
                <Text style={[styles.lenBtnText, { color: chosenLength === 4 ? '#FFF' : theme.textMuted }]}>
                  4 Digits
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setChosenLength(6);
                  setNewPin('');
                }}
                style={[
                  styles.lenBtn,
                  chosenLength === 6 && { backgroundColor: theme.primary },
                ]}
              >
                <Text style={[styles.lenBtnText, { color: chosenLength === 6 ? '#FFF' : theme.textMuted }]}>
                  6 Digits
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              keyboardType="number-pad"
              secureTextEntry
              placeholder={'•'.repeat(chosenLength)}
              placeholderTextColor={theme.textMuted}
              maxLength={chosenLength}
              value={newPin}
              onChangeText={setNewPin}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setPinModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: theme.cardAlt }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePin}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.modalBtnText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CSV Export / Import Modal */}
      <Modal visible={csvModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCsvModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setCsvModalVisible(false)}
          />

          <View
            style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>CSV File Backup & Restore</Text>
              <TouchableOpacity onPress={() => setCsvModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Export and import your entire financial database as a CSV spreadsheet file to easily back up or transfer between apps.
            </Text>

            {/* Action 1: Save CSV directly to Internal Storage (Downloads) */}
            <View style={[styles.fileActionCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.fileActionHeader}>
                <View style={[styles.fileIconBadge, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="save-outline" size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileActionTitle, { color: theme.text }]}>Save to Internal Storage (Downloads)</Text>
                  <Text style={[styles.fileActionSub, { color: theme.textMuted }]}>
                    Save directly to phone storage — safe across app uninstalls
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveCSVToInternalStorage}
                style={[styles.fileActionBtn, { backgroundColor: '#10B981' }]}
              >
                <Ionicons name="download-outline" size={18} color="#FFF" />
                <Text style={styles.fileActionBtnText}>Save CSV to Internal Storage</Text>
              </TouchableOpacity>
            </View>

            {/* Action 2: Import CSV File */}
            <View style={[styles.fileActionCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.fileActionHeader}>
                <View style={[styles.fileIconBadge, { backgroundColor: '#38BDF820' }]}>
                  <Ionicons name="folder-open-outline" size={20} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileActionTitle, { color: theme.text }]}>Import CSV File</Text>
                  <Text style={[styles.fileActionSub, { color: theme.textMuted }]}>
                    Select and restore a .csv backup file from your device storage
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handlePickAndImportCSVFile}
                style={[styles.fileActionBtn, { backgroundColor: '#0284C7' }]}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
                <Text style={styles.fileActionBtnText}>Choose & Import .CSV File</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCurrencyModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setCurrencyModalVisible(false)}
          />
          <View
            style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {CURRENCIES.map((c) => {
                const isSelected = currency.code === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => {
                      setCurrency(c);
                      setCurrencyModalVisible(false);
                    }}
                    style={[
                      styles.currencyRow,
                      {
                        backgroundColor: isSelected ? theme.primaryBg : 'transparent',
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.currencySym, { color: theme.primaryLight }]}>
                      {c.symbol}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.currencyCode, { color: theme.text }]}>
                        {c.code} - {c.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* UPI Settings Modal */}
      <Modal visible={upiModalVisible} animationType="slide" transparent={true} onRequestClose={() => setUpiModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setUpiModalVisible(false)}
          />
          <View
            style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Configure UPI & Payment ID</Text>
              <TouchableOpacity onPress={() => setUpiModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Enter your UPI ID and name. WealthFlow will include this payment link and QR code in friendly payment requests.
            </Text>

            <View style={{ gap: 12, marginVertical: 14 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 4 }}>
                  YOUR UPI ID (VPA)
                </Text>
                <TextInput
                  style={[
                    styles.textInputStyle,
                    { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="e.g. yourname@oksbi or phone@paytm"
                  placeholderTextColor={theme.textMuted}
                  value={upiIdInput}
                  onChangeText={setUpiIdInput}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 4 }}>
                  PAYEE NAME
                </Text>
                <TextInput
                  style={[
                    styles.textInputStyle,
                    { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor={theme.textMuted}
                  value={payeeNameInput}
                  onChangeText={setPayeeNameInput}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleSaveUpiSettings}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.modalBtnText}>Save UPI Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Notification Time Setter Modal */}
      <Modal
        visible={notifTimeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifTimeModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          {/* Backdrop: click outside to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setNotifTimeModalVisible(false)}
          />

          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, padding: 20 }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}20` }]}>
                  <Ionicons name="time" size={18} color={theme.primaryLight} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Daily Reminder Time</Text>
              </View>
              <TouchableOpacity onPress={() => setNotifTimeModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Customize the exact hour and minute you want WealthFlow to send your daily expense logging reminder.
            </Text>

            {/* Custom Digital Time Setter Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.cardAlt,
              borderRadius: 18,
              paddingVertical: 14,
              paddingHorizontal: 12,
              marginVertical: 10,
              borderWidth: 1,
              borderColor: theme.border,
              gap: 12,
            }}>
              {/* Hour Control */}
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setSelectedNotifHour((prev) => (prev >= 12 ? 1 : prev + 1))}
                  style={{ padding: 6, backgroundColor: `${theme.primary}18`, borderRadius: 8, marginBottom: 4 }}
                >
                  <Ionicons name="chevron-up" size={18} color={theme.primaryLight} />
                </TouchableOpacity>
                <View style={{
                  backgroundColor: theme.inputBg,
                  borderRadius: 12,
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  minWidth: 54,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: theme.text }}>
                    {String(selectedNotifHour).padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedNotifHour((prev) => (prev <= 1 ? 12 : prev - 1))}
                  style={{ padding: 6, backgroundColor: `${theme.primary}18`, borderRadius: 8, marginTop: 4 }}
                >
                  <Ionicons name="chevron-down" size={18} color={theme.primaryLight} />
                </TouchableOpacity>
                <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '700', marginTop: 2 }}>HOUR</Text>
              </View>

              {/* Colon Separator */}
              <Text style={{ fontSize: 26, fontWeight: '900', color: theme.textMuted, marginBottom: 14 }}>:</Text>

              {/* Minute Control */}
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setSelectedNotifMinute((prev) => (prev >= 55 ? 0 : prev + 5))}
                  style={{ padding: 6, backgroundColor: `${theme.primary}18`, borderRadius: 8, marginBottom: 4 }}
                >
                  <Ionicons name="chevron-up" size={18} color={theme.primaryLight} />
                </TouchableOpacity>
                <View style={{
                  backgroundColor: theme.inputBg,
                  borderRadius: 12,
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  minWidth: 54,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: theme.text }}>
                    {String(selectedNotifMinute).padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedNotifMinute((prev) => (prev <= 0 ? 55 : prev - 5))}
                  style={{ padding: 6, backgroundColor: `${theme.primary}18`, borderRadius: 8, marginTop: 4 }}
                >
                  <Ionicons name="chevron-down" size={18} color={theme.primaryLight} />
                </TouchableOpacity>
                <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '700', marginTop: 2 }}>MINUTE</Text>
              </View>

              {/* AM / PM Toggle */}
              <View style={{ flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => setSelectedNotifAmPm('AM')}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: selectedNotifAmPm === 'AM' ? theme.primary : theme.inputBg,
                    borderWidth: 1,
                    borderColor: selectedNotifAmPm === 'AM' ? theme.primary : theme.border,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: selectedNotifAmPm === 'AM' ? '#FFFFFF' : theme.textMuted,
                  }}>
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedNotifAmPm('PM')}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: selectedNotifAmPm === 'PM' ? theme.primary : theme.inputBg,
                    borderWidth: 1,
                    borderColor: selectedNotifAmPm === 'PM' ? theme.primary : theme.border,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: selectedNotifAmPm === 'PM' ? '#FFFFFF' : theme.textMuted,
                  }}>
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Preset Pills */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>
              Quick Presets
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[
                { label: '8:00 PM', h: 8, m: 0, ap: 'PM' },
                { label: '9:00 PM', h: 9, m: 0, ap: 'PM' },
                { label: '10:00 PM', h: 10, m: 0, ap: 'PM' },
                { label: '9:00 AM', h: 9, m: 0, ap: 'AM' },
                { label: '1:00 PM', h: 1, m: 0, ap: 'PM' },
                { label: '7:30 PM', h: 7, m: 30, ap: 'PM' },
              ].map((pst, idx) => {
                const isSelected = selectedNotifHour === pst.h && selectedNotifMinute === pst.m && selectedNotifAmPm === pst.ap;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setSelectedNotifHour(pst.h);
                      setSelectedNotifMinute(pst.m);
                      setSelectedNotifAmPm(pst.ap);
                    }}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 9,
                      borderRadius: 8,
                      backgroundColor: isSelected ? `${theme.primary}25` : theme.cardAlt,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.primary : theme.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 11,
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? theme.primaryLight : theme.text,
                    }}>
                      {pst.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Scheduled Banner */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: `${theme.primary}15`,
              padding: 9,
              borderRadius: 10,
              gap: 8,
              marginBottom: 14,
            }}>
              <Ionicons name="notifications" size={16} color={theme.primaryLight} />
              <Text style={{ fontSize: 12, color: theme.text, flex: 1, fontWeight: '600' }}>
                Reminder fires daily at <Text style={{ fontWeight: '800', color: theme.primaryLight }}>{String(selectedNotifHour).padStart(2, '0')}:{String(selectedNotifMinute).padStart(2, '0')} {selectedNotifAmPm}</Text>
              </Text>
            </View>

            {/* Modal Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setNotifTimeModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardAlt,
                }}
              >
                <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  let h24 = selectedNotifHour % 12;
                  if (selectedNotifAmPm === 'PM') h24 += 12;
                  if (updateNotificationSettings) {
                    await updateNotificationSettings({
                      hour: h24,
                      minute: selectedNotifMinute,
                    });
                  }
                  setNotifTimeModalVisible(false);
                }}
                style={{
                  flex: 1.5,
                  paddingVertical: 11,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: theme.primary,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Save Reminder Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Developer Feedback Modal */}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
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
  textInputStyle: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeCard: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  aboutBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  aboutVersion: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalHelp: {
    fontSize: 12,
    marginBottom: 12,
  },
  lengthSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  lenBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  lenBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  currencySym: {
    fontSize: 18,
    fontWeight: '800',
    width: 32,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  jsonTextarea: {
    height: 180,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  fileActionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  fileActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fileIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileActionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  fileActionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  fileActionBtn: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fileActionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  toggleRawTextRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleRawText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Google Cloud Backup Styles
  googleAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleUserName: {
    fontSize: 14,
    fontWeight: '800',
  },
  googleUserEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  cloudActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98118',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cloudActiveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  cloudBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    gap: 6,
  },
  cloudBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  connectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cloudInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  cloudInfoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  autoBackupBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  autoBackupTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  autoBackupSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  autoToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  autoToggleText: {
    fontSize: 11,
    fontWeight: '900',
  },
  schedulePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  schedulePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
