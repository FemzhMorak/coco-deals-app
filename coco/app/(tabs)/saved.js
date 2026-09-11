import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryTabs from '../../components/CategoryTabs';
import DealCard from '../../components/DealCard';
import ScreenBackground from '../../components/ScreenBackground';
import { colors } from '../../constants/colors';
import { useDeals } from '../../context/DealsContext';
import { useUser } from '../../context/UserContext';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'quality', label: 'Quality Score' },
];

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { deals } = useDeals();
  const { savedDealIds } = useUser();
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');

  const savedDeals = useMemo(() => {
    let list = deals.filter((d) => savedDealIds.includes(d.id));
    if (category !== 'all') list = list.filter((d) => d.category === category);
    list = [...list];
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'expiry') list.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    if (sort === 'quality') list.sort((a, b) => b.qualityScore - a.qualityScore);
    return list;
  }, [deals, savedDealIds, category, sort]);

  return (
    <ScreenBackground>
      <View style={{ paddingTop: insets.top + 12 }}>
        <Text style={styles.header}>Saved Deals</Text>
        <CategoryTabs selected={category} onSelect={setCategory} />
        <View style={styles.sortRow}>
          {SORTS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortPill, sort === s.key && styles.sortPillActive]}
              onPress={() => setSort(s.key)}
            >
              <Text style={[styles.sortLabel, sort === s.key && styles.sortLabelActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={savedDeals}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 14 }}
        renderItem={({ item }) => <DealCard deal={item} variant="list" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bookmark-outline" size={40} color={colors.textFaint} />
            <Text style={styles.emptyText}>No saved deals yet. Bookmark deals from Home to see them here.</Text>
          </View>
        }
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { color: colors.text, fontSize: 24, fontWeight: '800', paddingHorizontal: 16, marginBottom: 12 },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sortPillActive: { backgroundColor: colors.glassStrong, borderColor: colors.accent },
  sortLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  sortLabelActive: { color: colors.accent, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 80, gap: 10, paddingHorizontal: 40 },
  emptyText: { color: colors.textFaint, textAlign: 'center', fontSize: 13 },
});
