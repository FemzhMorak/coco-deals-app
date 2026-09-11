// Web search for the discovery agent.
//
// DuckDuckGo's JSON "Instant Answer" API (api.duckduckgo.com/?format=json)
// only returns infobox-style instant answers, not general web search
// results — it's effectively empty for a query like "Nigeria Fintech promo
// 2025". Its HTML results endpoint (html.duckduckgo.com/html/) is what
// actually returns a real results list without needing an API key, so
// that's what this fetches and parses. If SERPAPI_KEY is set, SerpAPI is
// used instead (real JSON API, more reliable, but requires a paid key).
const axios = require('axios');
const cheerio = require('cheerio');

async function searchSerpApi(query) {
  const res = await axios.get('https://serpapi.com/search.json', {
    params: { q: query, api_key: process.env.SERPAPI_KEY, num: 10 },
    timeout: 12000,
  });
  return (res.data?.organic_results ?? []).map((r) => ({ title: r.title, url: r.link }));
}

async function searchDuckDuckGo(query) {
  const res = await axios.get('https://html.duckduckgo.com/html/', {
    params: { q: query },
    timeout: 12000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CocoSourceAgent/1.0; +https://coco.app/bot)',
      Accept: 'text/html',
    },
  });

  const $ = cheerio.load(res.data);
  const results = [];
  $('.result__a').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');
    const url = decodeDuckDuckGoRedirect(href);
    if (url) results.push({ title, url });
  });
  return results;
}

// DDG's HTML endpoint wraps result links as /l/?uddg=<encoded target>&...
function decodeDuckDuckGoRedirect(href) {
  if (!href) return null;
  try {
    const url = new URL(href, 'https://duckduckgo.com');
    const target = url.searchParams.get('uddg');
    return target ? decodeURIComponent(target) : href;
  } catch {
    return href.startsWith('http') ? href : null;
  }
}

async function search(query) {
  try {
    if (process.env.SERPAPI_KEY) return await searchSerpApi(query);
    return await searchDuckDuckGo(query);
  } catch (err) {
    console.warn(`[agent] search failed for "${query}": ${err.message}`);
    return [];
  }
}

module.exports = { search };
