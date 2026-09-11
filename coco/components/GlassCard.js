import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

export default function GlassCard({ children, style, intensity = 40, tint = 'dark', radius = 20, noPadding }) {
  return (
    <View style={[styles.wrap, { borderRadius: radius }, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={[styles.overlay, { borderRadius: radius }]} />
      <View style={[styles.content, noPadding && styles.noPadding, { borderRadius: radius }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glass,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  noPadding: {
    padding: 0,
  },
});
