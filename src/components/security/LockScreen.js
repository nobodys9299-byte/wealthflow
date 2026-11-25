import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFinance } from '../../context/FinanceContext';

export const LockScreen = ({ onUnlock, correctPin = '1234', biometricsEnabled = true }) => {
  const { theme, t } = useFinance();
  const [pin, setPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isPromptingRef = useRef(false);
  const lastPromptAtRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);

  const targetLength = correctPin.length === 6 ? 6 : 4;

  const triggerBiometricAuth = useCallback(async (forceManual = false) => {
    if (!biometricsEnabled) return;
    if (AppState.currentState !== 'active') return;
    if (isPromptingRef.current) return;
    if (!forceManual && Date.now() - lastPromptAtRef.current < 1500) return;

    isPromptingRef.current = true;
    lastPromptAtRef.current = Date.now();
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        setHasBiometrics(false);
        return;
      }
      setHasBiometrics(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('unlock_biometrics', 'Unlock WealthFlow'),
        cancelLabel: t('use_pin', 'Use PIN'),
        fallbackLabel: t('use_pin', 'Use PIN'),
        disableDeviceFallback: false,
      });
      if (result.success) {
        onUnlock();
      }
    } catch (e) {
      console.warn('Biometric auth error:', e);
    } finally {
      isPromptingRef.current = false;
    }
  }, [biometricsEnabled, onUnlock, t]);

  useEffect(() => {
    let mounted = true;
    let timer = null;

    const checkAndAutoPrompt = async () => {
      if (!biometricsEnabled) {
        if (mounted) setHasBiometrics(false);
        return;
      }
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted) {
          setHasBiometrics(Boolean(compatible && enrolled));
        }
        if (compatible && enrolled && AppState.currentState === 'active') {
          timer = setTimeout(() => {
            if (mounted && AppState.currentState === 'active') {
              triggerBiometricAuth(false);
            }
          }, 120);
        }
      } catch (e) {
        console.warn('Biometrics check:', e);
      }
    };

    checkAndAutoPrompt();

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev !== 'active' && nextState === 'active' && biometricsEnabled) {
        timer = setTimeout(() => {
          if (mounted && AppState.currentState === 'active') {
            triggerBiometricAuth(false);
          }
        }, 140);
      }
    });

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [biometricsEnabled, triggerBiometricAuth]);

  const handleDigit = (digit) => {
    if (pin.length >= targetLength) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === targetLength) {
      if (nextPin === correctPin) {
        setTimeout(onUnlock, 120);
      } else {
        setTimeout(() => {
          setErrorMsg(t('incorrect_pin', 'Incorrect PIN. Please try again.'));
          setPin('');
        }, 180);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['bio', '0', 'del'],
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Brand & Security Header */}
      <View style={styles.header}>
        <View style={[styles.shieldIcon, { backgroundColor: `${theme.primary}25` }]}>
          <Ionicons name="lock-closed" size={32} color={theme.primaryLight} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t('locked', 'WealthFlow Locked')}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {t('enter_pin_to_continue', `Enter your ${targetLength}-digit security PIN to continue`)}
        </Text>
      </View>

      {/* Dynamic PIN Dots Display */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: targetLength }).map((_, index) => {
          const filled = pin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  borderColor: errorMsg ? theme.danger : theme.primaryLight,
                  backgroundColor: filled
                    ? errorMsg
                      ? theme.danger
                      : theme.primaryLight
                    : 'transparent',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Error Message Display */}
      <View style={styles.messageBox}>
        {errorMsg ? (
          <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
        ) : null}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {keypad.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keypadRow}>
            {row.map((key) => {
              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key="bio"
                    onPress={() => triggerBiometricAuth(true)}
                    disabled={!biometricsEnabled}
                    style={[
                      styles.keyBtn,
                      {
                        backgroundColor: biometricsEnabled ? `${theme.primary}20` : theme.cardAlt,
                        borderColor: biometricsEnabled ? `${theme.primary}50` : theme.border,
                        opacity: biometricsEnabled ? 1 : 0.35,
                      },
                    ]}
                    accessibilityLabel="Scan Fingerprint"
                  >
                    <Ionicons name="finger-print" size={28} color={theme.primaryLight} />
                  </TouchableOpacity>
                );
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key="del"
                    onPress={handleDelete}
                    style={[styles.keyBtn, { backgroundColor: theme.cardAlt }]}
                  >
                    <Ionicons name="backspace-outline" size={24} color={theme.textMuted} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleDigit(key)}
                  style={[styles.keyBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Text style={[styles.keyText, { color: theme.text }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  messageBox: {
    height: 24,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  keypad: {
    width: '100%',
    maxWidth: 290,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '700',
  },
});
