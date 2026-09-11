import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import ScreenBackground from '../components/ScreenBackground';
import { colors } from '../constants/colors';

export default function NotFoundScreen() {
  return (
    <ScreenBackground style={styles.wrap}>
      <Text style={styles.title}>This screen doesn't exist.</Text>
      <Link href="/" style={styles.link}>
        Go back to Home
      </Link>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  link: { color: colors.accent, fontWeight: '700' },
});
