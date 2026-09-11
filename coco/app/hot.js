import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DealCard from '../components/DealCard';
import ScreenBackground from '../components/ScreenBackground';
import { colors } from '../constants/colors';
import { useDeals } from '../context/DealsContext';

export default function HotDealsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deals } = useDeals();

  const hotDeals = useMemo(
    () => [...deals].filter((d) => d.qualityScore >= 70).sort((a, b) => b.qualityScore - a.qualityScore),
    [deals]
  );

  return (
    <ScreenBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <LinearGradient colors={[colors.flameStart, colors.flameEnd]} style={styles.titleChip}>
          <MaterialCommunityIcons name="fire" size={16} color="#fff" />
          <Text style={styles.titleText}>Hot Right Now</Text>
        </LinearGradient>
        <View style={{ width: 38 }} />
      </View>
      <Text style={styles.subtitle}>Exceptional & Good deals (score 70+) across every category</Text>

      <FlatList
        data={hotDeals}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: insets.bottom + 40, paddingTop: 16 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <DealCard deal={item} variant="list" />
          </View>
        )}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  titleText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  subtitle: { color: colors.textFaint, fontSize: 12, paddingHorizontal: 16, marginTop: 4, marginBottom: 4 },
});
