import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryTabs from '../../components/CategoryTabs';
import DealCard from '../../components/DealCard';
import HeroCarousel from '../../components/HeroCarousel';
import ScreenBackground from '../../components/ScreenBackground';
import SectionHeader from '../../components/SectionHeader';
import { colors } from '../../constants/colors';
import { useDeals } from '../../context/DealsContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useUser } from '../../context/UserContext';
import { isExpiringSoon } from '../../utils/format';

const HERO_SIZE = 6;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deals, loading, refreshing, refresh } = useDeals();
  const { unreadCount } = useNotifications();
  const { preferenceProfile, followedCategories } = useUser();
  const [category, setCategory] = useState('all');

  // If the currently-selected tab is a category the user just toggled off
  // in Profile, fall back to "All" rather than showing an orphaned filter
  // whose tab no longer exists.
  useEffect(() => {
    if (category !== 'all' && !followedCategories.includes(category)) setCategory('all');
  }, [category, followedCategories]);

  // Nothing from a category the user has toggled off should appear
  // anywhere on Home — hero carousel, Expiring Soon, or Fresh Deals.
  const followedDeals = useMemo(
    () => deals.filter((d) => followedCategories.includes(d.category)),
    [deals, followedCategories]
  );

  const filtered = useMemo(
    () => (category === 'all' ? followedDeals : followedDeals.filter((d) => d.category === category)),
    [followedDeals, category]
  );

  const heroDeals = useMemo(
    () => [...filtered].sort((a, b) => b.upvotes - a.upvotes).slice(0, HERO_SIZE),
    [filtered]
  );
  const heroIds = useMemo(() => new Set(heroDeals.map((d) => d.id)), [heroDeals]);

  const sortedByQuality = useMemo(
    () => [...filtered].filter((d) => !heroIds.has(d.id)).sort((a, b) => b.qualityScore - a.qualityScore),
    [filtered, heroIds]
  );

  const personalized = useMemo(() => {
    if (preferenceProfile.topCategories.length === 0) return sortedByQuality;
    return [...sortedByQuality].sort((a, b) => {
      const ai = preferenceProfile.topCategories.indexOf(a.category);
      const bi = preferenceProfile.topCategories.indexOf(b.category);
      const aRank = ai === -1 ? 999 : ai;
      const bRank = bi === -1 ? 999 : bi;
      if (aRank !== bRank) return aRank - bRank;
      return b.qualityScore - a.qualityScore;
    });
  }, [sortedByQuality, preferenceProfile.topCategories]);

  const expiringSoon = useMemo(() => filtered.filter((d) => isExpiringSoon(d.expiryDate)), [filtered]);

  const noFollowedCategories = followedCategories.length === 0;

  return (
    <ScreenBackground>
      <ScrollView
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.logoRow}>
              <MaterialCommunityIcons name="fire" size={22} color={colors.accent} />
              <Text style={styles.logo}>Coco</Text>
            </View>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => router.push('/notifications')}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <CategoryTabs selected={category} onSelect={setCategory} followedCategories={followedCategories} />

          {noFollowedCategories ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tag-off-outline" size={36} color={colors.textFaint} />
              <Text style={styles.emptyStateText}>
                You've turned off every category. Follow at least one in Profile to see deals here.
              </Text>
            </View>
          ) : (
            <>
              {!loading && heroDeals.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <HeroCarousel deals={heroDeals} />
                </View>
              )}

              {expiringSoon.length > 0 && (
                <>
                  <SectionHeader icon="timer-sand" title="Expiring Soon" subtitle="Grab these before they're gone" />
                  <FlatList
                    data={expiringSoon}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(d) => `expiring_${d.id}`}
                    contentContainerStyle={styles.hList}
                    renderItem={({ item }) => <DealCard deal={item} />}
                  />
                </>
              )}

              <SectionHeader
                icon="sparkles"
                title="Fresh Deals"
                subtitle={
                  preferenceProfile.isFullyPersonalized
                    ? 'Personalised for you'
                    : 'Sorted by quality score'
                }
              />
              <FlatList
                data={personalized}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(d) => `fresh_${d.id}`}
                contentContainerStyle={styles.hList}
                renderItem={({ item }) => <DealCard deal={item} />}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { color: colors.text, fontSize: 22, fontWeight: '800' },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  hList: { gap: 12, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', gap: 12, paddingHorizontal: 40, paddingTop: 60 },
  emptyStateText: { color: colors.textFaint, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
