import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const CategoryVisual = ({ category, size = 44, isTransfer = false }) => {
  if (isTransfer) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size * 0.32,
            backgroundColor: '#3B82F625',
            borderColor: '#3B82F6',
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.44 }}>🔁</Text>
      </View>
    );
  }

  const emoji = category?.emoji || '🏷️';
  const color = category?.color || '#6366F1';
  const bg = category?.bg || `${color}20`;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: bg,
          borderColor: `${color}40`,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
    </View>
  );
};

export const AccountVisual = ({ account, size = 44 }) => {
  const emoji = account?.emoji || (account?.type === 'card' ? '💳' : account?.type === 'cash' ? '💵' : '🏦');
  const color = account?.color || '#3B82F6';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: `${color}22`,
          borderColor: `${color}45`,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
