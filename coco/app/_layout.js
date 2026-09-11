import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PaywallModal from '../components/PaywallModal';
import { colors } from '../constants/colors';
import { DealsProvider } from '../context/DealsContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { PaywallProvider } from '../context/PaywallContext';
import { UserProvider } from '../context/UserContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DealsProvider>
          <UserProvider>
            <NotificationsProvider>
              <PaywallProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.bgTop },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="deal/[id]" options={{ animation: 'slide_from_right' }} />
                </Stack>
                <PaywallModal />
              </PaywallProvider>
            </NotificationsProvider>
          </UserProvider>
        </DealsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
