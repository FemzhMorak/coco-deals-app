import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandReliabilityBadge from '../../components/BrandReliabilityBadge';
import CountdownTimer from '../../components/CountdownTimer';
import GlassCard from '../../components/GlassCard';
import PriceHistoryChart from '../../components/PriceHistoryChart';
import QualityScoreBadge from '../../components/QualityScoreBadge';
import ScreenBackground from '../../components/ScreenBackground';
import { CATEGORIES, colors } from '../../constants/colors';
import { useDeals } from '../../context/DealsContext';
import { usePaywall } from '../../context/PaywallContext';
import { useUser } from '../../context/UserContext';
import { useGrabDeal } from '../../hooks/useGrabDeal';
import { computeBrandReliability } from '../../utils/brandReliability';
import { formatNaira } from '../../utils/format';

export default function DealDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { deals, votes, verifications, upvote, downvote, markStillWorks, markExpired } = useDeals();
  const { isSaved, toggleSaved, recordDealOpen, isPro } = useUser();
  const { show } = usePaywall();
  const grabDeal = useGrabDeal();

  const deal = useMemo(() => deals.find((d) => d.id === id), [deals, id]);

  useEffect(() => {
    let timeoutId;
    if (deal) {
      const shouldShowPaywall = recordDealOpen(deal, 'view');
      if (shouldShowPaywall) timeoutId = setTimeout(show, 500);
    }
    // Clear the pending paywall timer if the user navigates away (e.g. taps
    // back) before it fires — otherwise it can pop the paywall modal over
    // whichever screen they've since moved to, which looks like the back
    // button "hung" since a full-screen blurred overlay appears right after.
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  // Hooks must run unconditionally on every render, so the price-history
  // memos live here (before the early "deal not found" return below) and
  // simply no-op when `deal` isn't loaded yet — e.g. the first render right
  // after a deep link, before DealsContext has finished loading.
  const avg30 = useMemo(() => {
    if (!deal?.priceHistory?.length) return null;
    const sum = deal.priceHistory.reduce((s, p) => s + p.price, 0);
    return sum / deal.priceHistory.length;
  }, [deal?.priceHistory]);

  const scoreExplanation = useMemo(() => {
    if (!deal || avg30 == null || deal.dealPrice == null) {
      return 'Score combines community verification and brand reliability — not enough price history yet for a price comparison.';
    }
    const diffPct = Math.round(((avg30 - deal.dealPrice) / avg30) * 100);
    if (diffPct > 0) {
      return `This deal is ${diffPct}% cheaper than the average price over the last 30 days, plus community verification and brand reliability.`;
    }
    return `This deal is priced close to its 30-day average. The score also weighs community verification and brand reliability.`;
  }, [avg30, deal?.dealPrice]);

  if (!deal) {
    return (
      <ScreenBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Deal not found.</Text>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenBackground>
    );
  }

  const categoryLabel = CATEGORIES.find((c) => c.key === deal.category)?.label ?? deal.category;
  const brandReliability = deal.brandReliability ?? computeBrandReliability(deals, deal.brand);
  const saved = isSaved(deal.id);
  const voted = votes[deal.id];
  const verification = verifications[deal.id];

  const handleShare = () => {
    Share.share({
      message: `${deal.title} — ${deal.brand} on Coco 🔥\n${deal.dealUrl}`,
    }).catch(() => {});
  };

  const handleGrab = () => grabDeal(deal);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: deal.imageUrl }} style={styles.image} contentFit="cover" />
          <LinearGradient colors={['rgba(13,13,13,0.2)', colors.bgTop]} style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            style={[styles.circleBtn, { top: insets.top + 8, left: 16 }]}
            onPress={handleBack}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.headerActions, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.circleBtn} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => toggleSaved(deal.id)}>
              <MaterialCommunityIcons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={saved ? colors.accent : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Text style={{ fontSize: 22 }}>{deal.brandLogo}</Text>
            <Text style={styles.brand}>{deal.brand}</Text>
            {deal.isVerified && <MaterialCommunityIcons name="check-decagram" size={16} color={colors.good} />}
          </View>
          <BrandReliabilityBadge brand={deal.brand} percent={brandReliability} />

          <Text style={styles.title}>{deal.title}</Text>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{categoryLabel}</Text>
            </View>
            {deal.stillWorksCount >= 10 && (
              <View style={[styles.pill, { backgroundColor: colors.exceptionalSoft }]}>
                <MaterialCommunityIcons name="shield-check" size={12} color={colors.exceptional} />
                <Text style={[styles.pillText, { color: colors.exceptional }]}> Community Verified</Text>
              </View>
            )}
          </View>

          {deal.originalPrice != null && deal.dealPrice != null && (
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>{formatNaira(deal.originalPrice)}</Text>
              <Text style={styles.dealPrice}>{formatNaira(deal.dealPrice)}</Text>
              {!!deal.savingsPercent && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save {deal.savingsPercent}%</Text>
                </View>
              )}
            </View>
          )}

          <GlassCard style={{ marginTop: 18 }}>
            <View style={styles.scoreHeader}>
              <Text style={styles.cardTitle}>Quality Score</Text>
              <QualityScoreBadge score={deal.qualityScore} />
            </View>
            <Text style={styles.scoreExplanation}>{scoreExplanation}</Text>
          </GlassCard>

          <GlassCard style={{ marginTop: 14 }}>
            <Text style={styles.cardTitle}>Price History</Text>
            {isPro ? (
              <PriceHistoryChart priceHistory={deal.priceHistory} />
            ) : (
              <TouchableOpacity onPress={show} style={styles.lockedChart}>
                <MaterialCommunityIcons name="lock-outline" size={22} color={colors.textFaint} />
                <Text style={styles.lockedText}>Full price history is a Coco Pro feature</Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          <GlassCard style={{ marginTop: 14 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Expiry</Text>
              <CountdownTimer expiryDate={deal.expiryDate} />
            </View>
            <Text style={styles.expiryDate}>{new Date(deal.expiryDate).toLocaleString('en-NG')}</Text>
          </GlassCard>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{deal.description}</Text>

          <Text style={styles.sectionTitle}>Community</Text>
          <GlassCard>
            <View style={styles.communityRow}>
              <TouchableOpacity style={styles.voteBtn} onPress={() => upvote(deal.id)}>
                <MaterialCommunityIcons
                  name={voted === 'up' ? 'thumb-up' : 'thumb-up-outline'}
                  size={18}
                  color={voted === 'up' ? colors.accent : colors.textDim}
                />
                <Text style={styles.voteText}>{deal.upvotes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voteBtn} onPress={() => downvote(deal.id)}>
                <MaterialCommunityIcons
                  name={voted === 'down' ? 'thumb-down' : 'thumb-down-outline'}
                  size={18}
                  color={voted === 'down' ? colors.weak : colors.textDim}
                />
                <Text style={styles.voteText}>{deal.downvotes}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.reportRow}>
              <TouchableOpacity
                style={[styles.reportBtn, verification === 'still_works' && styles.reportBtnActiveGood]}
                onPress={() => markStillWorks(deal.id)}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={15} color={colors.exceptional} />
                <Text style={styles.reportText}>Still Works ({deal.stillWorksCount})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportBtn, verification === 'expired' && styles.reportBtnActiveBad]}
                onPress={() =>
                  Alert.alert('Report as expired?', 'This helps other users avoid dead deals.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Report', style: 'destructive', onPress: () => markExpired(deal.id) },
                  ])
                }
              >
                <MaterialCommunityIcons name="close-circle-outline" size={15} color={colors.weak} />
                <Text style={styles.reportText}>Expired ({deal.expiredCount})</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <GlassCard>
            <Text style={styles.terms}>
              Offer valid while stocks last or until the stated expiry, whichever comes first. Prices and
              availability are set by {deal.brand} and may change without notice. Coco aggregates public deal
              information and is not responsible for order fulfilment — always confirm final pricing on the
              brand's platform before purchase.
            </Text>
          </GlassCard>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.grabBtn} onPress={handleGrab} activeOpacity={0.88}>
          <LinearGradient
            colors={[colors.flameStart, colors.flameEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.grabGradient}
          >
            <Text style={styles.grabText}>Grab Deal</Text>
            <MaterialCommunityIcons name="arrow-top-right" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notFoundText: { color: colors.textDim, fontSize: 15 },
  backLink: { color: colors.accent, fontWeight: '700' },
  imageWrap: { height: 280, width: '100%' },
  image: { width: '100%', height: '100%' },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(13,13,13,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { position: 'absolute', right: 16, flexDirection: 'row', gap: 10 },
  content: { paddingHorizontal: 16, marginTop: -36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { color: colors.text, fontSize: 14, fontWeight: '700' },
  title: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 10, lineHeight: 29 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  originalPrice: { color: colors.textFaint, fontSize: 15, textDecorationLine: 'line-through' },
  dealPrice: { color: colors.text, fontSize: 26, fontWeight: '800' },
  savingsBadge: { backgroundColor: colors.exceptionalSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  savingsText: { color: colors.exceptional, fontSize: 12, fontWeight: '800' },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreExplanation: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  lockedChart: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 8 },
  lockedText: { color: colors.textFaint, fontSize: 12, textAlign: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expiryDate: { color: colors.textDim, fontSize: 12, marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  description: { color: colors.textDim, fontSize: 13, lineHeight: 20 },
  communityRow: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voteText: { color: colors.textDim, fontSize: 13, fontWeight: '700' },
  reportRow: { flexDirection: 'row', gap: 10 },
  reportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 10,
    paddingVertical: 9,
  },
  reportBtnActiveGood: { borderColor: colors.exceptional, backgroundColor: colors.exceptionalSoft },
  reportBtnActiveBad: { borderColor: colors.weak, backgroundColor: colors.weakSoft },
  reportText: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  terms: { color: colors.textFaint, fontSize: 11.5, lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(13,13,13,0.85)',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  grabBtn: { borderRadius: 14, overflow: 'hidden' },
  grabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  grabText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
