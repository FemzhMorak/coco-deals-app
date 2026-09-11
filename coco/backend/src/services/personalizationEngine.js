// Builds a personalised feed ordering from a user's stored preference
// profile (favourite categories/brands, derived on the client from opened/
// saved/grabbed deals and synced via POST /api/user/preferences).
function buildPersonalizedFeed(deals, user) {
  const profile = user?.preferenceProfile;
  const topCategories = profile?.topCategories ?? [];
  const topBrands = profile?.topBrands ?? [];

  if (topCategories.length === 0 && topBrands.length === 0) {
    return [...deals].sort((a, b) => b.qualityScore - a.qualityScore);
  }

  const scored = deals.map((deal) => {
    let affinity = 0;
    const categoryRank = topCategories.indexOf(deal.category);
    if (categoryRank !== -1) affinity += (topCategories.length - categoryRank) * 3;
    const brandRank = topBrands.indexOf(deal.brand);
    if (brandRank !== -1) affinity += (topBrands.length - brandRank) * 2;
    return { deal, affinity };
  });

  scored.sort((a, b) => b.affinity - a.affinity || b.deal.qualityScore - a.deal.qualityScore);
  return scored.map((s) => s.deal);
}

module.exports = { buildPersonalizedFeed };
