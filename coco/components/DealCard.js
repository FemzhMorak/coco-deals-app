import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CATEGORIES, colors } from '../constants/colors';
import { useDeals } from '../context/DealsContext';
import { useUser } from '../context/UserContext';
import { useGrabDeal } from '../hooks/useGrabDeal';
import { formatNaira } from '../utils/format';
import CountdownTimer from './CountdownTimer';
import GlassCard from './GlassCard';
import QualityScoreBadge from './QualityScoreBadge';

const CARD_WIDTH = 252;

export default function DealCard({ deal, variant = 'horizontal' }) {
  const router = useRouter();
  const { upvote, votes } = useDeals();
  const { isSaved, toggleSaved } = useUser();
  const grabDeal = useGrabDeal();

  const saved = isSaved(deal.id);
  const voted = votes[deal.id];
  const categoryLabel = CATEGORIES.find((c) => c.key === deal.category)?.label ?? deal.category;
  const hasPrice = deal.originalPrice != null && deal.dealPrice != null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/deal/${deal.id}`)}
      style={variant === 'horizontal' ? { width: CARD_WIDTH } : { width: '100%' }}
    >
      <GlassCard style={styles.card} noPadding>
        <View style={styles.imageWrap}>
          <Image source={{ uri: deal.imageUrl }} style={styles.image} contentFit="cover" transition={200} />
          <View style={styles.imageOverlay} />
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>{deal.brandLogo}</Text>
            <Text style={styles.brandName} numberOfLines={1}>
              {deal.brand}
            </Text>
          </View>
          <View style={styles.scoreBadgeWrap}>
            <QualityScoreBadge score={deal.qualityScore} compact />
          </View>
          <TouchableOpacity
            onPress={() => toggleSaved(deal.id)}
            hitSlop={10}
            style={styles.bookmarkBtn}
          >
            <MaterialCommunityIcons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? colors.accent : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{categoryLabel}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {deal.title}
          </Text>

          {hasPrice && (
            <View style={styles.priceRow}>
              {deal.originalPrice > deal.dealPrice && (
                <Text style={styles.originalPrice}>{formatNaira(deal.originalPrice)}</Text>
              )}
              <Text style={styles.dealPrice}>{formatNaira(deal.dealPrice)}</Text>
              {!!deal.savingsPercent && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>-{deal.savingsPercent}%</Text>
                </View>
              )}
            </View>
          )}

          <CountdownTimer expiryDate={deal.expiryDate} style={{ marginTop: 6 }} />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.voteRow}
              onPress={() => upvote(deal.id)}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={voted === 'up' ? 'thumb-up' : 'thumb-up-outline'}
                size={14}
                color={voted === 'up' ? colors.accent : colors.textDim}
              />
              <Text style={styles.voteCount}>{deal.upvotes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.grabBtn} onPress={() => grabDeal(deal)} activeOpacity={0.85}>
              <Text style={styles.grabBtnText}>Grab Deal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  imageWrap: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1a1a2e',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,13,0.28)',
  },
  brandRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,13,13,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '55%',
  },
  brandLogo: { fontSize: 13, marginRight: 4 },
  brandName: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scoreBadgeWrap: { position: 'absolute', top: 8, right: 40 },
  bookmarkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(13,13,13,0.55)',
    padding: 6,
    borderRadius: 999,
  },
  body: { padding: 12 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  pillText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 18, minHeight: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  originalPrice: { color: colors.textFaint, fontSize: 12, textDecorationLine: 'line-through' },
  dealPrice: { color: colors.text, fontSize: 15, fontWeight: '800' },
  savingsBadge: { backgroundColor: colors.exceptionalSoft, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  savingsText: { color: colors.exceptional, fontSize: 10, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  voteCount: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  grabBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  grabBtnText: { color: '#0D0D0D', fontSize: 12, fontWeight: '800' },
});
