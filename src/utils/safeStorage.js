import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getLocalStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

// In-memory fallback if native storage bridge is unavailable
const memoryStorage = new Map();

export const safeStorage = {
  async getItem(key) {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.getItem(key);
      } catch (e) {
        return memoryStorage.get(key) || null;
      }
    }
    try {
      if (Platform.OS !== 'web' && AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      }
    } catch (e) {
      // fallback to memory
    }
    return memoryStorage.get(key) || null;
  },

  async setItem(key, value) {
    memoryStorage.set(key, String(value));
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.setItem(key, String(value));
        return;
      } catch (e) {
        return;
      }
    }
    try {
      if (Platform.OS !== 'web' && AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, String(value));
      }
    } catch (e) {
      // memory fallback already recorded
    }
  },

  async removeItem(key) {
    memoryStorage.delete(key);
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.removeItem(key);
        return;
      } catch (e) {
        return;
      }
    }
    try {
      if (Platform.OS !== 'web' && AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }
  },

  async clear() {
    memoryStorage.clear();
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.clear();
        return;
      } catch (e) {
        return;
      }
    }
    try {
      if (Platform.OS !== 'web' && AsyncStorage && typeof AsyncStorage.clear === 'function') {
        await AsyncStorage.clear();
      }
    } catch (e) {
      // ignore
    }
  },
};
