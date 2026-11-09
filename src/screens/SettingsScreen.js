import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES, THEMES } from '../constants/theme';

export const SettingsScreen = ({ onLockApp, onOpenSmartInbox, onNavigateTab, onBack }) => {
  const {
    theme,
    themeId,
    changeTheme,
    currency,
    setCurrency,
    securitySettings,
    updateSecurity,
    userUpiSettings,
    updateUpiSettings,
    exportCSVString,
    importFromCSV,
    exportAsJSON,
    importFromJSON,
    resetToSampleData,
    clearAllData,
    transactions,
    accounts,
    lendingRecords,
  } = useFinance();

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);

  // UPI Setup Modal
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiIdInput, setUpiIdInput] = useState(userUpiSettings?.upiId || '');
  const [payeeNameInput, setPayeeNameInput] = useState(userUpiSettings?.payeeName || '');

  // CSV Modal
  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [showRawCsv, setShowRawCsv] = useState(false);

  // PIN Setup Modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [chosenLength, setChosenLength] = useState(securitySettings.pin?.length || 4);
  const [newPin, setNewPin] = useState('');

  const handleExportCSV = async () => {
    try {
      const csv = exportCSVString();
      setCsvInput(csv);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `wealthflow_backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('CSV backup file successfully downloaded!');
      } else {
        const fileUri = `${FileSystem.documentDirectory}wealthflow_backup_${Date.now()}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Save / Export WealthFlow Backup CSV',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          alert('Sharing is not available on this device');
        }
      }
    } catch (err) {
      console.warn('Native CSV export failed:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
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
        alert('No file selected');
        return;
      }

      let content = '';
      if (Platform.OS === 'web' && file.file) {
        content = await file.file.text();
      } else {
        content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      if (!content || !content.trim()) {
        alert('The selected CSV file is empty');
        return;
      }

      const res = await importFromCSV(content.trim());
      if (res.success) {
        alert(`Success! Imported ${res.count || 'all'} records from "${file.name || 'CSV file'}".`);
        setCsvModalVisible(false);
      } else {
        alert('Failed to parse CSV file: ' + (res.error || 'Invalid CSV format'));
      }
    } catch (err) {
      console.warn('Import CSV error:', err);
      alert('Failed to import file: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSaveUpiSettings = () => {
    updateUpiSettings({
      upiId: upiIdInput.trim(),
      payeeName: payeeNameInput.trim() || 'WealthFlow User',
    });
    setUpiModalVisible(false);
    alert('UPI settings updated! You can now request payments directly via WhatsApp.');
  };

  const handleImportCSV = async () => {
    if (!csvInput.trim()) {
      alert('Please paste valid CSV data to restore');
      return;
    }

    const res = await importFromCSV(csvInput.trim());
    if (res.success) {
      alert(`Success! Imported ${res.count || 'all'} records.`);
      setCsvModalVisible(false);
    } else {
      alert('Failed to parse CSV: ' + res.error);
    }
  };

  const handleExportJSON = () => {
    const json = exportAsJSON();
    setJsonInput(json);
    setBackupModalVisible(true);
  };

  const handleExportJSONFile = async () => {
    try {
      const json = exportAsJSON();
      setJsonInput(json);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `wealthflow_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('JSON backup file successfully downloaded!');
      } else {
        const fileUri = `${FileSystem.documentDirectory}wealthflow_backup_${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Save / Export WealthFlow Backup JSON',
            UTI: 'public.json',
          });
        } else {
          alert('Sharing is not available on this device');
        }
      }
    } catch (err) {
      console.warn('Native JSON export failed:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handlePickAndImportJSONFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets ? result.assets[0] : result;
      if (!file || !file.uri) {
        alert('No file selected');
        return;
      }

      let content = '';
      if (Platform.OS === 'web' && file.file) {
        content = await file.file.text();
      } else {
        content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      if (!content || !content.trim()) {
        alert('The selected JSON file is empty');
        return;
      }

      const res = await importFromJSON(content.trim());
      if (res.success) {
        alert(`Success! Database restored from "${file.name || 'JSON file'}".`);
        setBackupModalVisible(false);
      } else {
        alert('Failed to parse JSON file: ' + (res.error || 'Invalid JSON format'));
      }
    } catch (err) {
      console.warn('Import JSON error:', err);
      alert('Failed to import file: ' + (err.message || 'Unknown error'));
    }
  };

  const handleImportJSON = async () => {
    if (!jsonInput.trim()) {
      alert('Please paste valid backup JSON data');
      return;
    }
    const res = await importFromJSON(jsonInput);
    if (res.success) {
      alert('Data successfully restored!');
      setBackupModalVisible(false);
    } else {
      alert('Failed to parse backup JSON: ' + res.error);
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
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Settings & Security</Text>
          <Text style={[styles.subText, { color: theme.textMuted }]}>
            Passcode, UPI WhatsApp requests, custom categories & CSV
          </Text>
        </View>
      </View>

      {/* UPI & Payment Settings for WhatsApp Requests */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>WHATSAPP PAYMENT & UPI SETTINGS</Text>
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
                  Shared when requesting lending payments via WhatsApp
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Security & Biometrics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SECURITY & PRIVACY</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* App Lock Toggle */}
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}25` }]}>
                <Ionicons name="shield-checkmark" size={18} color={theme.primaryLight} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Require Passcode to Open</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {securitySettings.enabled ? 'App locks when closed' : 'No lock required'}
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
                    Set PIN ({securitySettings.pin?.length || 4} Digits)
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    Supports 4 or 6 digits • Hidden on login screen
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
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Fingerprint / Biometrics</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    Unlock with fingerprint sensor
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

          {/* Test Lock Screen button */}
          {securitySettings.enabled && (
            <TouchableOpacity
              onPress={onLockApp}
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.primaryLight} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Lock App Now (Test Screen)</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    Verify keypad & hidden PIN
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Multiple Theme Picker */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>VISUAL THEMES</Text>

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

      {/* Currency Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>CURRENCY & SYMBOLS</Text>

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
                <Text style={[styles.rowTitle, { color: theme.text }]}>Base Currency</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {currency.code} ({currency.name})
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Friends Lending Quick Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>FRIEND DEBT & LENDING</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => onNavigateTab && onNavigateTab('lending')}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#6366F125' }]}>
                <Text style={{ fontSize: 18 }}>🤝</Text>
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Manage Lending Accounts</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {lendingRecords.length} loans tracked • WhatsApp PDF statements
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SMS & Gmail Sync Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>AUTOMATIC TRANSACTION SYNC</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={onOpenSmartInbox}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="mail-unread-outline" size={18} color={theme.primaryLight} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>SMS & Gmail Bank Inbox</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Real SMS permission & pending confirmation queue
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Complete Data Export & CSV Backup */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>COMPLETE DATA BACKUP (CSV & JSON)</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Export Full CSV */}
          <TouchableOpacity
            onPress={handleExportCSV}
            style={[styles.row, { borderBottomColor: theme.border }]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.success}20` }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.success} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Export All Data to CSV</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Exports transactions, accounts, and loans for Excel/WhatsApp
                </Text>
              </View>
            </View>
            <Ionicons name="share-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Import Full CSV */}
          <TouchableOpacity
            onPress={() => setCsvModalVisible(true)}
            style={[styles.row, { borderBottomColor: theme.border }]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.info}20` }]}>
                <Ionicons name="cloud-upload-outline" size={18} color={theme.info} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Import & Restore from CSV</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Restore your entire app data from a CSV file
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Backup / Restore JSON */}
          <TouchableOpacity
            onPress={handleExportJSON}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="code-download-outline" size={18} color={theme.primaryLight} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>JSON Database Backup</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Raw database backup and restore
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset & Maintenance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DATA RESET (CONFIRMATION PROTECTED)</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={resetToSampleData}
            style={[styles.row, { borderBottomColor: theme.border }]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.info}20` }]}>
                <Ionicons name="refresh-outline" size={18} color={theme.info} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Load Sample Data</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Populate demo accounts, budgets, and loans
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={clearAllData} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.dangerBg }]}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.danger }]}>Clear All App Data</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Erase stored logs and start fresh
                </Text>
              </View>
            </View>
          </TouchableOpacity>
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
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
      <Modal visible={csvModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>CSV File Backup & Restore</Text>
              <TouchableOpacity onPress={() => setCsvModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Export and import your entire financial database as a CSV spreadsheet file to easily back up or transfer between apps.
            </Text>

            {/* Action 1: Export CSV File */}
            <View style={[styles.fileActionCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.fileActionHeader}>
                <View style={[styles.fileIconBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Ionicons name="document-text-outline" size={20} color={theme.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileActionTitle, { color: theme.text }]}>Export CSV File</Text>
                  <Text style={[styles.fileActionSub, { color: theme.textMuted }]}>
                    Save all accounts, transactions, and friend loans to a .csv file
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleExportCSV}
                style={[styles.fileActionBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="download-outline" size={18} color="#FFF" />
                <Text style={styles.fileActionBtnText}>Export & Save .CSV File</Text>
              </TouchableOpacity>
            </View>

            {/* Action 2: Import CSV File */}
            <View style={[styles.fileActionCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.fileActionHeader}>
                <View style={[styles.fileIconBadge, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="folder-open-outline" size={20} color="#10B981" />
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
                style={[styles.fileActionBtn, { backgroundColor: '#10B981' }]}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
                <Text style={styles.fileActionBtnText}>Choose & Import .CSV File</Text>
              </TouchableOpacity>
            </View>

            {/* Optional Collapsible Direct Text Input */}
            <TouchableOpacity
              onPress={() => setShowRawCsv(!showRawCsv)}
              style={styles.toggleRawTextRow}
            >
              <Text style={[styles.toggleRawText, { color: theme.primaryLight }]}>
                {showRawCsv ? '▲ Hide Direct CSV Text' : '▼ Advanced: View / Paste Direct CSV Text'}
              </Text>
            </TouchableOpacity>

            {showRawCsv && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={[
                    styles.jsonTextarea,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                      maxHeight: 120,
                    },
                  ]}
                  multiline
                  value={csvInput}
                  onChangeText={setCsvInput}
                  placeholder="Paste CSV text here..."
                  placeholderTextColor={theme.textMuted}
                />
                <TouchableOpacity
                  onPress={handleImportCSV}
                  style={[styles.fileActionBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
                >
                  <Text style={styles.fileActionBtnText}>Restore from Pasted Text</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
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

      {/* JSON Backup Modal */}
      <Modal visible={backupModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>JSON Database Backup & Restore</Text>
              <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Export and import your entire database including accounts, categories, transactions, budgets, and loans as a JSON backup file.
            </Text>

            {/* Action 1: Export JSON File */}
            <View style={[styles.fileActionCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.fileActionHeader}>
                <View style={[styles.fileIconBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Ionicons name="code-download-outline" size={20} color={theme.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileActionTitle, { color: theme.text }]}>Export JSON File</Text>
                  <Text style={[styles.fileActionSub, { color: theme.textMuted }]}>
                    Save entire database snapshot to a .json file
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleExportJSONFile}
                style={[styles.fileActionBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="download-outline" size={18} color="#FFF" />
                <Text style={styles.fileActionBtnText}>Export & Save .JSON File</Text>
              </TouchableOpacity>
            </View>

            {/* Action 2: Import JSON File */}
            <View style={[styles.fileActionCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.fileActionHeader}>
                <View style={[styles.fileIconBadge, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="folder-open-outline" size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileActionTitle, { color: theme.text }]}>Import JSON File</Text>
                  <Text style={[styles.fileActionSub, { color: theme.textMuted }]}>
                    Select and restore a .json backup file from device storage
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handlePickAndImportJSONFile}
                style={[styles.fileActionBtn, { backgroundColor: '#10B981' }]}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
                <Text style={styles.fileActionBtnText}>Choose & Import .JSON File</Text>
              </TouchableOpacity>
            </View>

            {/* Optional Collapsible Direct Text Input */}
            <TouchableOpacity
              onPress={() => setShowRawJson(!showRawJson)}
              style={styles.toggleRawTextRow}
            >
              <Text style={[styles.toggleRawText, { color: theme.primaryLight }]}>
                {showRawJson ? '▲ Hide Direct JSON Text' : '▼ Advanced: View / Paste Direct JSON Text'}
              </Text>
            </TouchableOpacity>

            {showRawJson && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={[
                    styles.jsonTextarea,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                      maxHeight: 120,
                    },
                  ]}
                  multiline
                  value={jsonInput}
                  onChangeText={setJsonInput}
                  placeholder="Paste JSON text here..."
                  placeholderTextColor={theme.textMuted}
                />
                <TouchableOpacity
                  onPress={handleImportJSON}
                  style={[styles.fileActionBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
                >
                  <Text style={styles.fileActionBtnText}>Restore from Pasted JSON</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* UPI Settings Modal */}
      <Modal visible={upiModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Configure UPI for WhatsApp</Text>
              <TouchableOpacity onPress={() => setUpiModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Enter your UPI ID and name. WealthFlow will include this payment link and QR code in friendly WhatsApp payment requests.
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
});
