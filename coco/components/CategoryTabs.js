import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { CATEGORIES, colors } from '../constants/colors';

export default function CategoryTabs({ selected, onSelect, followedCategories }) {
  // When a followed-categories list is passed (Home screen), only show
  // "All" plus the categories the user has actually toggled on — a
  // toggled-off category shouldn't have a tab to select it into an empty feed.
  const visibleCategories = followedCategories
    ? CATEGORIES.filter((cat) => cat.key === 'all' || followedCategories.includes(cat.key))
    : CATEGORIES;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {visibleCategories.map((cat) => {
        const active = cat.key === selected;
        return (
          <TouchableOpacity
            key={cat.key}
            onPress={() => onSelect(cat.key)}
            activeOpacity={0.8}
            style={[styles.pill, active && styles.pillActive]}
          >
            <MaterialCommunityIcons
              name={cat.icon}
              size={14}
              color={active ? '#0D0D0D' : colors.textDim}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#0D0D0D',
    fontWeight: '800',
  },
});
