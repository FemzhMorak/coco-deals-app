// Client-side approximation of the backend's brand reliability score, used
// when a deal doesn't already carry a `brandReliability` value from the API.
// Backend formula (see backend/src/services/brandReliability.js): weighted
// mix of % genuine discounts, % "still works" vs "expired" reports, and
// average quality score for that brand.
export function computeBrandReliability(deals, brand) {
  const brandDeals = deals.filter((d) => d.brand === brand);
  if (brandDeals.length === 0) return null;

  const verifiedRatio = brandDeals.filter((d) => d.isVerified).length / brandDeals.length;
  const avgQuality = brandDeals.reduce((sum, d) => sum + (d.qualityScore || 0), 0) / brandDeals.length;
  const totalStill = brandDeals.reduce((sum, d) => sum + (d.stillWorksCount || 0), 0);
  const totalExpired = brandDeals.reduce((sum, d) => sum + (d.expiredCount || 0), 0);
  const workRatio = totalStill + totalExpired > 0 ? totalStill / (totalStill + totalExpired) : 0.7;

  const score = verifiedRatio * 40 + (avgQuality / 100) * 30 + workRatio * 30;
  return Math.round(score);
}
