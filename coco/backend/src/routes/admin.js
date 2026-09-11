const crypto = require('crypto');
const express = require('express');
const { state, persist } = require('../config/db');
const { scheduleState, markCrawlRan, markAgentRan } = require('../config/schedule');
const auth = require('../middleware/adminAuth');
const { isActive } = require('../services/communityVerification');
const { rescoreAllDeals } = require('../services/scoringEngine');
const { SOURCE_CATEGORIES } = require('../utils/categoryMap');
const { runCrawler } = require('../../crawler');
const { runDiscoveryAgent, approvePendingSource, rejectPendingSource } = require('../../agent/discover');

const router = express.Router();

// ---------------------------------------------------------------- auth ---
router.post('/login', (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured on the server (.env)' });
  }
  const { password } = req.body || {};
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = auth.createSession();
  res.cookie(auth.SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: auth.SESSION_TTL_MS,
  });
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  auth.destroy(req.cookies?.[auth.SESSION_COOKIE]);
  res.clearCookie(auth.SESSION_COOKIE);
  res.json({ ok: true });
});

// Everything below requires a valid admin session.
router.use(auth.requireSession);

router.get('/session', (req, res) => res.json({ ok: true }));

// ----------------------------------------------------------- dashboard ---
router.get('/dashboard', (req, res) => {
  const activeDeals = state.deals.filter(isActive);
  const oneDayAgo = Date.now() - 24 * 3600 * 1000;
  const dealsToday = state.deals.filter((d) => new Date(d.createdAt).getTime() >= oneDayAgo).length;

  const latestLogBySource = {};
  for (const log of state.crawlLogs) {
    if (!latestLogBySource[log.sourceId]) latestLogBySource[log.sourceId] = log;
  }
  const sourceHealth = state.sources.map((s) => {
    const log = latestLogBySource[s.id];
    return {
      id: s.id,
      name: s.name,
      active: s.active,
      status: !s.active ? 'inactive' : log ? log.status : 'never_crawled',
    };
  });

  res.json({
    totalSources: state.sources.length,
    activeSources: state.sources.filter((s) => s.active).length,
    totalActiveDeals: activeDeals.length,
    dealsFoundToday: dealsToday,
    lastCrawlAt: scheduleState.lastCrawlAt,
    nextCrawlAt: scheduleState.nextCrawlAt,
    lastAgentAt: scheduleState.lastAgentAt,
    nextAgentAt: scheduleState.nextAgentAt,
    sourceHealth,
    pendingSourcesCount: state.pendingSources.length,
  });
});

router.post('/crawl-now', async (req, res) => {
  try {
    const result = await runCrawler();
    markCrawlRan();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/agent-run-now', async (req, res) => {
  try {
    const result = await runDiscoveryAgent();
    markAgentRan();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------- sources ---
router.get('/sources', (req, res) => {
  const { category, addedBy } = req.query;
  let list = state.sources;
  if (category) list = list.filter((s) => s.category === category);
  if (addedBy) list = list.filter((s) => s.addedBy === addedBy);
  res.json({ sources: list, categories: SOURCE_CATEGORIES });
});

router.post('/sources', (req, res) => {
  const { name, category, type, url, notes } = req.body || {};
  if (!name || !category || !type || !url) {
    return res.status(400).json({ error: 'name, category, type, and url are required' });
  }
  if (!SOURCE_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${SOURCE_CATEGORIES.join(', ')}` });
  }
  const source = {
    id: crypto.randomUUID(),
    name,
    category,
    type,
    url,
    active: true,
    createdAt: new Date().toISOString(),
    lastCrawled: null,
    dealsFound: 0,
    successRate: 0,
    addedBy: 'manual',
    notes: notes || '',
    totalCrawls: 0,
    successfulCrawls: 0,
  };
  state.sources.push(source);
  persist();
  res.status(201).json({ source });
});

router.patch('/sources/:id', (req, res) => {
  const source = state.sources.find((s) => s.id === req.params.id);
  if (!source) return res.status(404).json({ error: 'Source not found' });

  const { name, category, type, url, notes, active } = req.body || {};
  if (name !== undefined) source.name = name;
  if (category !== undefined) {
    if (!SOURCE_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${SOURCE_CATEGORIES.join(', ')}` });
    }
    source.category = category;
  }
  if (type !== undefined) source.type = type;
  if (url !== undefined) source.url = url;
  if (notes !== undefined) source.notes = notes;
  if (active !== undefined) source.active = Boolean(active);
  persist();
  res.json({ source });
});

router.delete('/sources/:id', (req, res) => {
  const idx = state.sources.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Source not found' });
  state.sources.splice(idx, 1);
  persist();
  res.json({ ok: true });
});

// --------------------------------------------------------------- deals ---
router.get('/deals', (req, res) => {
  const { category, minScore, maxScore, expiringOnly } = req.query;
  let list = [...state.deals].sort((a, b) => b.qualityScore - a.qualityScore);
  if (category) list = list.filter((d) => d.category === category);
  if (minScore) list = list.filter((d) => d.qualityScore >= Number(minScore));
  if (maxScore) list = list.filter((d) => d.qualityScore <= Number(maxScore));
  if (expiringOnly === 'true') {
    const sixHours = 6 * 3600 * 1000;
    const now = Date.now();
    list = list.filter((d) => {
      const diff = new Date(d.expiryDate).getTime() - now;
      return diff > 0 && diff <= sixHours;
    });
  }
  res.json({ deals: list });
});

router.delete('/deals/:id', (req, res) => {
  const idx = state.deals.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Deal not found' });
  state.deals.splice(idx, 1);
  persist();
  res.json({ ok: true });
});

router.post('/deals/clear-expired', (req, res) => {
  const now = Date.now();
  const before = state.deals.length;
  state.deals = state.deals.filter((d) => new Date(d.expiryDate).getTime() > now);
  rescoreAllDeals(state.deals);
  persist();
  res.json({ ok: true, removed: before - state.deals.length });
});

// -------------------------------------------------------------- logs -----
router.get('/crawl-logs', (req, res) => {
  const { sourceId, limit } = req.query;
  let list = state.crawlLogs;
  if (sourceId) list = list.filter((l) => l.sourceId === sourceId);
  res.json({ logs: list.slice(0, Number(limit) || 100) });
});

router.get('/agent-logs', (req, res) => {
  const { limit } = req.query;
  res.json({ logs: state.agentLogs.slice(0, Number(limit) || 50) });
});

// -------------------------------------------------------- agent review ---
router.get('/pending-sources', (req, res) => {
  res.json({ pendingSources: state.pendingSources });
});

router.post('/pending-sources/:id/approve', (req, res) => {
  const source = approvePendingSource(req.params.id);
  if (!source) return res.status(404).json({ error: 'Pending source not found' });
  res.json({ ok: true, source });
});

router.post('/pending-sources/:id/reject', (req, res) => {
  const ok = rejectPendingSource(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Pending source not found' });
  res.json({ ok: true });
});

module.exports = router;
