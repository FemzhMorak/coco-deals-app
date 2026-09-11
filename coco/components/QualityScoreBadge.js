import { StyleSheet, Text, View } from 'react-native';
import { scoreMeta } from '../constants/colors';

export default function QualityScoreBadge({ score, compact = false }) {
  const meta = scoreMeta(score);
  return (
    <View style={[styles.badge, { backgroundColor: meta.soft, borderColor: meta.color }]}>
      <Text style={[styles.score, { color: meta.color }]}>{score}</Text>
      {!compact && <Text style={[styles.label, { color: meta.color }]}> — {meta.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  score: {
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
