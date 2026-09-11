import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Line, Path, Stop } from 'react-native-svg';
import { colors } from '../constants/colors';
import { formatNaira } from '../utils/format';

const HEIGHT = 120;

export default function PriceHistoryChart({ priceHistory }) {
  const [width, setWidth] = useState(0);
  if (!priceHistory || priceHistory.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Not enough price history yet for this deal.</Text>
      </View>
    );
  }

  const prices = priceHistory.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = priceHistory.map((p, i) => {
    const x = (i / (priceHistory.length - 1)) * (width || 1);
    const y = HEIGHT - ((p.price - min) / range) * (HEIGHT - 20) - 10;
    return { x, y, price: p.price };
  });

  const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${HEIGHT} L ${points[0].x} ${HEIGHT} Z`;

  return (
    <View>
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>
          Low <Text style={styles.legendValue}>{formatNaira(min)}</Text>
        </Text>
        <Text style={styles.legendText}>
          High <Text style={styles.legendValue}>{formatNaira(max)}</Text>
        </Text>
      </View>
      <View style={{ height: HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <SvgGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity="0.35" />
                <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
              </SvgGradient>
            </Defs>
            <Line x1="0" y1={HEIGHT - 1} x2={width} y2={HEIGHT - 1} stroke={colors.glassBorder} strokeWidth="1" />
            <Path d={areaPath} fill="url(#fill)" />
            <Path d={linePath} stroke={colors.accent} strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {points.length > 0 && (
              <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={colors.accent} />
            )}
          </Svg>
        )}
      </View>
      <Text style={styles.caption}>Price over the last 30 days</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: colors.textFaint, fontSize: 12, textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  legendText: { color: colors.textFaint, fontSize: 11 },
  legendValue: { color: colors.textDim, fontWeight: '700' },
  caption: { color: colors.textFaint, fontSize: 11, marginTop: 6, textAlign: 'center' },
});
