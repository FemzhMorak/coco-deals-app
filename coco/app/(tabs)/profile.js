import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreateProfileModal from '../../components/CreateProfileModal';
import GlassCard from '../../components/GlassCard';
import ScreenBackground from '../../components/ScreenBackground';
import SectionHeader from '../../components/SectionHeader';
import { CATEGORIES, colors } from '../../constants/colors';
import { PRO_PRICE_LABEL } from '../../constants/config';
import { useDeals } from '../../context/DealsContext';
import { usePaywall } from '../../context/PaywallContext';
import { useUser } from '../../context/UserContext';
import { formatCompactTime, formatNaira } from '../../utils/format';

const FOLLOWABLE = CATEGORIES.filter((c) => c.key !== 'all' && c.key !== 'more');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { getDeal } = useDeals();
  const {
    followedCategories,
    toggleFollowedCategory,
    notificationPrefs,
    toggleNotificationPref,
    isPro,
    dealHistory,
    preferenceProfile,
    profile,
    createProfile,
  } = useUser();
  const { show } = usePaywall();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const topCategoryLabels = useMemo(
    () =>
      preferenceProfile.topCategories
        .slice(0, 3)
        .map((key) => FOLLOWABLE.find((c) => c.key === key)?.label ?? key),
    [preferenceProfile.topCategories]
  );

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }}>
        <Text style={styles.header}>Profile</Text>

        {profile ? (
          <GlassCard style={{ marginHorizontal: 16 }}>
            <View style={styles.identityRow}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="account" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.displayName}>{profile.displayName}</Text>
                <Text style={styles.handle}>@{profile.handle}</Text>
              </View>
            </View>
            <Text style={styles.memberId}>Member ID: {profile.uuid}</Text>
          </GlassCard>
        ) : (
          <GlassCard style={{ marginHorizontal: 16 }}>
            <View style={styles.createRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.displayName}>Create Your Profile</Text>
                <Text style={styles.mutedText}>Personalise your Coco experience</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => setCreateModalVisible(true)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[colors.flameStart, colors.flameEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.getStartedGradient}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        )}

        <CreateProfileModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onSubmit={(name) => {
            createProfile(name);
            setCreateModalVisible(false);
          }}
        />

        <GlassCard style={{ marginHorizontal: 16, marginTop: 14 }}>
          <View style={styles.subRow}>
            <View>
              <Text style={styles.subLabel}>Subscription</Text>
              <Text style={styles.subValue}>{isPro ? 'Coco Pro' : 'Free'}</Text>
            </View>
            {isPro ? (
              <View style={styles.proBadge}>
                <MaterialCommunityIcons name="crown" size={13} color="#0D0D0D" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={show}>
                <LinearGradient
                  colors={[colors.flameStart, colors.flameEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeBtn}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade — {PRO_PRICE_LABEL}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        <SectionHeader icon="account-heart-outline" title="Your Taste Profile" subtitle="Auto-built from your behaviour" />
        <GlassCard style={{ marginHorizontal: 16 }}>
          {topCategoryLabels.length === 0 ? (
            <Text style={styles.mutedText}>
              Open and save a few deals — Coco learns your favourite categories and brands automatically.
            </Text>
          ) : (
            <>
              <Text style={styles.mutedText}>Top categories</Text>
              <View style={styles.chipsRow}>
                {topCategoryLabels.map((label) => (
                  <View key={label} style={styles.chip}>
                    <Text style={styles.chipText}>{label}</Text>
                  </View>
                ))}
              </View>
              {preferenceProfile.averagePricePoint != null && (
                <Text style={[styles.mutedText, { marginTop: 10 }]}>
                  Average deal price you engage with: {formatNaira(preferenceProfile.averagePricePoint)}
                </Text>
              )}
              <Text style={[styles.mutedText, { marginTop: 6 }]}>
                {preferenceProfile.isFullyPersonalized
                  ? 'Your home feed is fully personalised.'
                  : `${preferenceProfile.daysOfData}/30 days of data collected for full personalisation.`}
              </Text>
            </>
          )}
        </GlassCard>

        <SectionHeader icon="tag-multiple-outline" title="Categories You Follow" subtitle="Toggle to control your feed" />
        <GlassCard style={{ marginHorizontal: 16 }} noPadding>
          {FOLLOWABLE.map((cat, i) => (
            <View key={cat.key} style={[styles.prefRow, i > 0 && styles.prefRowBorder]}>
              <View style={styles.prefLeft}>
                <MaterialCommunityIcons name={cat.icon} size={17} color={colors.textDim} />
                <Text style={styles.prefLabel}>{cat.label}</Text>
              </View>
              <Switch
                value={followedCategories.includes(cat.key)}
                onValueChange={() => toggleFollowedCategory(cat.key)}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </GlassCard>

        <SectionHeader icon="bell-cog-outline" title="Notification Preferences" subtitle="Per category alerts" />
        <GlassCard style={{ marginHorizontal: 16 }} noPadding>
          {FOLLOWABLE.map((cat, i) => (
            <View key={cat.key} style={[styles.prefRow, i > 0 && styles.prefRowBorder]}>
              <View style={styles.prefLeft}>
                <MaterialCommunityIcons name={cat.icon} size={17} color={colors.textDim} />
                <Text style={styles.prefLabel}>{cat.label}</Text>
              </View>
              <Switch
                value={!!notificationPrefs[cat.key]}
                onValueChange={() => toggleNotificationPref(cat.key)}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </GlassCard>

        <SectionHeader icon="history" title="Deal History" subtitle={`${dealHistory.length} deals opened`} />
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {dealHistory.slice(0, 8).map((entry, idx) => {
            const deal = getDeal(entry.dealId);
            return (
              <GlassCard key={`${entry.dealId}_${idx}`}>
                <View style={styles.historyRow}>
                  <Text style={{ fontSize: 18 }}>{deal?.brandLogo ?? '🛍️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {deal?.title ?? entry.brand}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {entry.brand} · {entry.action} · {formatCompactTime(entry.at)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            );
          })}
          {dealHistory.length === 0 && (
            <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 10 }]}>
              Deals you open will show up here.
            </Text>
          )}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { color: colors.text, fontSize: 24, fontWeight: '800', paddingHorizontal: 16, marginBottom: 12 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  handle: { color: colors.exceptional, fontSize: 13, fontWeight: '700', marginTop: 2 },
  memberId: { color: colors.textFaint, fontSize: 10, marginTop: 12 },
  createRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  getStartedBtn: { borderRadius: 12, overflow: 'hidden' },
  getStartedGradient: { paddingVertical: 12, alignItems: 'center' },
  getStartedText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
  subValue: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.proGold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  proBadgeText: { color: '#0D0D0D', fontWeight: '800', fontSize: 11 },
  upgradeBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  upgradeBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  mutedText: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: colors.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  prefRowBorder: { borderTopWidth: 1, borderTopColor: colors.glassBorder },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prefLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  historyMeta: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
});
