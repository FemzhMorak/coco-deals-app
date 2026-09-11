import { API_BASE_URL } from '../constants/config';
import { seedDeals } from '../data/seedDeals';
import { storage } from './storage';

let userIdPromise = null;

function generateId() {
  return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function getUserId() {
  if (!userIdPromise) {
    userIdPromise = (async () => {
      const existing = await storage.getJSON(storage.KEYS.USER_ID, null);
      if (existing) return existing;
      const id = generateId();
      await storage.setJSON(storage.KEYS.USER_ID, id);
      return id;
    })();
  }
  return userIdPromise;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Every read falls back to bundled seed data so the app stays fully usable
// (and demo-able) even when the backend isn't running yet.

export async function fetchDeals() {
  try {
    const data = await request('/deals');
    return data.deals ?? data;
  } catch {
    return seedDeals;
  }
}

export async function fetchDealsByCategory(category) {
  try {
    const data = await request(`/deals/category/${category}`);
    return data.deals ?? data;
  } catch {
    if (category === 'all') return seedDeals;
    return seedDeals.filter((d) => d.category === category);
  }
}

export async function fetchDealById(id) {
  try {
    const data = await request(`/deals/${id}`);
    return data.deal ?? data;
  } catch {
    return seedDeals.find((d) => d.id === id) ?? null;
  }
}

export async function fetchTrending() {
  try {
    const data = await request('/deals/trending');
    return data.deals ?? data;
  } catch {
    return [...seedDeals].sort((a, b) => b.upvotes - a.upvotes).slice(0, 10);
  }
}

export async function fetchExpiring() {
  try {
    const data = await request('/deals/expiring');
    return data.deals ?? data;
  } catch {
    const now = Date.now();
    return seedDeals.filter((d) => {
      const diff = new Date(d.expiryDate).getTime() - now;
      return diff > 0 && diff <= 6 * 3600 * 1000;
    });
  }
}

export async function fetchPersonalizedFeed() {
  const userId = await getUserId();
  try {
    const data = await request(`/user/feed?userId=${userId}`);
    return data.deals ?? data;
  } catch {
    return seedDeals;
  }
}

export async function upvoteDeal(id) {
  const userId = await getUserId();
  try {
    return await request(`/deals/${id}/upvote`, { method: 'POST', body: JSON.stringify({ userId }) });
  } catch {
    return null;
  }
}

export async function downvoteDeal(id) {
  const userId = await getUserId();
  try {
    return await request(`/deals/${id}/downvote`, { method: 'POST', body: JSON.stringify({ userId }) });
  } catch {
    return null;
  }
}

export async function verifyDeal(id, status) {
  // status: 'still_works' | 'expired'
  const userId = await getUserId();
  try {
    return await request(`/deals/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ userId, status }),
    });
  } catch {
    return null;
  }
}

export async function savePreferences(preferences) {
  const userId = await getUserId();
  try {
    return await request('/user/preferences', {
      method: 'POST',
      body: JSON.stringify({ userId, preferences }),
    });
  } catch {
    return null;
  }
}

export async function registerPushToken(token) {
  const userId = await getUserId();
  try {
    return await request('/user/push-token', {
      method: 'POST',
      body: JSON.stringify({ userId, token }),
    });
  } catch {
    return null;
  }
}
