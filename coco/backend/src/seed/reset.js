// Wipes backend/data/*.json back to a clean seed state: the original 20
// deals, the original 20 sources, and empty users/logs/pending sources.
// `npm run seed:reset`
const fs = require('fs');
const path = require('path');
const { seedDeals } = require('./deals');
const { seedSources } = require('./sources');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function write(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

fs.mkdirSync(DATA_DIR, { recursive: true });
write('deals.json', seedDeals());
write('sources.json', seedSources());
write('users.json', {});
write('interactions.json', { votes: {}, verifications: {} });
write('crawl-logs.json', []);
write('agent-logs.json', []);
write('pending-sources.json', []);

console.log(`[seed] reset ${DATA_DIR} to a clean seed state (20 deals, 20 sources)`);
