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
          <Text style={[styles.centerSub, { color: theme.textMuted }]}>
            {categoryType === 'income' ? 'Total Income' : 'Total Spent'}
          </Text>
          <Text style={[styles.centerMain, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalAmount, currency.symbol)}
          </Text>
        </View>
      </View>

      {/* Side-by-Side Category Breakdown Grid */}
      <View style={styles.legendGrid}>
        {segments.slice(0, 8).map((seg) => (
          <View
            key={`leg_${seg.categoryId}`}
            style={[styles.legendCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
          >
            <View style={styles.legendCardTop}>
              <View style={[styles.colorDot, { backgroundColor: seg.color }]} />
              <Text style={[styles.legendName, { color: theme.text }]} numberOfLines={1}>
                {seg.name}
              </Text>
            </View>
            <View style={styles.legendCardBottom}>
              <Text style={[styles.legendAmount, { color: categoryType === 'income' ? theme.success : theme.text }]} numberOfLines={1}>
                {formatCurrency(seg.amount, currency.symbol)}
              </Text>
              <View style={[styles.percentBadge, { backgroundColor: `${seg.color}20` }]}>
                <Text style={[styles.percentBadgeText, { color: seg.color }]}>{seg.percent}%</Text>
              </View>
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerMain: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  legendGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginTop: 18,
  },
  legendCard: {
    width: '48.5%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  legendCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendAmount: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  percentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
