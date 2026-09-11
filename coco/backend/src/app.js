const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const path = require('path');
const dealsRoutes = require('./routes/deals');
const userRoutes = require('./routes/user');
const adminApiRoutes = require('./routes/admin');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { requireSessionOrRedirect } = require('./middleware/adminAuth');
const { rescoreAllDeals } = require('./services/scoringEngine');
const { state } = require('./config/db');

// Deals loaded from disk start with a placeholder quality score on any
// deal the crawler just inserted — make sure everything is scored
// correctly before the server starts serving.
rescoreAllDeals(state.deals);

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ ok: true, deals: state.deals.length, sources: state.sources.length }));

// ---- Public REST API (consumed by the React Native app) ----
app.use('/api/deals', dealsRoutes);
app.use('/api/user', userRoutes);

// ---- Private admin dashboard ----
// /admin/api/login and /admin/api/logout are public; every other
// /admin/api/* route is gated inside admin.js via requireSession.
app.use('/admin/api', adminApiRoutes);

const ADMIN_PUBLIC_FILES = new Set(['/login.html', '/login.js', '/admin.css']);
app.get('/admin', (req, res) => res.redirect('/admin/index.html'));
app.use('/admin', (req, res, next) => {
  if (ADMIN_PUBLIC_FILES.has(req.path)) return next();
  return requireSessionOrRedirect(req, res, next);
});
app.use('/admin', express.static(path.join(__dirname, '..', 'admin', 'public')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
