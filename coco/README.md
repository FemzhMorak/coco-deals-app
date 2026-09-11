# Quick Start — How to Run Coco Every Time

## 1. Start the backend

```bash
cd ~/Desktop/github/coco-deals-app/coco/backend
npm start
```

- Admin dashboard: http://localhost:4000/admin
- API health check: http://localhost:4000/health

## 2. Start the Expo app (in a new terminal)

```bash
cd ~/Desktop/github/coco-deals-app/coco
npx expo start
```

Then scan the QR code with **Expo Go** on your iPhone.

## 3. Admin dashboard

- URL: http://localhost:4000/admin
- Password: set in `backend/.env` as `ADMIN_PASSWORD`

What you can do there:

- See all crawl sources and their status
- Add new sources manually
- Trigger a manual crawl anytime
- See all active deals
- Delete expired deals
- See AI agent discovery logs
- Approve or reject agent-discovered sources

## 4. Adding a new crawl source

1. Go to http://localhost:4000/admin
2. Click **Sources** in the left menu
3. Click **Add New Source**
4. Fill in: brand name, category, URL, type (website/instagram/twitter)
5. Click **Save** — it starts crawling on the next cycle

## 5. Triggering a manual crawl

1. Go to http://localhost:4000/admin
2. Click **Trigger Manual Crawl Now** on the dashboard
3. Wait 2–3 minutes for all sources to complete
4. Refresh to see updated deal counts

## 6. Running the AI source discovery agent manually

1. Go to http://localhost:4000/admin
2. Click **Run Source Discovery Agent Now**
3. Check the **Agent** page for newly discovered sources
4. Approve or reject pending sources

## 7. Making changes to the app

- **Frontend** (what users see): edit files in `coco/app/` and `coco/components/`
- **Backend** (crawler, API, agent): edit files in `coco/backend/`
- After changes: save the file, Expo auto-reloads the app on your phone
- To push changes to GitHub:
  ```bash
  git add -A && git commit -m "description" && git push origin main
  ```

## 8. Environment variables

Location: `coco/backend/.env`

Key variables:

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Your dashboard password |
| `ANTHROPIC_API_KEY` | For the AI source discovery agent |
| `SERPAPI_KEY` | Optional, for better agent search results |
| `CRAWL_ON_START` | Set to `true` to crawl immediately on server start |

## 9. Ports used

- Backend runs on port **4000**
- Expo app runs on port **8081**
- If there's a port conflict, kill the process using that port first

## 10. If something breaks

- **Backend not starting** — check `backend/.env` has all required values
- **Expo not loading on phone** — make sure phone and Mac are on the same WiFi
- **Deals not showing in app** — trigger a manual crawl from the admin dashboard
- **Source failing** — check **Crawl Logs** in admin for error details

---

# Coco 🔥

Coco is a Nigerian deals and discounts aggregator. It crawls major Nigerian
brands, scores every deal for genuine quality (not just "X% off"), lets the
community verify which deals still work, and notifies users the moment a
great deal drops from a brand they follow.

The project is two apps in one repo:

- **`/` — the Expo (React Native) app.** Dark glassmorphism UI, Home /
  Saved / Notifications / Profile tabs, deal detail with price-history
  chart, and a Coco Pro paywall.
- **`/backend` — a standalone Node/Express API.** A Puppeteer-based crawler
  fleet driven by a source-management system, an AI agent that discovers
  new sources on its own, a private admin dashboard, the quality scoring
  engine, personalisation, community verification, brand reliability
  tracking, and Expo push notifications.

They run as two separate processes and talk to each other over HTTP — the
app also works fully offline against bundled seed data if the backend isn't
running, so you can explore the UI immediately.

---

## Contents

