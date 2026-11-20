/**
 * CloudBackupService.js
 * Comprehensive Cloud Backup & Restore Architecture for WealthFlow.
 * 
 * Implements WhatsApp-style Cloud Vault Backup & Discovery across uninstalls:
 * 1. Global Vault Discovery Index: Discovers existing backup by Google Account email across re-installations.
 * 2. Automatic Cloud Sync: Saves complete JSON database snapshot to Cloud Vault.
 * 3. Local Share Sheet (Screenshot 1): Saves directly via native Android Share Sheet (Files by Google / Downloads).
 * 4. Pick & Restore from Storage: Uses DocumentPicker to restore .json or .csv backup files.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { safeStorage as AsyncStorage } from '../utils/safeStorage';

const CLOUD_SYNC_ENDPOINT = 'https://api.restful-api.dev/objects'; // Free, public JSON cloud store
const GLOBAL_VAULT_INDEX_ID = 'ff808181a09d98f701a1f6d02c0a7d1f'; // Persistent global discovery registry across uninstalls
const FALLBACK_CACHE_KEY_PREFIX = '@wealthflow_cloud_vault_';

/**
 * Clean email key for safe indexing
 */
function cleanEmailKey(email) {
  return (email || 'user').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

/**
 * Hash an email to create a safe unique key
 */
function hashEmail(email) {
  const clean = (email || '').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `wf_${Math.abs(hash)}_${clean.replace(/[^a-z0-9]/g, '_').substring(0, 16)}`;
}

export const CloudBackupService = {
  /**
   * Save a file (JSON or CSV) directly to device internal storage
   * by opening the native Android Share Sheet (Screenshot 1: Files by Google / Downloads / Drive).
   */
  async saveToDeviceInternalStorage(fileData, defaultFileName, mimeType = 'application/json') {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([fileData], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', defaultFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, fileName: defaultFileName, mode: 'web_download' };
      }

      // Save to local documents directory and open the system Share Sheet (Screenshot 1)
      const fileUri = `${FileSystem.documentDirectory}${defaultFileName}`;
      await FileSystem.writeAsStringAsync(fileUri, fileData, {
        encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Save ${defaultFileName}`,
          UTI: mimeType === 'application/json' ? 'public.json' : 'public.comma-separated-values-text',
        });
        return { success: true, fileName: defaultFileName, fileUri, mode: 'sharing' };
      } else {
        return { success: true, fileName: defaultFileName, fileUri, mode: 'saved_locally' };
      }
    } catch (err) {
      console.warn('saveToDeviceInternalStorage error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Pick and restore backup JSON or CSV from Internal Storage / Filesystem
   */
  async pickAndRestoreFromDriveFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { canceled: true };
      }

      const file = result.assets ? result.assets[0] : result;
      if (!file || !file.uri) {
        return { success: false, error: 'No backup file selected' };
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
        return { success: false, error: 'The selected backup file is empty.' };
      }

      const trimmed = content.trim();
      const fileNameLower = (file.name || '').toLowerCase();

      // Check if it's JSON
      if (trimmed.startsWith('{') || trimmed.startsWith('[') || fileNameLower.endsWith('.json')) {
        try {
          const parsed = JSON.parse(trimmed);
          return {
            success: true,
            format: 'json',
            data: parsed,
            rawJson: trimmed,
            fileName: file.name || 'backup.json',
          };
        } catch (jsonErr) {
          // If JSON parse failed, continue checking if it's CSV
        }
      }

      // Check if it's CSV
      if (fileNameLower.endsWith('.csv') || trimmed.includes(',') || trimmed.includes('\n')) {
        return {
          success: true,
          format: 'csv',
          rawCsv: trimmed,
          fileName: file.name || 'backup.csv',
        };
      }

      return {
        success: false,
        error: 'Unrecognized file format. Please choose a valid .json or .csv backup file.',
      };
    } catch (err) {
      console.warn('pickAndRestoreFromDriveFile error:', err);
      return { success: false, error: err.message || 'Error reading selected backup file' };
    }
  },

  /**
   * Sync snapshot to Remote Cloud Vault using Global Discovery Index
   */
  async syncToCloudVault(email, snapshotObj) {
    if (!email) return { success: false, error: 'Missing email' };
    const emailKey = cleanEmailKey(email);
    const vaultKey = hashEmail(email);

    // 1. Cache locally in AsyncStorage
    try {
      await AsyncStorage.setItem(`${FALLBACK_CACHE_KEY_PREFIX}${vaultKey}`, JSON.stringify(snapshotObj));
      await AsyncStorage.setItem('@wealthflow_last_cloud_email', email);
    } catch (e) {
      console.warn('AsyncStorage cloud cache error:', e);
    }

    // 2. Push to remote REST store with Global Index mapping for post-uninstall discovery
    try {
      let existingBackupId = await AsyncStorage.getItem(`@wealthflow_cloud_obj_id_${vaultKey}`);
      let indexData = {};

      try {
        const indexRes = await fetch(`${CLOUD_SYNC_ENDPOINT}/${GLOBAL_VAULT_INDEX_ID}`);
        if (indexRes.ok) {
          const indexBody = await indexRes.json();
          indexData = indexBody?.data || {};
          if (indexData[emailKey]) {
            existingBackupId = indexData[emailKey];
          }
        }
      } catch (idxErr) {
        console.log('Index lookup error:', idxErr.message);
      }

      const payload = {
        name: `wealthflow_backup_${emailKey}`,
        data: {
          email,
          emailKey,
          updatedAt: new Date().toISOString(),
          txCount: snapshotObj.transactions?.length || 0,
          accCount: snapshotObj.accounts?.length || 0,
          snapshot: snapshotObj,
        },
      };

      if (existingBackupId) {
        const putRes = await fetch(`${CLOUD_SYNC_ENDPOINT}/${existingBackupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (putRes.ok) {
          await AsyncStorage.setItem(`@wealthflow_cloud_obj_id_${vaultKey}`, String(existingBackupId));
          return { success: true, timestamp: payload.data.updatedAt, remote: true };
        }
      }

      const postRes = await fetch(CLOUD_SYNC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (postRes.ok) {
        const resJson = await postRes.json();
        const newBackupId = String(resJson.id);
        await AsyncStorage.setItem(`@wealthflow_cloud_obj_id_${vaultKey}`, newBackupId);

        // Update Global Index with this user's backup object ID
        indexData[emailKey] = newBackupId;
        await fetch(`${CLOUD_SYNC_ENDPOINT}/${GLOBAL_VAULT_INDEX_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'WealthFlow_Global_Cloud_Vault_Index_v1',
            data: indexData,
          }),
        }).catch(() => {});

        return { success: true, timestamp: payload.data.updatedAt, remote: true };
      }
    } catch (netErr) {
      console.log('Remote cloud push deferred (network offline), cached locally:', netErr.message);
    }

    return { success: true, timestamp: new Date().toISOString(), remote: false };
  },

  /**
   * Check if a remote cloud backup exists for an email after reinstalling
   */
  async checkCloudBackupExists(email) {
    if (!email) return { exists: false };
    const emailKey = cleanEmailKey(email);
    const vaultKey = hashEmail(email);

    // 1. Query remote Global Index to discover user's backup object ID across uninstalls
    try {
      const indexRes = await fetch(`${CLOUD_SYNC_ENDPOINT}/${GLOBAL_VAULT_INDEX_ID}`);
      if (indexRes.ok) {
        const indexBody = await indexRes.json();
        const backupObjectId = indexBody?.data?.[emailKey];
        if (backupObjectId) {
          const backupRes = await fetch(`${CLOUD_SYNC_ENDPOINT}/${backupObjectId}`);
          if (backupRes.ok) {
            const body = await backupRes.json();
            if (body?.data?.snapshot) {
              await AsyncStorage.setItem(`@wealthflow_cloud_obj_id_${vaultKey}`, String(backupObjectId));
              return {
                exists: true,
                source: 'remote_cloud',
                backupId: backupObjectId,
                updatedAt: body.data.updatedAt || new Date().toISOString(),
                txCount: body.data.txCount || (body.data.snapshot.transactions?.length || 0),
                accCount: body.data.accCount || (body.data.snapshot.accounts?.length || 0),
                data: body.data.snapshot,
              };
            }
          }
        }
      }
    } catch (netErr) {
      console.log('Remote index check error:', netErr.message);
    }

    // 2. Check local cloud vault cache (fallback)
    try {
      const cached = await AsyncStorage.getItem(`${FALLBACK_CACHE_KEY_PREFIX}${vaultKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          exists: true,
          source: 'local_cache',
          updatedAt: parsed.exportedAt || new Date().toISOString(),
          txCount: parsed.transactions?.length || 0,
          accCount: parsed.accounts?.length || 0,
          data: parsed,
        };
      }
    } catch (e) {
      console.warn('Cache check error:', e);
    }

    return { exists: false };
  },

  /**
   * Pull and restore full database snapshot for an email
   */
  async fetchFromCloudVault(email) {
    const check = await this.checkCloudBackupExists(email);
    if (check.exists && check.data) {
      return { success: true, data: check.data, txCount: check.txCount, accCount: check.accCount };
    }
    return { success: false, error: `No cloud backup found for ${email}.` };
  },

  /**
   * Remove/clear previous cloud backup (when user chooses "Skip / Start Fresh" like WhatsApp)
   */
  async removeCloudBackup(email) {
    if (!email) return;
    const emailKey = cleanEmailKey(email);
    const vaultKey = hashEmail(email);
    try {
      await AsyncStorage.removeItem(`${FALLBACK_CACHE_KEY_PREFIX}${vaultKey}`);
      await AsyncStorage.removeItem(`@wealthflow_cloud_obj_id_${vaultKey}`);

      const indexRes = await fetch(`${CLOUD_SYNC_ENDPOINT}/${GLOBAL_VAULT_INDEX_ID}`);
      if (indexRes.ok) {
        const indexBody = await indexRes.json();
        const indexData = indexBody?.data || {};
        if (indexData[emailKey]) {
          const oldBackupId = indexData[emailKey];
          delete indexData[emailKey];
          // Delete remote object
          await fetch(`${CLOUD_SYNC_ENDPOINT}/${oldBackupId}`, { method: 'DELETE' }).catch(() => {});
          // Update Global Index
          await fetch(`${CLOUD_SYNC_ENDPOINT}/${GLOBAL_VAULT_INDEX_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'WealthFlow_Global_Cloud_Vault_Index_v1',
              data: indexData,
            }),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('removeCloudBackup error:', e);
    }
  },
};
