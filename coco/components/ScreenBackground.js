import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

export default function ScreenBackground({ children, style }) {
  return (
    <View style={[styles.flex, style]}>
      <LinearGradient
        colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
