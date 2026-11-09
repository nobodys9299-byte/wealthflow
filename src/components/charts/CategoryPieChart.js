import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryById } from '../../constants/categories';

export const CategoryPieChart = ({ data = [], totalAmount = 0, size = 200, strokeWidth = 24, categoryType = 'expense' }) => {
  const { theme, currency } = useFinance();
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (!data || data.length === 0 || totalAmount <= 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No {categoryType} data for this period</Text>
      </View>
    );
  }

  // Calculate segment offsets
  let accumulatedAngle = 0;
  const segments = data.map((item) => {
    const fraction = item.amount / totalAmount;
    const strokeDasharray = `${circumference * fraction} ${circumference * (1 - fraction)}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;

    const cat = getCategoryById(item.categoryId, item.type || categoryType);
    return {
      ...item,
      color: cat.color,
      name: cat.name,
      fraction,
      percent: Math.round(fraction * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Background subtle ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={theme.border}
              strokeWidth={strokeWidth}
              fill="none"
              opacity={0.3}
            />
            {/* Slices */}
            {segments.map((seg, idx) => (
              <Circle
                key={`slice_${seg.categoryId}_${idx}`}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </G>
        </Svg>

        {/* Center Total Card */}
        <View style={styles.centerLabel}>
          <Text style={[styles.centerSub, { color: theme.textMuted }]}>Total Spent</Text>
          <Text style={[styles.centerMain, { color: theme.text }]}>
            {formatCurrency(totalAmount, currency.symbol)}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {segments.slice(0, 6).map((seg) => (
          <View key={`leg_${seg.categoryId}`} style={styles.legendRow}>
            <View style={styles.legendLeft}>
              <View style={[styles.colorDot, { backgroundColor: seg.color }]} />
              <Text style={[styles.legendName, { color: theme.text }]} numberOfLines={1}>
                {seg.name}
              </Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={[styles.legendPercent, { color: theme.textMuted }]}>{seg.percent}%</Text>
              <Text style={[styles.legendAmount, { color: theme.text }]}>
                {formatCurrency(seg.amount, currency.symbol)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  centerSub: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerMain: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  legendContainer: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '500',
    width: 32,
    textAlign: 'right',
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
