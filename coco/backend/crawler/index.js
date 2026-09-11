// The intelligent crawler: loads each active source with a real headless
// browser (most Nigerian retail/promo sites are JS-rendered, so a plain
// HTML fetch misses their content), scans the rendered DOM for deal-shaped
// blocks (a ₦ price next to a discount keyword), and upserts what it finds
// into backend/data/deals.json.
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const { state, persist } = require('../src/config/db');
const { rescoreAllDeals } = require('../src/services/scoringEngine');
const { notifyNewDeal } = require('../src/services/pushNotifications');
const { toDealCategory } = require('../src/utils/categoryMap');
const { PRICE_REGEX_SOURCE, DISCOUNT_KEYWORDS, parsePriceToken, parseDateFromText, defaultExpiry } = require('./extract');

const MAX_CANDIDATES_PER_SOURCE = 8;
const PAGE_TIMEOUT_MS = 25000;
const PUSH_QUALITY_THRESHOLD = Number(process.env.PUSH_QUALITY_THRESHOLD) || 70;

const CATEGORY_EMOJI = {
  Electronics: '📱',
  Malls: '🛍️',
  Cinemas: '🎬',
  Cars: '🚗',
  Fuel: '⛽',
  Health: '💊',
  Events: '🎟️',
  Fintech: '💳',
};

// Runs entirely inside the page — must not close over any Node scope.
// Scans broad block-level elements for text that contains BOTH a ₦ price
// and a discount-ish keyword, which is a much stronger signal than price
// alone that the block is an actual promo, not just a product listing.
function browserExtract(priceRegexSource, keywords, maxCandidates) {
  const priceRegex = new RegExp(priceRegexSource, 'g');
  const nodes = Array.from(document.querySelectorAll('div,li,article,section,a'));

  const matches = [];
  for (const el of nodes) {
    const text = (el.innerText || '').trim();
    if (!text || text.length > 600) continue;

    const priceMatches = text.match(priceRegex);
    if (!priceMatches || priceMatches.length === 0) continue;

    const lower = text.toLowerCase();
    if (!keywords.some((k) => lower.includes(k))) continue;

    matches.push({ el, text, priceMatches });
  }

  // A single promo card matches at every wrapping <div>/<section> too
  // (innerText includes descendant text), so without this every card would
  // be captured once per ancestor. Keep only the innermost match — drop any
  // block that contains another matching block inside it.
  const leafMatches = matches.filter(
    (m, i) => !matches.some((other, j) => i !== j && m.el !== other.el && m.el.contains(other.el))
  );

  const seen = new Set();
  const results = [];
  for (const { el, text, priceMatches } of leafMatches) {
    if (results.length >= maxCandidates) break;

    const key = text.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);

    const img = el.querySelector('img');
    const imageUrl = img ? img.currentSrc || img.getAttribute('src') : null;
    const link = el.tagName === 'A' ? el : el.querySelector('a');
    const dealUrl = link && link.href ? link.href : location.href;
    const title = text.replace(priceRegex, '').replace(/\s+/g, ' ').trim().slice(0, 140);
    if (title.length < 8) continue;

    results.push({ title, priceTexts: priceMatches, imageUrl, dealUrl, rawText: text.slice(0, 300) });
  }

  return results;
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

