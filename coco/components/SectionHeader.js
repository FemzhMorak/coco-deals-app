import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

export default function SectionHeader({ icon, title, subtitle, onPressSeeAll }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          {icon && <MaterialCommunityIcons name={icon} size={16} color={colors.accent} />}
          <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onPressSeeAll && (
        <TouchableOpacity onPress={onPressSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  seeAll: { color: colors.accent, fontSize: 13, fontWeight: '700' },
});
