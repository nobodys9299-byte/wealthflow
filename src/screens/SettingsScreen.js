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
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES, THEMES } from '../constants/theme';

export const SettingsScreen = ({ onLockApp, onOpenSmartInbox }) => {
  const {
    theme,
    themeId,
    changeTheme,
    currency,
    setCurrency,
    securitySettings,
    updateSecurity,
    exportCSVString,
    exportAsJSON,
    importFromJSON,
    resetToSampleData,
    clearAllData,
    transactions,
  } = useFinance();

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [csvPreviewModal, setCsvPreviewModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  // Pin Edit modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState(securitySettings.pin || '1234');

  const handleExportCSV = () => {
    const csv = exportCSVString();
    setCsvContent(csv);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `money_tracker_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (e) {
        console.warn(e);
      }
    }

    setCsvPreviewModal(true);
  };

  const handleExportJSON = () => {
    const json = exportAsJSON();
    setJsonInput(json);
    setBackupModalVisible(true);
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
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      alert('PIN must be exactly 4 numeric digits');
      return;
    }
    updateSecurity({ pin: newPin });
    setPinModalVisible(false);
    alert('Security PIN updated successfully!');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Settings & Security</Text>
        <Text style={[styles.subText, { color: theme.textMuted }]}>
          Theme styling, passcode lock, and sync
        </Text>
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

          {/* Change PIN */}
          {securitySettings.enabled && (
            <TouchableOpacity
              onPress={() => setPinModalVisible(true)}
              style={[styles.row, { borderBottomColor: theme.border }]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
                  <Ionicons name="key-outline" size={18} color={theme.primaryLight} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Change 4-Digit PIN</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                    Current PIN: •••• ({securitySettings.pin})
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
                    Unlock with device biometrics
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
                    Test the PIN & fingerprint keypad
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
                {/* Color Swatches */}
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
                  Review & confirm automatically detected transactions
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Export & Backup Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DATA & BACKUP</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Export CSV */}
          <TouchableOpacity
            onPress={handleExportCSV}
            style={[styles.row, { borderBottomColor: theme.border }]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.success}20` }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.success} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Export to CSV</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Download spreadsheet with all {transactions.length} transactions
                </Text>
              </View>
            </View>
            <Ionicons name="download-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Backup / Restore JSON */}
          <TouchableOpacity
            onPress={handleExportJSON}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="cloud-upload-outline" size={18} color={theme.primaryLight} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Backup & Restore (JSON)</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Copy backup JSON code or restore from previous backup
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset & Maintenance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DATA RESET (WITH CONFIRMATION)</Text>

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
                  Populate demo accounts, budgets, and transactions
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
                <Text style={[styles.rowTitle, { color: theme.danger }]}>Clear All Transactions</Text>
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
          Version 2.0.0 • React Native Expo
        </Text>
      </View>

      {/* PIN Edit Modal */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Set 4-Digit Passcode</Text>
            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Enter a 4-digit numeric code to unlock your app
            </Text>

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
              maxLength={4}
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

      {/* Backup JSON Modal */}
      <Modal visible={backupModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>JSON Data Backup</Text>
              <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              Copy this JSON to save your backup, or replace it and tap "Restore Data" to load.
            </Text>

            <TextInput
              style={[
                styles.jsonTextarea,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              multiline
              value={jsonInput}
              onChangeText={setJsonInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleImportJSON}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="cloud-download-outline" size={18} color="#FFF" />
                <Text style={styles.modalBtnText}>Restore Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CSV Preview Modal */}
      <Modal visible={csvPreviewModal} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>CSV Export</Text>
              <TouchableOpacity onPress={() => setCsvPreviewModal(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelp, { color: theme.textMuted }]}>
              CSV formatted data generated:
            </Text>

            <TextInput
              style={[
                styles.jsonTextarea,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              multiline
              editable={false}
              value={csvContent}
            />
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
    marginBottom: 16,
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
  pinInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
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
});