// Crawls one source and returns { candidates, error }. Never throws — a
// failing source shouldn't abort the whole run.
async function fetchCandidates(browser, source) {
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (compatible; CocoDealsBot/1.0; +https://coco.app/bot) AppleWebKit/537.36'
    );
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(source.url, { waitUntil: 'networkidle2', timeout: PAGE_TIMEOUT_MS });
    const candidates = await page.evaluate(
      browserExtract,
      PRICE_REGEX_SOURCE,
      DISCOUNT_KEYWORDS,
      MAX_CANDIDATES_PER_SOURCE
    );
    return { candidates, error: null };
  } catch (err) {
    return { candidates: [], error: err.message };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

function nextDealId() {
  const maxNum = state.deals.reduce((max, d) => {
    const n = Number(String(d.id).replace(/\D/g, '')) || 0;
    return Math.max(max, n);
  }, 0);
  return `d${maxNum + 1}`;
}

// Upserts one extracted candidate into state.deals: appends to an existing
// deal's price history if the same source+title deal already exists,
// otherwise creates a brand-new deal. Returns { deal, isNew }.
function upsertCandidate(source, candidate) {
  const prices = candidate.priceTexts.map(parsePriceToken).filter((n) => n != null);
  if (prices.length === 0) return null;
  const dealPrice = Math.min(...prices);
  const originalPrice = prices.length > 1 ? Math.max(...prices) : null;

  const existing = state.deals.find((d) => d.sourceId === source.id && d.title === candidate.title);
  const now = new Date().toISOString();

  if (existing) {
    if (existing.dealPrice !== dealPrice) {
      existing.priceHistory.push({ price: dealPrice, date: now });
      existing.dealPrice = dealPrice;
      if (originalPrice) existing.originalPrice = originalPrice;
      if (originalPrice && dealPrice) {
        existing.savingsPercent = Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
      }
    }
    return { deal: existing, isNew: false };
  }

  const savingsPercent =
    originalPrice && originalPrice > 0 ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100) : null;
  const expiryDate = parseDateFromText(candidate.rawText) ?? defaultExpiry(72);

  const deal = {
    id: nextDealId(),
    brand: source.name,
    brandLogo: CATEGORY_EMOJI[source.category] ?? '🏷️',
    title: candidate.title,
    description: candidate.title,
    category: toDealCategory(source.category),
    sourceCategory: source.category,
    sourceId: source.id,
    imageUrl: candidate.imageUrl || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
    dealUrl: candidate.dealUrl || source.url,
    originalPrice,
    dealPrice,
    savingsPercent,
    expiryDate,
    createdAt: now,
    qualityScore: 50,
    priceHistory: [{ price: dealPrice, date: now }],
    upvotes: 0,
    downvotes: 0,
    stillWorksCount: 0,
    expiredCount: 0,
    isVerified: false,
  };
  state.deals.push(deal);
  return { deal, isNew: true };
}

function logCrawl(entry) {
  state.crawlLogs.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...entry });
  state.crawlLogs = state.crawlLogs.slice(0, 500);
}

async function crawlOneSource(browser, source) {
  const startedAt = Date.now();
  const { candidates, error } = await fetchCandidates(browser, source);
  const durationMs = Date.now() - startedAt;

  const results = [];
  if (!error) {
    for (const candidate of candidates) {
      const result = upsertCandidate(source, candidate);
      if (result) results.push(result);
    }
  }

  source.totalCrawls = (source.totalCrawls || 0) + 1;
  const dealsFoundThisRun = results.length;
  if (error) {
    source.successRate = Math.round(((source.successfulCrawls || 0) / source.totalCrawls) * 100);
  } else {
    if (dealsFoundThisRun > 0) source.successfulCrawls = (source.successfulCrawls || 0) + 1;
    source.successRate = Math.round(((source.successfulCrawls || 0) / source.totalCrawls) * 100);
    source.dealsFound = (source.dealsFound || 0) + results.filter((r) => r.isNew).length;
  }
  source.lastCrawled = new Date().toISOString();

  logCrawl({
    sourceId: source.id,
    sourceName: source.name,
    status: error ? 'error' : dealsFoundThisRun > 0 ? 'success' : 'no_deals',
    dealsFound: dealsFoundThisRun,
    newDeals: results.filter((r) => r.isNew).length,
    errorMessage: error,
    durationMs,
  });

  return { results, error };
}

// Crawls every active source once. Safe to call directly (e.g. from the
// admin "Trigger Manual Crawl Now" button) or from the node-cron schedule.
async function runCrawler() {
  const activeSources = state.sources.filter((s) => s.active);
  if (activeSources.length === 0) {
    return { sourcesProcessed: 0, newDeals: 0, errors: 0 };
  }

  let browser;
  const allResults = [];
  let errors = 0;
  try {
    browser = await launchBrowser();
    for (const source of activeSources) {
      const { results, error } = await crawlOneSource(browser, source);
      allResults.push(...results);
      if (error) errors += 1;
    }
  } catch (err) {
    console.error('[crawler] fatal error launching browser:', err.message);
    errors += 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  rescoreAllDeals(state.deals);
  persist();

  const newDeals = allResults.filter((r) => r.isNew);
  for (const { deal } of newDeals) {
    if (deal.qualityScore >= PUSH_QUALITY_THRESHOLD) {
      await notifyNewDeal(deal).catch(() => {});
    }
  }

  return { sourcesProcessed: activeSources.length, newDeals: newDeals.length, errors };
}

module.exports = { runCrawler, crawlOneSource, launchBrowser };
