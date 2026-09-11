// AI source discovery agent: searches the web for new Nigerian deal
// sources, checks whether they're already known, and uses Claude to judge
// whether each new domain looks like a legitimate brand worth crawling.
const crypto = require('crypto');
const { state, persist } = require('../src/config/db');
const { SOURCE_CATEGORIES } = require('../src/utils/categoryMap');
const { search } = require('./search');
const { evaluateSource } = require('./evaluate');

const AUTO_ADD_THRESHOLD = 70;
const REVIEW_THRESHOLD = 50; // 50–70 → queued for manual review

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City'];

function dayIndex() {
  return Math.floor(Date.now() / 86400000);
}

// Rotates through the query templates day to day so the agent doesn't
// re-run the exact same five searches every time it fires.
function buildQueries() {
  const day = dayIndex();
  const category = SOURCE_CATEGORIES[day % SOURCE_CATEGORIES.length];
  const category2 = SOURCE_CATEGORIES[(day + 3) % SOURCE_CATEGORIES.length];
  const city = CITIES[day % CITIES.length];
  const brands = state.sources.map((s) => s.name);
  const brand = brands.length > 0 ? brands[day % brands.length] : 'Nigerian retail';

  return [
    { query: `Nigeria ${category} promo 2025`, context: category },
    { query: `Nigeria ${brand} discount site:instagram.com`, context: category },
    { query: `${city} mall deals Nigeria`, context: 'Malls' },
    { query: `Nigerian ${category2} store promotion`, context: category2 },
    { query: `new Nigerian ${category} brand`, context: category },
  ];
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function isKnownDomain(hostname) {
  const known = new Set([
    ...state.sources.map((s) => hostnameOf(s.url)),
    ...state.pendingSources.map((s) => hostnameOf(s.url)),
  ]);
  return known.has(hostname);
}

// Matches Claude's free-text category guess back to one of our 8 fixed
// source categories; falls back to the category we were searching within.
function resolveCategory(claudeCategory, fallback) {
  if (!claudeCategory) return fallback;
  const match = SOURCE_CATEGORIES.find(
    (c) => c.toLowerCase() === claudeCategory.toLowerCase() || claudeCategory.toLowerCase().includes(c.toLowerCase())
  );
  return match ?? fallback;
}

async function runDiscoveryAgent() {
  const startedAt = Date.now();
  const queries = buildQueries();
  const evaluated = [];
  let added = 0;
  let pending = 0;
  let rejected = 0;
  let newDomainsChecked = 0;

  for (const { query, context } of queries) {
    const results = await search(query);
    for (const result of results) {
      const hostname = hostnameOf(result.url);
      if (!hostname || isKnownDomain(hostname)) continue;
      newDomainsChecked += 1;

      const verdict = await evaluateSource(result.url);
      if (!verdict) {
        evaluated.push({ url: result.url, query, decision: 'evaluation_failed' });
        continue;
      }

      const category = resolveCategory(verdict.category, context);
      const name = verdict.brandName || result.title || hostname;

      if (verdict.isLegitimate && verdict.confidence >= AUTO_ADD_THRESHOLD) {
        state.sources.push({
          id: crypto.randomUUID(),
          name,
          category,
          type: 'website',
          url: result.url,
          active: true,
          createdAt: new Date().toISOString(),
          lastCrawled: null,
          dealsFound: 0,
          successRate: 0,
          addedBy: 'agent',
          notes: `Discovered via query: "${query}" (confidence ${verdict.confidence})`,
          totalCrawls: 0,
          successfulCrawls: 0,
        });
        added += 1;
        evaluated.push({ url: result.url, query, brandName: name, category, confidence: verdict.confidence, isLegitimate: true, decision: 'added' });
      } else if (verdict.confidence >= REVIEW_THRESHOLD) {
        state.pendingSources.push({
          id: crypto.randomUUID(),
          name,
          category,
          type: 'website',
          url: result.url,
          confidence: verdict.confidence,
          discoveredAt: new Date().toISOString(),
          query,
          status: 'pending',
        });
        pending += 1;
        evaluated.push({ url: result.url, query, brandName: name, category, confidence: verdict.confidence, isLegitimate: verdict.isLegitimate, decision: 'pending' });
      } else {
        rejected += 1;
        evaluated.push({ url: result.url, query, brandName: name, category, confidence: verdict.confidence, isLegitimate: verdict.isLegitimate, decision: 'rejected' });
      }
    }
  }

  const logEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    queries: queries.map((q) => q.query),
    newDomainsChecked,
    evaluated,
    added,
    pending,
    rejected,
    durationMs: Date.now() - startedAt,
  };
  state.agentLogs.unshift(logEntry);
  state.agentLogs = state.agentLogs.slice(0, 200);
  persist();

  return logEntry;
}

// Moves a pending source into the live sources list (or drops it).
function approvePendingSource(id) {
  const idx = state.pendingSources.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const [pendingSource] = state.pendingSources.splice(idx, 1);
  const source = {
    id: pendingSource.id,
    name: pendingSource.name,
    category: pendingSource.category,
    type: pendingSource.type,
    url: pendingSource.url,
    active: true,
    createdAt: new Date().toISOString(),
    lastCrawled: null,
    dealsFound: 0,
    successRate: 0,
    addedBy: 'agent',
    notes: `Approved from agent discovery (confidence ${pendingSource.confidence})`,
    totalCrawls: 0,
    successfulCrawls: 0,
  };
  state.sources.push(source);
  persist();
  return source;
}

function rejectPendingSource(id) {
  const idx = state.pendingSources.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  state.pendingSources.splice(idx, 1);
  persist();
  return true;
}

module.exports = { runDiscoveryAgent, approvePendingSource, rejectPendingSource, buildQueries };
