// Minimal session layer for the private admin dashboard: a single shared
// ADMIN_PASSWORD (from .env) gates login; a random token then identifies
// the session for 24 hours via an HttpOnly cookie. Sessions live in memory
// — restarting the server logs everyone out, which is fine for an
// internal, single-operator admin tool.
const crypto = require('crypto');

const SESSION_COOKIE = 'coco_admin_session';
const SESSION_TTL_MS = 24 * 3600 * 1000;

const sessions = new Map(); // token -> expiresAt (ms epoch)

function createSession() {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValid(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function destroy(token) {
  sessions.delete(token);
}

function requireSession(req, res, next) {
  if (!isValid(req.cookies?.[SESSION_COOKIE])) {
    return res.status(401).json({ error: 'Unauthorized — please log in again.' });
  }
  next();
}

function requireSessionOrRedirect(req, res, next) {
  if (!isValid(req.cookies?.[SESSION_COOKIE])) {
    return res.redirect('/admin/login.html');
  }
  next();
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSession,
  isValid,
  destroy,
  requireSession,
  requireSessionOrRedirect,
};
