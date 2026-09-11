import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SAVED_DEALS: '@coco/saved_deals',
  FOLLOWED_CATEGORIES: '@coco/followed_categories',
  NOTIFICATION_PREFS: '@coco/notification_prefs',
  DEAL_OPENS: '@coco/deal_opens',
  DEAL_HISTORY: '@coco/deal_history',
  IS_PRO: '@coco/is_pro',
  NOTIFICATIONS: '@coco/notifications',
  PUSH_TOKEN: '@coco/push_token',
  PAYWALL_LAST_SHOWN_AT: '@coco/paywall_last_shown_at',
  USER_ID: '@coco/user_id',
  VOTES: '@coco/votes',
  VERIFICATIONS: '@coco/verifications',
  PROFILE: '@coco/profile',
};

async function getJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort persistence — ignore storage failures
  }
}

export const storage = {
  KEYS,
  getJSON,
  setJSON,
};
