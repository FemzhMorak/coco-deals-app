import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { colors, scoreMeta } from '../constants/colors';
import { useGrabDeal } from '../hooks/useGrabDeal';
import { formatNaira } from '../utils/format';
import CountdownTimer from './CountdownTimer';
import GlassCard from './GlassCard';

const AUTO_SWIPE_INTERVAL = 3000;

export default function HeroCarousel({ deals }) {
  const { width } = useWindowDimensions();
  const listRef = useRef(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance every 3s. Reads/writes the index via a ref so the interval
  // (set up once) always sees the latest position, including ones set by
  // the user manually swiping.
  useEffect(() => {
    if (deals.length <= 1) return;
    const id = setInterval(() => {
      const next = (activeIndexRef.current + 1) % deals.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    }, AUTO_SWIPE_INTERVAL);
    return () => clearInterval(id);
  }, [deals.length, width]);

  // Reset to the first slide if the underlying deal list changes shape
  // (e.g. the user toggles a category off and the list shrinks).
  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [deals.length]);

  const onMomentumScrollEnd = useCallback(
    (e) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      activeIndexRef.current = index;
      setActiveIndex(index);
    },
    [width]
  );

  if (deals.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={deals}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(d) => `hero_${d.id}`}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => <HeroSlide deal={item} width={width} />}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      {deals.length > 1 && (
        <View style={styles.dots}>
          {deals.map((d, i) => (
            <View key={d.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function HeroSlide({ deal, width }) {
  const router = useRouter();
  const grabDeal = useGrabDeal();
  const meta = scoreMeta(deal.qualityScore);

  return (
    <View style={{ width, paddingHorizontal: 16 }}>
      <TouchableOpacity activeOpacity={0.92} onPress={() => router.push(`/deal/${deal.id}`)}>
        <GlassCard style={styles.card} radius={24} noPadding>
          <Image source={{ uri: deal.imageUrl }} style={styles.image} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(13,13,13,0.55)', 'rgba(13,13,13,0.96)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.brandChip}>
                <Text style={{ fontSize: 14 }}>{deal.brandLogo}</Text>
                <Text style={styles.brandText}>{deal.brand}</Text>
              </View>
              <View style={[styles.scoreChip, { borderColor: meta.color, backgroundColor: meta.soft }]}>
                <Text style={[styles.scoreText, { color: meta.color }]}>
                  {deal.qualityScore} — {meta.label}
                </Text>
              </View>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {deal.title}
            </Text>

            <View style={styles.bottomRow}>
              <View>
                {deal.originalPrice != null && deal.dealPrice != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.strike}>{formatNaira(deal.originalPrice)}</Text>
                    <Text style={styles.price}>{formatNaira(deal.dealPrice)}</Text>
                  </View>
                )}
                <CountdownTimer expiryDate={deal.expiryDate} style={{ marginTop: 4 }} />
              </View>
              <TouchableOpacity style={styles.cta} onPress={() => grabDeal(deal)} activeOpacity={0.85}>
                <Text style={styles.ctaText}>Grab Deal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { height: 300 },
  image: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, justifyContent: 'space-between', padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(13,13,13,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  brandText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  scoreChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  scoreText: { fontSize: 11, fontWeight: '800' },
  title: { color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 'auto', lineHeight: 26 },
  strike: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecorationLine: 'line-through' },
  price: { color: '#fff', fontSize: 20, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 },
  cta: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  ctaText: { color: '#0D0D0D', fontWeight: '800', fontSize: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.glassBorderStrong },
  dotActive: { width: 18, backgroundColor: colors.accent },
});
