import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

export default function BrandReliabilityBadge({ brand, percent }) {
  if (percent === null || percent === undefined) return null;
  const color = percent >= 75 ? colors.exceptional : percent >= 50 ? colors.good : colors.average;
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name="shield-check-outline" size={12} color={color} />
      <Text style={[styles.text, { color }]}>
        {brand} — {percent}% reliable
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 11, fontWeight: '600' },
});
