// Brand reliability = weighted mix of:
//  - % of a brand's deals that are genuine discounts (originalPrice > dealPrice)
//  - % of "still works" vs "expired" community reports across the brand's deals
//  - the brand's average deal quality score
// Returns an integer 0-100. Deal-quality-score based feedback loop is fine
// here since we always compute this from the *previous* quality score
// snapshot on each deal (updated once per scoring pass).
function computeBrandReliability(brandDeals) {
  if (!brandDeals || brandDeals.length === 0) return 60; // neutral default for unknown brands

  const genuineCount = brandDeals.filter(
    (d) => d.originalPrice != null && d.dealPrice != null && d.originalPrice > d.dealPrice
  ).length;
  const genuinePct = brandDeals.length ? genuineCount / brandDeals.length : 0.7;

  const totalStill = brandDeals.reduce((s, d) => s + (d.stillWorksCount || 0), 0);
  const totalExpired = brandDeals.reduce((s, d) => s + (d.expiredCount || 0), 0);
  const workedPct = totalStill + totalExpired > 0 ? totalStill / (totalStill + totalExpired) : 0.7;

  const avgQuality =
    brandDeals.reduce((s, d) => s + (d.qualityScore || 50), 0) / brandDeals.length / 100;

  const score = genuinePct * 40 + workedPct * 30 + avgQuality * 30;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function brandReliabilityMap(allDeals) {
  const byBrand = {};
  for (const deal of allDeals) {
    (byBrand[deal.brand] ||= []).push(deal);
  }
  const map = {};
  for (const [brand, deals] of Object.entries(byBrand)) {
    map[brand] = computeBrandReliability(deals);
  }
  return map;
}

module.exports = { computeBrandReliability, brandReliabilityMap };