- [Quick start](#quick-start)
- [Running the backend](#running-the-backend)
- [Running the Expo app](#running-the-expo-app)
- [Connecting the app to the backend](#connecting-the-app-to-the-backend)
- [How the quality score works](#how-the-quality-score-works)
- [Personalisation](#personalisation)
- [Community verification](#community-verification)
- [Brand reliability](#brand-reliability)
- [Source management & the crawler](#source-management--the-crawler)
- [AI source discovery agent](#ai-source-discovery-agent)
- [Admin dashboard](#admin-dashboard)
- [Push notifications](#push-notifications)
- [Monetisation (Coco Pro)](#monetisation-coco-pro)
- [REST API reference](#rest-api-reference)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)

---

## Quick start

You need two terminals — one for the backend, one for the app.

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env   # then set ADMIN_PASSWORD (and ANTHROPIC_API_KEY if you want the discovery agent)
npm start
# → 🥥 Coco backend listening on http://localhost:4000
# → Admin dashboard: http://localhost:4000/admin

# Terminal 2 — Expo app (from the repo root)
npm install
npm start
# → press i for iOS simulator, a for Android emulator, w for web,
#   or scan the QR code with Expo Go on a physical device
```

Requirements: **Node.js 22.13+** (Expo SDK 57's minimum) and either Xcode
(iOS simulator), Android Studio (Android emulator), or the **Expo Go** app
on your phone.

The app looks fully populated from the first launch even with the backend
turned off — it falls back to 20 bundled seed deals (`data/seedDeals.js`)
any time an API call fails or times out.

---

## Running the backend

```bash
cd backend
npm install
cp .env.example .env   # see below for what each var does
npm start               # or: npm run dev   (auto-restarts on file changes)
```

On first boot it seeds itself with 20 realistic Nigerian deals and 20 real
crawl sources, and persists everything to plain JSON files under
`backend/data/` — `deals.json`, `sources.json`, `users.json`,
`crawl-logs.json`, `agent-logs.json`, `pending-sources.json` — no database
to install or configure. Run `npm run seed:reset` to wipe everything back
to that clean seed state at any time (handy after experimenting).

Useful scripts (run from `backend/`):

| Command | What it does |
|---|---|
| `npm start` | Starts the API + admin dashboard on `PORT` (default `4000`) and schedules the crawler and the discovery agent. |
| `npm run dev` | Same, but restarts on file changes (`node --watch`). |
| `npm run crawl:now` | Runs the crawler once across every active source, then exits — useful for testing without waiting for the schedule. |
| `npm run agent:now` | Runs the AI source discovery agent once, then exits. |
| `npm run seed:reset` | Resets everything under `backend/data/` back to the original 20 deals / 20 sources, with no votes, logs, or pending sources. |

### Environment variables (`backend/.env`)

| Var | Default | Meaning |
|---|---|---|
| `PORT` | `4000` | API + admin dashboard port. |
| `ADMIN_PASSWORD` | _(required)_ | Password for `/admin`. The server refuses admin logins (with a clear error) until this is set. |
| `ANTHROPIC_API_KEY` | _(unset)_ | Used by the discovery agent to judge candidate sources. Without it, the agent still runs (search + dedupe) but skips AI evaluation and logs a warning per candidate rather than crashing. |
| `SERPAPI_KEY` | _(unset)_ | Optional. If set, the agent uses [SerpAPI](https://serpapi.com/) for web search instead of scraping DuckDuckGo's HTML results — see [AI source discovery agent](#ai-source-discovery-agent) for why you'll likely want this. |
| `CRAWL_INTERVAL_HOURS` | `6` | How often the crawler runs, in hours. |
| `CRAWL_ON_START` | `false` | If `true`, runs the crawler once when the server boots. |
| `AGENT_RUN_TIME` | `02:00` | 24h `HH:MM` — when the daily discovery-agent run fires. |
| `FREE_NOTIFICATION_DELAY_MINUTES` | `30` | How long Free-tier users' push notifications are delayed by, vs. instant for Coco Pro. |
| `PUSH_QUALITY_THRESHOLD` | `70` | Minimum quality score a newly-crawled deal needs to trigger a push notification. |

---

## Running the Expo app

```bash
npm install
npm start
```

This is an [Expo Router](https://docs.expo.dev/router/introduction/)
project targeting **Expo SDK 57**. From the Metro dev tools you can open it
in:

- **iOS Simulator** — press `i` (macOS + Xcode required)
- **Android Emulator** — press `a` (Android Studio required)
- **Web** — press `w`
- **A physical phone** — install **Expo Go** from the App/Play Store and
  scan the QR code (see the note below about the API URL on physical
  devices)

## Connecting the app to the backend

The app reads the backend's URL from `EXPO_PUBLIC_API_URL`
(`constants/config.js`), defaulting to `http://localhost:4000/api`.

- **iOS Simulator** and **Android Emulator** on the same machine as the
  backend: the default `localhost` URL works as-is.
- **A physical device** (Expo Go, or a dev build): `localhost` refers to
  the *phone*, not your computer, so it won't reach a backend running on
  your machine. Find your computer's LAN IP (`ipconfig getifaddr en0` on
  macOS, or `ipconfig` on Windows) and start the app with:

  ```bash
  EXPO_PUBLIC_API_URL=http://192.168.1.42:4000/api npm start
  ```

  Make sure your phone and computer are on the same Wi-Fi network, and that
  nothing (like a firewall) is blocking port 4000.

If the backend is unreachable for any reason, every read in
`services/api.js` silently falls back to the bundled seed data — the app
never shows a broken/empty screen because of it.

---

## How the quality score works

Every deal gets a **0–100 quality score**, recalculated on every crawl pass
and every vote/verification (`backend/src/services/scoringEngine.js`):

| Weight | Factor |
|---|---|
| 40% | How much cheaper the deal price is than its **30-day average** price |
| 30% | How much cheaper vs. its **90-day average** price |
| 20% | Community verification ratio (**"Still Works"** vs **"Expired"** reports) |
| 10% | The brand's **reliability score** (see below) |

Price history is tracked per deal (`priceHistory: [{ price, date }]`) and
grows every time a crawler sees that deal again at a different price. A
deal with no price history yet (e.g. a % cashback promo with no fixed
price) gets a neutral baseline for the price-based components and leans on
community/brand signals instead.

Labels: **80–100** Exceptional Deal (green) · **60–79** Good Deal (blue) ·
**40–59** Average Deal (yellow) · **0–39** Weak Deal (red).

## Personalisation

The app tracks every deal a user opens, saves, or grabs in `AsyncStorage`
(`context/UserContext.js`) and derives a **preference profile** from it —
top categories, top brands, and average price point — with no server
round-trip required. That profile is synced to the backend via
`POST /api/user/preferences` and used to reorder `GET /api/user/feed`
(`backend/src/services/personalizationEngine.js`). After roughly 30 days of
interaction history the app considers the feed "fully personalised" and
reflects that in the Profile screen and Fresh Deals subtitle.

## Community verification

Any user can upvote/downvote a deal, or report **"Still Works"** /
**"Expired"**. Thresholds (`backend/src/services/communityVerification.js`):

- **3+ "Expired" reports** → the deal is auto-flagged and immediately
  excluded from every active-deals endpoint and from the app's local list.
- **10+ "Still Works" reports** → the deal gets a **Community Verified**
  badge.
- Whenever a deal crosses the "Expired" flag threshold, everyone who had
  reported it "Expired" gets a `correctVerifications` point, and everyone
  who had said "Still Works" gets an `incorrectVerifications` point. A user
  with 5+ reports and ≥80% accuracy earns the **Trusted Verifier** badge.

One of the 20 seed deals (Justrite's rice & oil combo) ships with exactly 3
"Expired" reports on purpose, so you can see the auto-flagging behaviour
immediately without needing to report anything yourself.

## Brand reliability

`backend/src/services/brandReliability.js` scores each brand 0–100 from: the
% of its deals that are genuine discounts (original price actually higher
than the deal price), the % of "Still Works" vs "Expired" reports across
its deals, and its average deal quality score. This feeds 10% of every deal's
quality score and is shown on the deal detail screen as, e.g., "MTN Nigeria
— 87% reliable".

## Source management & the crawler

Every site/account the crawler pulls from is a row in `backend/data/sources.json`
— seeded with 20 real Nigerian sources across 8 categories (Electronics,
Malls, Cinemas, Cars, Fuel, Health, Events, Fintech):

| Category | Sources |
|---|---|
| Electronics | Fouani Nigeria, Sinomart, 3C Hub, Slot |
| Cinemas | Genesis Cinema, Silverbird Cinema, Filmhouse |
| Malls | The Palms Lagos (Instagram), Jabi Lake Mall, Leisure Mall |
| Cars | Cars45, Cheki Nigeria |
| Fuel | TotalEnergies Nigeria, Ardova |
| Health | HealthPlus, MedPlus |
| Events | Eventbrite Nigeria, Nairabox |
| Fintech | Kuda, Opay |

Each source tracks `active`, `lastCrawled`, `dealsFound` (cumulative new
deals it's produced), `successRate` (% of crawls that returned at least one
deal), and `addedBy` (`manual` or `agent`). Add, edit, disable, or delete
sources from the **Sources** page of the [admin dashboard](#admin-dashboard)
— no server restart needed, the crawler picks up changes on its next run.

**The crawler** (`backend/crawler/index.js`) loops every *active* source and
loads it with a real headless browser via
[Puppeteer](https://pptr.dev/) — most Nigerian retail/promo sites are
JS-rendered, so a plain HTML fetch misses their content. For each page it
scans the rendered DOM for blocks that contain **both** a `₦` price and a
discount-ish keyword (`off`, `promo`, `deal`, `save`, `discount`, `free`,
`bonus`, `limited`, `sale`, `offer`) — a much stronger signal than price
alone that a block is an actual promo rather than a plain product listing —
and keeps only the innermost matching element per block, so one promo card
doesn't get captured once per wrapping `<div>`. From each match it extracts
title, price(s), image, link, and (best-effort) an expiry date from any
"valid until / expires ..." phrasing nearby, defaulting to 72 hours out if
none is found. Every deal gets `category` (mapped to the app's existing
taxonomy — see below), the source's quality score inputs, and is upserted
into `backend/data/deals.json` (price appended to history if the deal
already exists, otherwise created new).

The crawler runs on a schedule (`CRAWL_INTERVAL_HOURS`, every 6 hours by
default) and shares one pipeline with manual triggers: extract → upsert →
rescore every deal → push a notification for any *newly created* deal
scoring ≥ `PUSH_QUALITY_THRESHOLD`. Trigger a pass immediately with
`npm run crawl:now`, or the **"Trigger Manual Crawl Now"** button on the
admin dashboard home page. Every attempt — success, "no deals found", or
error — is logged to `backend/data/crawl-logs.json` and shown on the
**Crawl Logs** page, including the actual error message (timeouts, DNS
failures, SSL errors — real sites fail in all of these ways).

**Category mapping.** The React Native app ships with its own fixed
category taxonomy (`telecoms`, `food`, `supermarkets`, `electronics`,
`fashion`, `banks`, `transport`, `entertainment`) baked into its UI, and
this rebuild deliberately left the app untouched. So `backend/src/utils/categoryMap.js`
bridges the two: a deal keeps the source's original category as
`sourceCategory` (shown throughout the admin dashboard) and gets a second,
frontend-compatible `category` for the public API — `Electronics→electronics`,
`Malls→supermarkets`, `Cinemas→entertainment`, `Cars→transport`,
`Fuel→transport`, `Health→supermarkets`, `Events→entertainment`,
`Fintech→banks`. It's a lossy but workable compromise; a cleaner fix would
extend the app's own category list, which is out of scope here.

## AI source discovery agent

`backend/agent/discover.js` runs once daily (`AGENT_RUN_TIME`, default
02:00) and looks for new Nigerian deal sources on its own:

1. **Search** (`backend/agent/search.js`) — builds 5 queries per run by
   rotating through the brief's templates (`Nigeria [category] promo 2025`,
   `Nigeria [brand] discount site:instagram.com`, `[city] mall deals
   Nigeria`, `Nigerian [category] store promotion`, `new Nigerian
   [category] brand`), substituting a category/city/brand that changes
   day to day so it isn't running the exact same five searches forever.
2. **Dedupe** — every result's domain is checked against both
   `sources.json` and `pending-sources.json`; already-known domains are
   skipped.
3. **Evaluate** (`backend/agent/evaluate.js`) — for each genuinely new
   domain, asks Claude (`claude-sonnet-4-6`) the brief's exact question —
   *"Is this a legitimate Nigerian brand or store that regularly runs
   promotions or discounts?"* — and parses back `{isLegitimate, brandName,
   category, confidence}`.
4. **Decide** — confidence **≥ 70** → added straight to `sources.json`
   (`addedBy: "agent"`, active immediately). Confidence **50–69** → queued
   in `pending-sources.json` for a human to approve or reject from the
   **Agent** page. Below 50, or `isLegitimate: false` → dropped (still
   logged, just not stored as a source).

Every run — queries used, domains checked, and the full evaluated list with
each verdict and decision — is logged to `backend/data/agent-logs.json` and
shown on the **Crawl Logs** and **Agent** pages. Trigger a run immediately
with `npm run agent:now` or the **"Run Source Discovery Agent Now"** button.

**On the web search step, in practice:** DuckDuckGo doesn't offer a real
"general web search" JSON API — its Instant Answer endpoint only returns
infobox-style answers, so this agent scrapes its HTML results page instead,
which needs no API key but is actively rate-limited/bot-gated (you may see
`[agent] search failed: ...` or simply zero results, especially from a
cloud/datacenter IP — this happened routinely while building this). If you
want the agent to reliably find results, set `SERPAPI_KEY` — the agent
prefers it automatically when present. Either way, the agent never crashes
on a bad search or a missing `ANTHROPIC_API_KEY`; it just finds nothing
that run and logs why.

## Admin dashboard

A private, desktop-only dashboard at **`http://localhost:4000/admin`** —
plain server-rendered HTML/CSS/JS (no build step), gated by a single shared
password.

- **Log in**: enter `ADMIN_PASSWORD` from `backend/.env` at `/admin/login.html`.
  A session cookie keeps you logged in for 24 hours; sessions live in
  server memory, so restarting the backend logs everyone out.
- **Dashboard** — total/active sources, active deals, deals found today,
  last/next crawl and agent-run times, per-source system health (working /
  no deals found / failing / never crawled), and the two manual-trigger
  buttons.
- **Sources** — table of every source with its live stats; an "Add New
  Source" form (name, category, type, URL, notes) that adds immediately;
  an active/inactive toggle per row; delete; filter by category or by
  `addedBy`.
- **Deals** — every deal in `deals.json`, sorted by quality score; filter
  by category, quality-score range, or "expiring within 6h"; delete
  individual deals; "Clear Expired Deals" to bulk-remove anything past its
  `expiryDate`.
- **Crawl Logs** — the full crawl timeline (per attempt: status, deals
  found, error message, duration) plus the agent discovery log.
- **Agent** — last run time, sources discovered this week, and the
  **pending review** queue (confidence 50–69) with **Approve**/**Reject**
  buttons — approving moves it straight into `sources.json` as an active
  source.

### Adding a source manually

Admin dashboard → **Sources** → fill in the "Add New Source" form (name,
pick one of the 8 categories, type, URL, optional notes) → **Add Source**.
It's crawled on the very next scheduled or manual run — no restart needed.

### Approving an agent-discovered source

Admin dashboard → **Agent** → the "Pending Review" table lists every source
the agent found with 50–69% confidence, alongside the query that surfaced
it. **Approve** promotes it into `sources.json` (active immediately);
**Reject** discards it. Anything the agent was ≥70% confident about skipped
this queue entirely and is already live — check the **Sources** page's
`addedBy: agent` filter to review those too.

## Push notifications

`backend/src/services/pushNotifications.js` uses `expo-server-sdk`. When a
crawler inserts a new deal scoring ≥70, every user following that category
with a registered push token gets notified — Coco Pro users instantly,
Free users after `FREE_NOTIFICATION_DELAY_MINUTES` (default 30). The app
registers its Expo push token on launch (`context/NotificationsContext.js`)
and posts it to `POST /api/user/push-token`. Push tokens only work on a
physical device or a custom dev/production build — not in the iOS
Simulator, and only partially in Expo Go depending on your SDK/plugin
setup.

## Monetisation (Coco Pro)

Deal opens are counted client-side in `AsyncStorage`
(`context/UserContext.js`). After the 10th open, and every 5 opens after
that until the user upgrades, a glassmorphism paywall modal appears
(`components/PaywallModal.js`) advertising **Coco Pro — ₦2,000/month**:

- **Free**: notifications delayed 30 minutes, no price-history chart, feed
  sorted by quality score only.
- **Coco Pro**: instant notifications, full price-history chart on the
  deal detail screen, a fully personalised feed, and a **Pro** badge on the
  Profile screen.

This build doesn't wire up real payment processing (Paystack/Flutterwave,
etc.) — tapping "Upgrade" flips a local `isPro` flag so you can see the Pro
experience immediately. Wiring a real payment provider would replace
`upgradeToPro()` in `context/UserContext.js`.

---

## REST API reference

Base URL: `http://localhost:4000/api` (see [Connecting the app to the
backend](#connecting-the-app-to-the-backend) for physical devices).

| Method | Path | Notes |
|---|---|---|
| GET | `/deals` | All active deals, sorted by quality score desc. |
| GET | `/deals/category/:category` | Deals in one category (`telecoms`, `food`, `supermarkets`, `electronics`, `fashion`, `banks`, `transport`, `entertainment`, or `all`). |
| GET | `/deals/:id` | Single deal. |
| GET | `/deals/trending` | Most-upvoted active deals. |
| GET | `/deals/expiring` | Active deals expiring within 6 hours. |
| POST | `/deals/:id/upvote` | Body: `{ "userId": "..." }` |
| POST | `/deals/:id/downvote` | Body: `{ "userId": "..." }` |
| POST | `/deals/:id/verify` | Body: `{ "userId": "...", "status": "still_works" \| "expired" }` |
| POST | `/user/preferences` | Body: `{ "userId", "preferences": { followedCategories, notificationPrefs, preferenceProfile, isPro } }` |
| GET | `/user/feed?userId=...` | Personalised feed for that user (falls back to quality-sorted if no profile yet). |
| POST | `/user/push-token` | Body: `{ "userId", "token" }` — registers an Expo push token. |

> **Note on route shape:** the brief describes `GET /api/deals/:category`
> as its own endpoint, but that's the same URL shape as `GET
> /api/deals/:id` (Express can't tell `/api/deals/food` apart from
> `/api/deals/d3`). This implementation resolves the collision with
> `GET /api/deals/category/:category` for the by-category listing, and the
> Expo app is already wired to call it that way.

---

## Project structure

```
coco/
├── app/                      # Expo Router file-based routes
│   ├── _layout.js             # Root providers + stack navigator
│   ├── (tabs)/                 # Bottom tab group
│   │   ├── _layout.js           # Custom tab bar (+ center flame button)
│   │   ├── index.js             # Home
│   │   ├── saved.js             # Saved
│   │   ├── notifications.js     # Notifications
│   │   └── profile.js           # Profile / Settings
│   ├── deal/[id].js            # Deal detail
│   └── hot.js                  # "Hot Right Now" (opened from the center flame button)
├── components/                # DealCard, GlassCard, HeroBanner, PaywallModal, …
├── context/                   # DealsContext, UserContext, NotificationsContext, PaywallContext
├── hooks/useGrabDeal.js        # Shared "open deal + record open + maybe show paywall" logic
├── services/                  # api.js (backend client w/ seed-data fallback), storage.js
├── data/seedDeals.js           # 20 bundled seed deals (offline fallback)
├── constants/                 # colors.js (design tokens), config.js
├── utils/                      # format.js, brandReliability.js
└── backend/                    # Standalone Express API + admin dashboard
    ├── server.js                # entry point — schedules the crawler + agent cron jobs
    ├── data/                     # sources.json, deals.json, users.json, crawl-logs.json,
    │                             # agent-logs.json, pending-sources.json — plain JSON, no DB
    ├── crawler/                  # Puppeteer crawler (index.js) + extraction heuristics (extract.js)
    ├── agent/                    # AI source discovery: discover.js, search.js, evaluate.js
    ├── admin/public/              # Private dashboard — static HTML/CSS/vanilla JS, no build step
    └── src/
        ├── app.js                 # mounts /api/* (public) and /admin/* (session-gated)
        ├── routes/, controllers/   # public REST API (deals, user)
        ├── routes/admin.js         # admin JSON API — sources/deals CRUD, logs, triggers
        ├── middleware/adminAuth.js # password → session-cookie auth for /admin
        ├── services/               # scoring, personalisation, community verification,
        │                           # brand reliability, push notifications
        ├── utils/categoryMap.js    # source taxonomy → app-compatible deal category
        ├── config/db.js            # JSON-file-backed store (one file per collection)
        ├── config/schedule.js      # tracks last/next crawl + agent run times for the dashboard
        └── seed/                   # deals.js, sources.js — the 20/20 initial seed data
```

## Known limitations

- **No real database.** The backend persists to plain JSON files under
  `backend/data/` — great for a demo/dev setup with zero infra, but you'd
  swap `src/config/db.js` for Postgres/Mongo/etc. before running this at
  real scale or with concurrent writers. Writes are debounced 200ms and
  flushed to disk; short-lived scripts (`crawl:now`, `agent:now`) explicitly
  call `flush()` before exiting so a run's results aren't lost — worth
  knowing if you build another CLI entry point against this store.
- **The crawler is a heuristic, not a real parser.** It was built and
  tested against the 20 live seed sources during development — real
  results, not a simulation — and genuinely extracts deals from several of
  them (Slot, Sinomart, HealthPlus, Nairabox all returned real candidates
  in testing). But it will also occasionally pick up unrelated page content
  that happens to match "₦ price near a discount word" (an ad widget, a
  footer promo for something else); these land with low quality scores and
  are one click to delete from the **Deals** admin page rather than
  silently trusted. Expect some sources to fail outright — sites go down,
  redirect, use expired/misconfigured TLS certs, or take longer than the
  25s navigation timeout; the **Crawl Logs** page shows the real error for
  each.
- **DuckDuckGo search is unreliable without `SERPAPI_KEY`.** See
  [AI source discovery agent](#ai-source-discovery-agent) — DDG's
  anti-bot "anomaly" challenge blocked most requests during development,
  especially from a cloud IP. The agent degrades gracefully (finds
  nothing, logs it, doesn't crash) rather than failing loudly.
- **Category mapping is lossy.** Sources keep the brief's 8-category
  taxonomy; deals get mapped down to the app's fixed 8 categories to stay
  compatible with the untouched frontend. See the mapping table above.
- **No real payments.** "Upgrade to Coco Pro" flips a local flag rather
  than charging a card — see [Monetisation](#monetisation-coco-pro).
- **Push notifications** require a physical device / custom build to fully
  test — they won't fire in the iOS Simulator.
- **Admin sessions are in-memory.** Restarting the backend logs every admin
  session out; fine for a single-operator internal tool, not for a
  multi-instance deployment.
