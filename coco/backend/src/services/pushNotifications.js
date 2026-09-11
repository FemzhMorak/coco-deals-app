const { Expo } = require('expo-server-sdk');
const { state, persist } = require('../config/db');

const expo = new Expo();
const FREE_DELAY_MS = (Number(process.env.FREE_NOTIFICATION_DELAY_MINUTES) || 30) * 60 * 1000;

async function sendBatch(messages) {
  if (messages.length === 0) return;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('[push] failed to send chunk:', err.message);
    }
  }
}

// Notifies every user following `deal.category` with a push token.
// Pro users get it instantly; Free users are delayed per FREE_DELAY_MS,
// matching the app's monetisation hook (instant alerts are a Pro perk).
async function notifyNewDeal(deal) {
  const users = Object.values(state.users).filter((u) => {
    if (!u.pushToken || !Expo.isExpoPushToken(u.pushToken)) return false;
    const followed = u.followedCategories ?? [];
    const prefs = u.notificationPrefs ?? {};
    return followed.includes(deal.category) && prefs[deal.category] !== false;
  });

  if (users.length === 0) return;

  const buildMessage = (user) => ({
    to: user.pushToken,
    sound: 'default',
    title: `${deal.brandLogo ?? '🔥'} ${deal.brand} — ${deal.qualityScore}% match`,
    body: `${deal.title} — ${deal.savingsPercent ? `${deal.savingsPercent}% off, ` : ''}tap to grab`,
    data: {
      dealId: deal.id,
      brand: deal.brand,
      brandLogo: deal.brandLogo,
      category: deal.category,
      qualityScore: deal.qualityScore,
    },
  });

  const instant = users.filter((u) => u.isPro).map(buildMessage);
  const delayed = users.filter((u) => !u.isPro).map(buildMessage);

  await sendBatch(instant);
  if (delayed.length > 0) {
    setTimeout(() => sendBatch(delayed), FREE_DELAY_MS);
  }
}

async function registerPushToken(userId, token) {
  if (!state.users[userId]) state.users[userId] = { id: userId };
  state.users[userId].pushToken = token;
  persist();
}

module.exports = { notifyNewDeal, registerPushToken };
