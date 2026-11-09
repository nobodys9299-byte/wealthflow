import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const safeStorage = {
  async getItem(key) {
    if (isWeb) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn('Web localStorage getItem error:', e);
        return null;
      }
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('AsyncStorage getItem error:', e);
      return null;
    }
  },

  async setItem(key, value) {
    if (isWeb) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('Web localStorage setItem error:', e);
        return;
      }
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('AsyncStorage setItem error:', e);
    }
  },

  async removeItem(key) {
    if (isWeb) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('Web localStorage removeItem error:', e);
        return;
      }
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('AsyncStorage removeItem error:', e);
    }
  },

  async clear() {
    if (isWeb) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        console.warn('Web localStorage clear error:', e);
        return;
      }
    }
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('AsyncStorage clear error:', e);
    }
  },
};
