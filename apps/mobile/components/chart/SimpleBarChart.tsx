/**
 * Simple SVG Bar Chart — no external chart library
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function SimpleBarChart({
  data,
  height = 160,
  color = Colors.primary,
  formatValue = (v) => String(v),
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.min(40, 300 / data.length));
  const gap = 8;
  const chartWidth = data.length * (barWidth + gap);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 30);
          const x = index * (barWidth + gap);
          const y = height - 30 - barHeight;

          return (
            <Rect
              key={item.label}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={6}
              fill={color}
              opacity={0.85}
            />
          );
        })}
      </Svg>
      <View style={[styles.labelsRow, { width: chartWidth }]}>
        {data.map((item, index) => (
          <Text
            key={item.label}
            style={[styles.label, { width: barWidth + gap }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  labelsRow: { flexDirection: 'row', marginTop: 4 },
  label: { fontSize: 10, color: Colors.muted, textAlign: 'center' },
});
