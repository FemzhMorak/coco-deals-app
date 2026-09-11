const { brandReliabilityMap } = require('./brandReliability');

function average(nums) {
  if (!nums.length) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function priceHistoryWithinDays(priceHistory, days) {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  return priceHistory.filter((p) => new Date(p.date).getTime() >= cutoff).map((p) => p.price);
}

// Maps "% cheaper than average" to a 0-100 sub-score. 35% cheaper or more
// scores full marks; 0% or more expensive scores 0.
function cheapnessScore(avgPrice, dealPrice) {
  if (avgPrice == null || dealPrice == null || avgPrice <= 0) return 60; // insufficient data → neutral
  const pctCheaper = ((avgPrice - dealPrice) / avgPrice) * 100;
  return Math.max(0, Math.min(100, (pctCheaper / 35) * 100));
}

/**
 * Quality score (0-100):
 *   40% — cheaper than the 30-day average price
 *   30% — cheaper than the 90-day average price
 *   20% — community verification ratio (still-works vs expired)
 *   10% — brand reliability score
 */
function calculateQualityScore(deal, brandReliability) {
  const avg30 = average(priceHistoryWithinDays(deal.priceHistory || [], 30));
  const avg90 = average(priceHistoryWithinDays(deal.priceHistory || [], 90));

  const score30 = cheapnessScore(avg30, deal.dealPrice);
  const score90 = cheapnessScore(avg90 ?? avg30, deal.dealPrice);

  const totalVerifications = (deal.stillWorksCount || 0) + (deal.expiredCount || 0);
  const verificationRatio = totalVerifications > 0 ? deal.stillWorksCount / totalVerifications : 0.7;
  const verificationScore = verificationRatio * 100;

  const weighted =
    score30 * 0.4 + score90 * 0.3 + verificationScore * 0.2 + (brandReliability ?? 60) * 0.1;

  return Math.round(Math.max(0, Math.min(100, weighted)));
}

// Recomputes brand reliability and quality score for every deal in place.
function rescoreAllDeals(deals) {
  const reliabilityByBrand = brandReliabilityMap(deals);
  for (const deal of deals) {
    const brandReliability = reliabilityByBrand[deal.brand];
    deal.brandReliability = brandReliability;
    deal.qualityScore = calculateQualityScore(deal, brandReliability);
    deal.isVerified = deal.stillWorksCount >= 10 ? true : deal.isVerified;
  }
  return deals;
}

module.exports = { calculateQualityScore, rescoreAllDeals };
