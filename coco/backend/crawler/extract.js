// Extraction heuristics shared between the in-browser candidate scan (run
// via page.evaluate, see index.js) and Node-side post-processing.

// ₦ followed by a number, optionally with thousands separators/decimals.
const PRICE_REGEX_SOURCE = '\\u20A6\\s?[\\d,]+(?:\\.\\d+)?';

const DISCOUNT_KEYWORDS = [
  'off',
  'promo',
  'promotion',
  'deal',
  'save',
  'discount',
  'free',
  'bonus',
  'limited',
  'sale',
  'offer',
];

const MONTHS =
  '(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)';

// A handful of common "expires on / valid until ..." phrasings seen on
// Nigerian retail/promo pages. Best-effort — most pages don't state an
// exact expiry, in which case the caller falls back to a default window.
const DATE_PATTERNS = [
  // "until 25/12/2025", "till 25-12-25", "expires 25/12/2025"
  /(?:until|till|valid\s+till|valid\s+until|expires?|ends?)\s*:?\s*([0-3]?\d[\/\-][01]?\d[\/\-]\d{2,4})/i,
  // "until 25 December 2025", "expires 25 Dec"
  new RegExp(`(?:until|till|valid\\s+till|valid\\s+until|expires?|ends?)\\s*:?\\s*(\\d{1,2}\\s+${MONTHS}\\.?\\s*\\d{0,4})`, 'i'),
  // "December 25, 2025"
  new RegExp(`(${MONTHS}\\.?\\s+\\d{1,2},?\\s*\\d{0,4})`, 'i'),
];

function parsePriceToken(token) {
  const match = token.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Parses a raw date-ish snippet found near a deal candidate into an ISO
// string. Returns null if it can't confidently parse it (caller applies a
// default expiry window in that case rather than guessing).
function parseDateFromText(text) {
  if (!text) return null;
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const candidate = match[1] ?? match[0];
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      // Reject implausible parses (e.g. way in the past, or >2 years out).
      const now = Date.now();
      const twoYears = 2 * 365 * 24 * 3600 * 1000;
      if (parsed.getTime() > now - 24 * 3600 * 1000 && parsed.getTime() < now + twoYears) {
        return parsed.toISOString();
      }
    }
  }
  return null;
}

function defaultExpiry(hours = 72) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

module.exports = {
  PRICE_REGEX_SOURCE,
  DISCOUNT_KEYWORDS,
  parsePriceToken,
  parseDateFromText,
  defaultExpiry,
};
