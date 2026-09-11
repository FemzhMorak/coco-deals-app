import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as api from '../services/api';
import { storage } from '../services/storage';
import { useDeals } from './DealsContext';

const NotificationsContext = createContext(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export function NotificationsProvider({ children }) {
  const { deals } = useDeals();
  const [notifications, setNotifications] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const seededRef = useRef(false);
  const listenerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const stored = await storage.getJSON(storage.KEYS.NOTIFICATIONS, []);
      setNotifications(stored);
      setHydrated(true);
    })();
  }, []);

  // Simulate the backend push feed: any deal scoring 70+ generates an alert.
  useEffect(() => {
    if (!hydrated || seededRef.current || deals.length === 0) return;
    seededRef.current = true;
    setNotifications((cur) => {
      if (cur.length > 0) return cur;
      const generated = deals
        .filter((d) => d.qualityScore >= 70)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 12)
        .map((d) => ({
          id: `n_${d.id}`,
          dealId: d.id,
          brand: d.brand,
          brandLogo: d.brandLogo,
          category: d.category,
          title: d.title,
          qualityScore: d.qualityScore,
          receivedAt: d.createdAt,
          read: false,
        }));
      storage.setJSON(storage.KEYS.NOTIFICATIONS, generated);
      return generated;
    });
  }, [hydrated, deals]);

  useEffect(() => {
    registerForPushNotifications();
    listenerRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const { title, data } = notification.request.content;
      setNotifications((cur) => {
        const next = [
          {
            id: `n_push_${Date.now()}`,
            dealId: data?.dealId,
            brand: data?.brand,
            brandLogo: data?.brandLogo ?? '🔔',
            category: data?.category ?? 'all',
            title: title ?? 'New deal from Coco',
            qualityScore: data?.qualityScore ?? null,
            receivedAt: new Date().toISOString(),
            read: false,
          },
          ...cur,
        ];
        storage.setJSON(storage.KEYS.NOTIFICATIONS, next);
        return next;
      });
    });
    return () => listenerRef.current?.remove();
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((cur) => {
      const next = cur.map((n) => ({ ...n, read: true }));
      storage.setJSON(storage.KEYS.NOTIFICATIONS, next);
      return next;
    });
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((cur) => {
      const next = cur.map((n) => (n.id === id ? { ...n, read: true } : n));
      storage.setJSON(storage.KEYS.NOTIFICATIONS, next);
      return next;
    });
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, markAllRead, markRead }),
    [notifications, unreadCount, markAllRead, markRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

async function registerForPushNotifications() {
  try {
    if (!Notifications.isDevicePushTokenAvailable && Platform.OS === 'web') return;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Coco Deals',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: '#FF7A18',
      });
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    await storage.setJSON(storage.KEYS.PUSH_TOKEN, tokenResponse.data);
    await api.registerPushToken(tokenResponse.data);
  } catch {
    // Push registration is best-effort — e.g. unsupported in Expo Go / simulator.
  }
}
