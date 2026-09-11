import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryTabs from '../../components/CategoryTabs';
import GlassCard from '../../components/GlassCard';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, scoreMeta } from '../../constants/colors';
import { useNotifications } from '../../context/NotificationsContext';
import { formatCompactTime } from '../../utils/format';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, markAllRead, markRead } = useNotifications();
  const [category, setCategory] = useState('all');

  const filtered = useMemo(
    () => (category === 'all' ? notifications : notifications.filter((n) => n.category === category)),
    [notifications, category]
  );

  return (
    <ScreenBackground>
      <View style={{ paddingTop: insets.top + 12 }}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        </View>
        <CategoryTabs selected={category} onSelect={setCategory} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 10 }}
        renderItem={({ item }) => {
          const meta = item.qualityScore != null ? scoreMeta(item.qualityScore) : null;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                markRead(item.id);
                if (item.dealId) router.push(`/deal/${item.dealId}`);
              }}
            >
              <GlassCard style={!item.read && styles.unreadCard}>
                <View style={styles.row}>
                  <Text style={styles.logo}>{item.brandLogo}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.brand}>{item.brand}</Text>
                      <Text style={styles.time}>{formatCompactTime(item.receivedAt)}</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {meta && (
                      <Text style={[styles.score, { color: meta.color }]}>
                        {item.qualityScore} — {meta.label}
                      </Text>
                    )}
                  </View>
                  {!item.read && <View style={styles.dot} />}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bell-off-outline" size={40} color={colors.textFaint} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        }
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  header: { color: colors.text, fontSize: 24, fontWeight: '800' },
  markAll: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  unreadCard: { borderColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  logo: { fontSize: 24 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  time: { color: colors.textFaint, fontSize: 11 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 3 },
  score: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { color: colors.textFaint, fontSize: 13 },
});
