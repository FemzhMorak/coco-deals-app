import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getCountdownParts } from '../utils/format';

export default function CountdownTimer({ expiryDate, urgent, style }) {
  const [parts, setParts] = useState(() => getCountdownParts(expiryDate));

  useEffect(() => {
    const id = setInterval(() => setParts(getCountdownParts(expiryDate)), 30000);
    return () => clearInterval(id);
  }, [expiryDate]);

  const isUrgent = urgent ?? (!parts.expired && parts.totalMinutes <= 360);

  return (
    <View style={[styles.row, style]}>
      <MaterialCommunityIcons
        name="clock-outline"
        size={13}
        color={parts.expired ? colors.weak : isUrgent ? colors.average : colors.textDim}
      />
      <Text
        style={[
          styles.text,
          { color: parts.expired ? colors.weak : isUrgent ? colors.average : colors.textDim },
        ]}
      >
        {parts.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
