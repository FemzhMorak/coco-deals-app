const { state, persist } = require('../config/db');
const { ensureUser, isActive } = require('../services/communityVerification');
const { buildPersonalizedFeed } = require('../services/personalizationEngine');
const { registerPushToken } = require('../services/pushNotifications');

exports.savePreferences = (req, res) => {
  const { userId, preferences } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = ensureUser(userId);
  if (preferences?.followedCategories) user.followedCategories = preferences.followedCategories;
  if (preferences?.notificationPrefs) user.notificationPrefs = preferences.notificationPrefs;
  if (preferences?.preferenceProfile) user.preferenceProfile = preferences.preferenceProfile;
  if (typeof preferences?.isPro === 'boolean') user.isPro = preferences.isPro;
  persist();

  res.json({ user });
};

exports.getFeed = (req, res) => {
  const { userId } = req.query;
  const user = userId ? state.users[userId] : null;
  const activeDeals = state.deals.filter(isActive).sort((a, b) => b.qualityScore - a.qualityScore);
  const feed = user ? buildPersonalizedFeed(activeDeals, user) : activeDeals;
  res.json({ deals: feed, personalized: Boolean(user?.preferenceProfile) });
};

exports.registerPushToken = async (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) return res.status(400).json({ error: 'userId and token are required' });
  await registerPushToken(userId, token);
  res.json({ ok: true });
};
