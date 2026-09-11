// The React Native app (frontend) ships with a FIXED category taxonomy
// baked into its UI (category tabs, Profile follow-toggles, notification
// prefs): telecoms, food, supermarkets, electronics, fashion, banks,
// transport, entertainment. The frontend is explicitly out of scope for
// this rebuild, so it can't learn new category keys.
//
// The new source-management system (Part 1) instead organises crawl
// sources under a business-facing taxonomy: Electronics, Malls, Cinemas,
// Cars, Fuel, Health, Events, Fintech. Sources keep that taxonomy verbatim
// (visible throughout the admin dashboard), but any deal produced from one
// of those sources needs a frontend-compatible `category` so the existing
// app keeps working untouched. This map bridges the two — deals store
// both: `category` (frontend-compatible, used by the public API) and
// `sourceCategory` (the original Part 1 taxonomy, used by the admin
// dashboard and preserved for traceability).
const SOURCE_CATEGORIES = ['Electronics', 'Malls', 'Cinemas', 'Cars', 'Fuel', 'Health', 'Events', 'Fintech'];

const SOURCE_TO_DEAL_CATEGORY = {
  Electronics: 'electronics',
  Malls: 'supermarkets', // general retail/shopping — closest existing fit
  Cinemas: 'entertainment',
  Cars: 'transport',
  Fuel: 'transport',
  Health: 'supermarkets', // pharmacy/retail chains
  Events: 'entertainment',
  Fintech: 'banks',
};

function toDealCategory(sourceCategory) {
  return SOURCE_TO_DEAL_CATEGORY[sourceCategory] ?? 'more';
}

module.exports = { SOURCE_CATEGORIES, SOURCE_TO_DEAL_CATEGORY, toDealCategory };
