// Manual crawl trigger for local testing: `npm run crawl:now`
require('dotenv').config();
const { runCrawler } = require('./index');
const { flush } = require('../src/config/db');

runCrawler()
  .then((result) => {
    console.log('[crawler] done:', result);
    flush(); // process.exit() below skips the debounced writes otherwise
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    flush();
    process.exit(1);
  });
