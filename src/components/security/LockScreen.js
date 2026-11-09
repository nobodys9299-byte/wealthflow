import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFinance } from '../../context/FinanceContext';

export const LockScreen = ({ onUnlock, correctPin = '1234' }) => {
  const { theme } = useFinance();
  const [pin, setPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setHasBiometrics(true);
        triggerBiometricAuth();
      }
    } catch (e) {
      console.warn('Biometrics not available:', e);
    }
  };

  const triggerBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock WealthFlow with Biometrics',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        onUnlock();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDigit = (digit) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      if (nextPin === correctPin) {
        setTimeout(onUnlock, 150);
      } else {
        setTimeout(() => {
          setErrorMsg('Incorrect PIN. Try again.');
          setPin('');
        }, 200);
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
        <Text style={[styles.title, { color: theme.text }]}>WealthFlow Security</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Enter your 4-digit PIN to access your finances
        </Text>
      </View>

      {/* PIN Dots Display */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((index) => {
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

      {errorMsg ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
      ) : (
        <Text style={[styles.hintText, { color: theme.textMuted }]}>
          Default PIN is <Text style={{ fontWeight: '800', color: theme.primaryLight }}>{correctPin}</Text>
        </Text>
      )}

      {/* Keypad */}
      <View style={styles.keypad}>
        {keypad.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keypadRow}>
            {row.map((key) => {
              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key="bio"
                    onPress={triggerBiometricAuth}
                    style={[styles.keyBtn, { backgroundColor: theme.cardAlt }]}
                  >
                    <Ionicons name="finger-print-outline" size={26} color={theme.primaryLight} />
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
    marginBottom: 28,
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
    gap: 18,
    marginVertical: 18,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 18,
  },
  hintText: {
    fontSize: 12,
    marginBottom: 18,
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
