import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useNotifications } from '../context/NotificationsContext';

const TAB_META = {
  index: { label: 'Home', icon: 'home-variant' },
  saved: { label: 'Saved', icon: 'bookmark' },
  notifications: { label: 'Alerts', icon: 'bell' },
  profile: { label: 'Profile', icon: 'account-circle' },
};

export default function BottomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);

  const renderTab = (route, index) => {
    const meta = TAB_META[route.name] ?? { label: route.name, icon: 'circle' };
    const focused = state.index === state.routes.indexOf(route);

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };

    return (
      <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab} activeOpacity={0.7}>
        <View>
          <MaterialCommunityIcons
            name={focused ? meta.icon : `${meta.icon}-outline`}
            size={23}
            color={focused ? colors.accent : colors.textFaint}
          />
          {route.name === 'notifications' && unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, { color: focused ? colors.accent : colors.textFaint }]}>
          {meta.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.row}>
        {leftRoutes.map(renderTab)}

        <TouchableOpacity
          style={styles.centerWrap}
          activeOpacity={0.85}
          onPress={() => router.push('/hot')}
        >
          <LinearGradient colors={[colors.flameStart, colors.flameEnd]} style={styles.centerBtn}>
            <MaterialCommunityIcons name="fire" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {rightRoutes.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,13,13,0.55)' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  tab: { alignItems: 'center', gap: 3, flex: 1, paddingVertical: 4 },
  tabLabel: { fontSize: 10, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  centerWrap: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, marginTop: -26 },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bgTop,
    shadowColor: colors.flameEnd,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
