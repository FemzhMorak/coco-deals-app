import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { PRO_PRICE_LABEL } from '../constants/config';
import { usePaywall } from '../context/PaywallContext';
import { useUser } from '../context/UserContext';
import GlassCard from './GlassCard';

const PERKS = [
  { icon: 'lightning-bolt', text: 'Instant push notifications (no 30-min delay)' },
  { icon: 'chart-line', text: 'Full 30/90-day price history charts' },
  { icon: 'target-account', text: 'Fully personalised deal feed' },
  { icon: 'star-circle', text: 'Early access to brand-exclusive deals' },
];

export default function PaywallModal() {
  const { visible, hide } = usePaywall();
  const { upgradeToPro } = useUser();

  const handleUpgrade = () => {
    upgradeToPro();
    hide();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.backdrop}>
          <GlassCard style={styles.card} radius={28}>
            <TouchableOpacity style={styles.closeBtn} onPress={hide} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textDim} />
            </TouchableOpacity>

            <LinearGradient colors={[colors.flameStart, colors.flameEnd]} style={styles.flameWrap}>
              <MaterialCommunityIcons name="fire" size={30} color="#fff" />
            </LinearGradient>

            <Text style={styles.title}>You've been saving with Coco!</Text>
            <Text style={styles.subtitle}>Upgrade to Coco Pro to unlock the full experience.</Text>

            <View style={styles.perks}>
              {PERKS.map((p) => (
                <View key={p.text} style={styles.perkRow}>
                  <MaterialCommunityIcons name={p.icon} size={18} color={colors.accent} />
                  <Text style={styles.perkText}>{p.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.88}>
              <LinearGradient
                colors={[colors.flameStart, colors.flameEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <Text style={styles.upgradeText}>Upgrade to Coco Pro — {PRO_PRICE_LABEL}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={hide}>
              <Text style={styles.maybeLater}>Maybe later</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 1, padding: 4 },
  flameWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  perks: { width: '100%', gap: 12, marginBottom: 22 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { color: colors.text, fontSize: 13, flex: 1 },
  upgradeBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  upgradeGradient: { paddingVertical: 15, alignItems: 'center' },
  upgradeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  maybeLater: { color: colors.textFaint, fontSize: 13, marginTop: 14, fontWeight: '600' },
});
