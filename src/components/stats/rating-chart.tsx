import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Text } from '@/components/ui';
import type { RatingPoint } from '@/lib/database.types';
import { Colors, Spacing } from '@/theme/tokens';

export type RatingChartProps = {
  series: RatingPoint[];
  height?: number;
};

/**
 * The rating over time.
 *
 * The seeded value is the first point and is drawn hollow and grey, separated
 * from the rest by a dashed segment: it was assigned, not played for, and the
 * chart should not pretend otherwise (docs/RATING.md §2).
 */
export function RatingChart({ series, height = 120 }: RatingChartProps) {
  const { t } = useTranslation();

  if (series.length < 2) {
    return (
      <Text variant="caption" tone="tertiary">
        {t('stats.chartEmpty')}
      </Text>
    );
  }

  const width = 320;
  const pad = 8;
  const values = series.map((point) => point.points);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 20);

  const x = (index: number) => pad + (index * (width - pad * 2)) / (series.length - 1);
  const y = (value: number) => height - pad - ((value - min) / span) * (height - pad * 2);

  const earned = series.filter((point) => !point.is_seed);
  const earnedStart = series.length - earned.length;
  const points = earned.map((point, i) => `${x(earnedStart + i)},${y(point.points)}`).join(' ');
  const seed = series.find((point) => point.is_seed);

  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {seed ? (
          <Line
            x1={x(0)}
            y1={y(seed.points)}
            x2={x(1)}
            y2={y(series[1].points)}
            stroke={Colors.text.tertiary}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        ) : null}

        <Polyline
          points={points}
          fill="none"
          stroke={Colors.gold}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {seed ? (
          <Circle
            cx={x(0)}
            cy={y(seed.points)}
            r={4}
            fill={Colors.bg.surface}
            stroke={Colors.text.tertiary}
            strokeWidth={1.5}
          />
        ) : null}

        <Circle
          cx={x(series.length - 1)}
          cy={y(values[values.length - 1])}
          r={4}
          fill={Colors.gold}
        />
      </Svg>

      <View style={styles.legend}>
        <Text variant="caption" tone="tertiary">
          {t('stats.seedPoint', { value: seed?.points ?? min })}
        </Text>
        <Text variant="caption" tone="gold">
          {String(values[values.length - 1])}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
});
