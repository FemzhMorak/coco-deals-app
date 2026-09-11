const { state, persist } = require('../config/db');
const { rescoreAllDeals } = require('./scoringEngine');

const EXPIRED_FLAG_THRESHOLD = 3;
const STILL_WORKS_VERIFIED_THRESHOLD = 10;
const TRUSTED_VERIFIER_MIN_REPORTS = 5;
const TRUSTED_VERIFIER_MIN_ACCURACY = 0.8;

function ensureUser(userId) {
  if (!state.users[userId]) {
    state.users[userId] = {
      id: userId,
      followedCategories: [],
      notificationPrefs: {},
      dealOpens: 0,
      correctVerifications: 0,
      incorrectVerifications: 0,
      trustedVerifier: false,
    };
  }
  return state.users[userId];
}

function vote(dealId, userId, direction) {
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return null;

  state.votes ||= {};
  state.votes[dealId] ||= {};
  const previous = state.votes[dealId][userId];
  if (previous === direction) return deal; // no-op, already voted this way

  if (previous === 'up') deal.upvotes = Math.max(0, deal.upvotes - 1);
  if (previous === 'down') deal.downvotes = Math.max(0, deal.downvotes - 1);
  if (direction === 'up') deal.upvotes += 1;
  else deal.downvotes += 1;

  state.votes[dealId][userId] = direction;
  persist();
  return deal;
}

// Records a "still_works" / "expired" report, applies the auto-flag /
// community-verified thresholds, and updates the reporting user's
// verification-accuracy track record (feeds the "Trusted Verifier" badge).
function verify(dealId, userId, status) {
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return null;

  state.verifications ||= {};
  state.verifications[dealId] ||= {};
  const previous = state.verifications[dealId][userId];
  if (previous === status) return deal;

  if (previous === 'still_works') deal.stillWorksCount = Math.max(0, deal.stillWorksCount - 1);
  if (previous === 'expired') deal.expiredCount = Math.max(0, deal.expiredCount - 1);

  const wasFlagged = deal.expiredCount >= EXPIRED_FLAG_THRESHOLD;

  if (status === 'still_works') deal.stillWorksCount += 1;
  else deal.expiredCount += 1;

  state.verifications[dealId][userId] = status;

  deal.isVerified = deal.stillWorksCount >= STILL_WORKS_VERIFIED_THRESHOLD;

  const isNowFlagged = deal.expiredCount >= EXPIRED_FLAG_THRESHOLD;
  if (!wasFlagged && isNowFlagged) {
    // Deal just got auto-flagged: reward users who correctly called it
    // expired, and penalise those who had marked it "still works".
    for (const [reporterId, reportedStatus] of Object.entries(state.verifications[dealId])) {
      const user = ensureUser(reporterId);
      if (reportedStatus === 'expired') user.correctVerifications += 1;
      else if (reportedStatus === 'still_works') user.incorrectVerifications += 1;
      const total = user.correctVerifications + user.incorrectVerifications;
      user.trustedVerifier =
        total >= TRUSTED_VERIFIER_MIN_REPORTS &&
        user.correctVerifications / total >= TRUSTED_VERIFIER_MIN_ACCURACY;
    }
  }

  rescoreAllDeals(state.deals);
  persist();
  return deal;
}

function isActive(deal) {
  return deal.expiredCount < EXPIRED_FLAG_THRESHOLD;
}

module.exports = { vote, verify, isActive, ensureUser, EXPIRED_FLAG_THRESHOLD };
