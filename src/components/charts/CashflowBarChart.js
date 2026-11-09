import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const CashflowBarChart = ({ monthlyData = [] }) => {
  const { theme, currency } = useFinance();

  if (!monthlyData || monthlyData.length === 0) {
    return null;
  }

  const chartHeight = 160;
  const chartWidth = 320;
  const paddingX = 24;
  const paddingBottom = 28;
  const paddingTop = 16;
  const usableHeight = chartHeight - paddingBottom - paddingTop;

  // Find max value across all months for scale
  const maxVal = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    100
  );

  const groupWidth = (chartWidth - paddingX * 2) / monthlyData.length;
  const barWidth = Math.min(16, groupWidth * 0.32);

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.success }]} />
          <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.danger }]} />
          <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Expense</Text>
        </View>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        {/* Baseline */}
        <Line
          x1={paddingX}
          y1={chartHeight - paddingBottom}
          x2={chartWidth - paddingX}
          y2={chartHeight - paddingBottom}
          stroke={theme.border}
          strokeWidth="1"
        />

        {monthlyData.map((d, i) => {
          const groupCenterX = paddingX + i * groupWidth + groupWidth / 2;
          
          const incomeHeight = (d.income / maxVal) * usableHeight;
          const expenseHeight = (d.expense / maxVal) * usableHeight;

          const incomeY = chartHeight - paddingBottom - incomeHeight;
          const expenseY = chartHeight - paddingBottom - expenseHeight;

          const incomeX = groupCenterX - barWidth - 2;
          const expenseX = groupCenterX + 2;

          return (
            <React.Fragment key={`bar_${d.month}_${i}`}>
              {/* Income Bar */}
              <Rect
                x={incomeX}
                y={incomeY}
                width={barWidth}
                height={Math.max(incomeHeight, 2)}
                fill={theme.success}
                rx={4}
              />

              {/* Expense Bar */}
              <Rect
                x={expenseX}
                y={expenseY}
                width={barWidth}
                height={Math.max(expenseHeight, 2)}
                fill={theme.danger}
                rx={4}
              />

              {/* Month Label */}
              <SvgText
                x={groupCenterX}
                y={chartHeight - 8}
                fontSize="11"
                fontWeight="600"
                fill={theme.textMuted}
                textAnchor="middle"
              >
                {d.month}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
