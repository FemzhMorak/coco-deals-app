// JSON-file-backed store — no external database required. Each collection
// lives in its own file under backend/data/ (so the admin dashboard, the
// crawler, and the discovery agent can all read/write plain JSON), held in
// memory and flushed to disk on a short debounce after every write.
const fs = require('fs');
const path = require('path');
const { seedDeals } = require('../seed/deals');
const { seedSources } = require('../seed/sources');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const FILES = {
  sources: path.join(DATA_DIR, 'sources.json'),
  deals: path.join(DATA_DIR, 'deals.json'),
  users: path.join(DATA_DIR, 'users.json'),
  interactions: path.join(DATA_DIR, 'interactions.json'),
  crawlLogs: path.join(DATA_DIR, 'crawl-logs.json'),
  agentLogs: path.join(DATA_DIR, 'agent-logs.json'),
  pendingSources: path.join(DATA_DIR, 'pending-sources.json'),
};

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function loadState() {
  const sources = readJSON(FILES.sources, null) ?? seedSources();
  const deals = readJSON(FILES.deals, null) ?? seedDeals();
  const users = readJSON(FILES.users, {});
  const interactions = readJSON(FILES.interactions, { votes: {}, verifications: {} });
  const crawlLogs = readJSON(FILES.crawlLogs, []);
  const agentLogs = readJSON(FILES.agentLogs, []);
  const pendingSources = readJSON(FILES.pendingSources, []);

  return {
    sources,
    deals,
    users,
    votes: interactions.votes ?? {},
    verifications: interactions.verifications ?? {},
    crawlLogs,
    agentLogs,
    pendingSources,
  };
}

const state = loadState();

const timers = {};
const pendingWrites = {};

function debouncedWrite(key, file, getData) {
  pendingWrites[key] = { file, getData };
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => flushOne(key), 200);
}

function flushOne(key) {
  const pending = pendingWrites[key];
  if (!pending) return;
  clearTimeout(timers[key]);
  delete pendingWrites[key];
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(pending.file, JSON.stringify(pending.getData(), null, 2));
}

// Flushes every collection. Cheap enough at this scale (a handful of small
// JSON files) to always write all of them rather than track per-key dirty
// flags — callers just call persist() after any mutation, as before.
function persist() {
  debouncedWrite('sources', FILES.sources, () => state.sources);
  debouncedWrite('deals', FILES.deals, () => state.deals);
  debouncedWrite('users', FILES.users, () => state.users);
  debouncedWrite('interactions', FILES.interactions, () => ({
    votes: state.votes,
    verifications: state.verifications,
  }));
  debouncedWrite('crawlLogs', FILES.crawlLogs, () => state.crawlLogs);
  debouncedWrite('agentLogs', FILES.agentLogs, () => state.agentLogs);
  debouncedWrite('pendingSources', FILES.pendingSources, () => state.pendingSources);
}

// Writes every pending change to disk immediately, bypassing the debounce.
// Short-lived CLI scripts (crawler/runOnce.js, agent/runOnce.js) must call
// this before process.exit() — otherwise the debounce timer never fires
// and the run's results are silently lost.
function flush() {
  for (const key of Object.keys(pendingWrites)) flushOne(key);
}

process.on('beforeExit', flush);

module.exports = { state, persist, flush, DATA_DIR, FILES };
