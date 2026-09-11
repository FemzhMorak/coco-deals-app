// Shared helpers for every admin page: an authenticated fetch wrapper (401
// bounces back to the login page), the sidebar shell, and small render
// utilities. Plain vanilla JS on purpose — this dashboard is internal-only
// and doesn't need a build step.

async function api(path, options = {}) {
  const res = await fetch(`/admin/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = '/admin/login.html';
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function toast(message, type = 'success') {
  const node = el('div', { class: `toast ${type}` }, message);
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3500);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

function relTime(iso) {
  if (!iso) return '—';
  const diffMs = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  if (mins < 60) return diffMs < 0 ? `${mins}m ago` : `in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return diffMs < 0 ? `${hrs}h ago` : `in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return diffMs < 0 ? `${days}d ago` : `in ${days}d`;
}

const NAV_ITEMS = [
  { href: '/admin/index.html', label: 'Dashboard' },
  { href: '/admin/sources.html', label: 'Sources' },
  { href: '/admin/deals.html', label: 'Deals' },
  { href: '/admin/logs.html', label: 'Crawl Logs' },
  { href: '/admin/agent.html', label: 'Agent' },
];

function renderShell(activeHref) {
  const sidebar = document.getElementById('sidebar');
  sidebar.appendChild(el('div', { class: 'brand' }, '🥥 Coco Admin'));
  const nav = el('nav');
  for (const item of NAV_ITEMS) {
    nav.appendChild(
      el('a', { href: item.href, class: item.href === activeHref ? 'active' : '' }, item.label)
    );
  }
  sidebar.appendChild(nav);
  sidebar.appendChild(
    el('button', { class: 'logout', onclick: logout }, 'Log out')
  );
}

async function logout() {
  await api('/logout', { method: 'POST' }).catch(() => {});
  window.location.href = '/admin/login.html';
}
