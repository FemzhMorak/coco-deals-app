// Tracks when the crawler/agent last ran and when they're next due, purely
// for display on the admin dashboard — node-cron itself doesn't expose a
// "next run" time, so server.js updates these whenever it (re)schedules or
// fires a job.
const scheduleState = {
  crawlIntervalHours: 6,
  lastCrawlAt: null,
  nextCrawlAt: null,
  agentRunTime: '02:00',
  lastAgentAt: null,
  nextAgentAt: null,
};

function setCrawlSchedule(intervalHours, nextCrawlAt) {
  scheduleState.crawlIntervalHours = intervalHours;
  scheduleState.nextCrawlAt = nextCrawlAt;
}

function markCrawlRan() {
  scheduleState.lastCrawlAt = new Date().toISOString();
  scheduleState.nextCrawlAt = new Date(Date.now() + scheduleState.crawlIntervalHours * 3600 * 1000).toISOString();
}

function setAgentSchedule(runTime, nextAgentAt) {
  scheduleState.agentRunTime = runTime;
  scheduleState.nextAgentAt = nextAgentAt;
}

function markAgentRan() {
  scheduleState.lastAgentAt = new Date().toISOString();
  scheduleState.nextAgentAt = computeNextAgentTime(scheduleState.agentRunTime);
}

function computeNextAgentTime(runTime) {
  const [hh, mm] = runTime.split(':').map(Number);
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

module.exports = { scheduleState, setCrawlSchedule, markCrawlRan, setAgentSchedule, markAgentRan, computeNextAgentTime };
