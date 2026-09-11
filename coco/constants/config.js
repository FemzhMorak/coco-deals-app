// Point this at your backend. On a physical device, `localhost` won't work —
// use your machine's LAN IP instead, e.g. http://192.168.1.42:4000/api.
// See the README "Connecting the app to the backend" section.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const PAYWALL_FREE_OPENS_THRESHOLD = 10;
export const PAYWALL_REPEAT_INTERVAL = 5;
export const FREE_NOTIFICATION_DELAY_MINUTES = 30;
export const PRO_PRICE_LABEL = '₦2,000/month';
