/**
 * GoogleDriveService.js
 * Official Google Sign-In & Google Drive AppData Backup Service for WealthFlow.
 *
 * Implements real Google authentication (Screenshot 4: native account picker,
 * Screenshots 2 & 3: Google Drive consent dialog) and direct storage inside
 * the user's personal Google Drive (appDataFolder).
 */

import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const GOOGLE_WEB_CLIENT_ID = '153590079065-e6hkflui4atmfg7h5ej8f1tqujj5fht6.apps.googleusercontent.com';
const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILE_NAME = 'wealthflow_backup.json';

class GoogleDriveService {
  constructor() {
    this.configured = false;
  }

  /**
   * Initialize Google Sign-In with Web Client ID and Drive AppData Scope
   */
  configure() {
    if (this.configured) return;
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        scopes: [DRIVE_APPDATA_SCOPE],
        offlineAccess: true,
        forceCodeForRefreshToken: false,
      });
      this.configured = true;
    } catch (e) {
      console.warn('GoogleSignin.configure error:', e);
    }
  }

  /**
   * Launch native Google Play Services account picker (Screenshot 4)
   * and request Google Drive permissions (Screenshots 2 & 3).
   */
  async signIn() {
    this.configure();
    if (Platform.OS === 'web') {
      return { success: false, error: 'Google Sign-In is only available on Android / iOS devices.' };
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      const user = response?.data?.user || response?.user || {
        email: 'user@gmail.com',
        name: 'Google User',
      };

      return {
        success: true,
        user: {
          email: user.email,
          name: user.name || user.givenName || 'Google User',
          photo: user.photo || null,
          id: user.id,
        },
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
      };
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Sign-in was cancelled.' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Sign-in is already in progress.' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Google Play Services is not available or outdated.' };
      }
      console.warn('Google Sign-In Error:', error);
      return { success: false, error: error.message || 'Google Sign-In failed.' };
    }
  }

  /**
   * Get fresh access token for Google Drive API calls
   */
  async getAccessToken() {
    try {
      this.configure();
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (e) {
      console.warn('getAccessToken error:', e);
      return null;
    }
  }

  /**
   * Check if user is currently signed in
   */
  async isSignedIn() {
    try {
      this.configure();
      return await GoogleSignin.isSignedIn();
    } catch (e) {
      return false;
    }
  }

  /**
   * Sign out from Google Account
   */
  async signOut() {
    try {
      this.configure();
      await GoogleSignin.signOut();
      return { success: true };
    } catch (e) {
      console.warn('Google signOut error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Search for existing WealthFlow backup inside the user's private Google Drive appDataFolder
   */
  async findBackupFile(accessToken) {
    if (!accessToken) accessToken = await this.getAccessToken();
    if (!accessToken) return { found: false, error: 'Not authenticated with Google.' };

    try {
      const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,size)&q=name='${BACKUP_FILE_NAME}' and trashed=false`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn('findBackupFile error response:', errText);
        return { found: false, error: errText };
      }

      const body = await res.json();
      const files = body.files || [];
      if (files.length > 0) {
        const file = files[0];
        return {
          found: true,
          fileId: file.id,
          name: file.name,
          modifiedTime: file.modifiedTime,
          size: file.size,
        };
      }
      return { found: false };
    } catch (err) {
      console.warn('findBackupFile exception:', err);
      return { found: false, error: err.message };
    }
  }

  /**
   * Download and parse the backup JSON directly from user's Google Drive appDataFolder
   */
  async downloadBackup(accessToken, fileId) {
    if (!accessToken) accessToken = await this.getAccessToken();
    if (!accessToken) return { success: false, error: 'Not authenticated with Google.' };

    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Drive download error: ${errText}` };
      }

      const snapshot = await res.json();
      return { success: true, data: snapshot };
    } catch (err) {
      console.warn('downloadBackup error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Upload or update full backup JSON directly inside user's private Google Drive appDataFolder
   */
  async uploadBackup(accessToken, snapshotObj) {
    if (!accessToken) accessToken = await this.getAccessToken();
    if (!accessToken) return { success: false, error: 'Not authenticated with Google.' };

    try {
      const existing = await this.findBackupFile(accessToken);
      const jsonContent = JSON.stringify(snapshotObj);

      if (existing.found && existing.fileId) {
        // Update existing file
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.fileId}?uploadType=media`;
        const res = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: jsonContent,
        });

        if (res.ok) {
          const body = await res.json();
          return { success: true, fileId: body.id, updatedAt: new Date().toISOString() };
        }
      }

      // Create new file with multipart upload
      const boundary = 'foo_bar_baz';
      const metadata = JSON.stringify({
        name: BACKUP_FILE_NAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      });

      const multipartBody =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${jsonContent}\r\n` +
        `--${boundary}--`;

      const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (createRes.ok) {
        const body = await createRes.json();
        return { success: true, fileId: body.id, updatedAt: new Date().toISOString() };
      } else {
        const errText = await createRes.text();
        return { success: false, error: errText };
      }
    } catch (err) {
      console.warn('uploadBackup error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete backup file from Google Drive appDataFolder (if user skips or resets)
   */
  async deleteBackup(accessToken) {
    if (!accessToken) accessToken = await this.getAccessToken();
    if (!accessToken) return;

    try {
      const existing = await this.findBackupFile(accessToken);
      if (existing.found && existing.fileId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${existing.fileId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (e) {
      console.warn('deleteBackup error:', e);
    }
  }
}

export const googleDriveService = new GoogleDriveService();
