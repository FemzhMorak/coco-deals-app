require('dotenv').config();
const cron = require('node-cron');
const app = require('./src/app');
const { runCrawler } = require('./crawler');
const { runDiscoveryAgent } = require('./agent/discover');
const { setCrawlSchedule, markCrawlRan, setAgentSchedule, markAgentRan, computeNextAgentTime } = require('./src/config/schedule');

const PORT = process.env.PORT || 4000;
const CRAWL_INTERVAL_HOURS = Math.max(1, Number(process.env.CRAWL_INTERVAL_HOURS) || 6);
const AGENT_RUN_TIME = process.env.AGENT_RUN_TIME || '02:00'; // 24h HH:MM

function scheduleCrawler() {
  const cronExpr = `0 */${CRAWL_INTERVAL_HOURS} * * *`;
  setCrawlSchedule(CRAWL_INTERVAL_HOURS, new Date(Date.now() + CRAWL_INTERVAL_HOURS * 3600 * 1000).toISOString());

  cron.schedule(cronExpr, () => {
    console.log('[crawler] scheduled run starting…');
    runCrawler()
      .then((result) => {
        markCrawlRan();
        console.log(`[crawler] run complete: ${result.sourcesProcessed} sources, ${result.newDeals} new deals, ${result.errors} errors`);
      })
      .catch((err) => console.error('[crawler] scheduled run failed:', err));
  });
  console.log(`[crawler] scheduled with cron "${cronExpr}" (every ${CRAWL_INTERVAL_HOURS}h)`);

  if (process.env.CRAWL_ON_START === 'true') {
    runCrawler()
      .then(markCrawlRan)
      .catch((err) => console.error('[crawler] startup run failed:', err));
  }
}

function scheduleAgent() {
  const [hh, mm] = AGENT_RUN_TIME.split(':').map(Number);
  const cronExpr = `${mm} ${hh} * * *`;
  setAgentSchedule(AGENT_RUN_TIME, computeNextAgentTime(AGENT_RUN_TIME));

  cron.schedule(cronExpr, () => {
    console.log('[agent] scheduled discovery run starting…');
    runDiscoveryAgent()
      .then((result) => {
        markAgentRan();
        console.log(`[agent] run complete: ${result.newDomainsChecked} domains checked, ${result.added} added, ${result.pending} pending review`);
      })
      .catch((err) => console.error('[agent] scheduled run failed:', err));
  });
  console.log(`[agent] scheduled with cron "${cronExpr}" (daily at ${AGENT_RUN_TIME})`);
}

app.listen(PORT, () => {
  console.log(`🥥 Coco backend listening on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Admin dashboard: http://localhost:${PORT}/admin`);
  scheduleCrawler();
  scheduleAgent();
});
