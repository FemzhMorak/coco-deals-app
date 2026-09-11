// Manual source-discovery trigger for local testing: `npm run agent:now`
require('dotenv').config();
const { runDiscoveryAgent } = require('./discover');
const { flush } = require('../src/config/db');

runDiscoveryAgent()
  .then((result) => {
    console.log('[agent] done:', result);
    flush(); // process.exit() below skips the debounced writes otherwise
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    flush();
    process.exit(1);
  });
