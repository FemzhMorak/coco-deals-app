const { state } = require('../config/db');
const communityVerification = require('../services/communityVerification');
const { isActive } = communityVerification;

function activeDealsSortedByQuality() {
  return state.deals.filter(isActive).sort((a, b) => b.qualityScore - a.qualityScore);
}

exports.listDeals = (req, res) => {
  res.json({ deals: activeDealsSortedByQuality() });
};

exports.listByCategory = (req, res) => {
  const { category } = req.params;
  const deals =
    category === 'all'
      ? activeDealsSortedByQuality()
      : activeDealsSortedByQuality().filter((d) => d.category === category);
  res.json({ deals });
};

exports.getById = (req, res) => {
  const deal = state.deals.find((d) => d.id === req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json({ deal });
};

exports.trending = (req, res) => {
  const oneDayAgo = Date.now() - 24 * 3600 * 1000;
  const deals = activeDealsSortedByQuality()
    .filter((d) => new Date(d.createdAt).getTime() >= oneDayAgo || d.upvotes > 0)
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 15);
  res.json({ deals });
};

exports.expiring = (req, res) => {
  const now = Date.now();
  const sixHours = 6 * 3600 * 1000;
  const deals = activeDealsSortedByQuality().filter((d) => {
    const diff = new Date(d.expiryDate).getTime() - now;
    return diff > 0 && diff <= sixHours;
  });
  res.json({ deals });
};

exports.upvote = (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const deal = communityVerification.vote(req.params.id, userId, 'up');
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json({ deal });
};

exports.downvote = (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const deal = communityVerification.vote(req.params.id, userId, 'down');
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json({ deal });
};

exports.verify = (req, res) => {
  const { userId, status } = req.body;
  if (!userId || !['still_works', 'expired'].includes(status)) {
    return res.status(400).json({ error: 'userId and status ("still_works" | "expired") are required' });
  }
  const deal = communityVerification.verify(req.params.id, userId, status);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json({ deal });
};
