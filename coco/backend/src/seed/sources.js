const crypto = require('crypto');

// The initial 20 real Nigerian crawl sources across all 8 categories.
// Regenerated (with fresh ids) only if backend/data/sources.json is
// missing — see src/config/db.js and `npm run seed:reset`.
const RAW = [
  // Electronics
  { name: 'Fouani Nigeria', category: 'Electronics', type: 'website', url: 'https://www.fouani.com' },
  { name: 'Sinomart', category: 'Electronics', type: 'website', url: 'https://sinomart.com.ng' },
  { name: '3C Hub', category: 'Electronics', type: 'website', url: 'https://3chub.com' },
  { name: 'Slot', category: 'Electronics', type: 'website', url: 'https://slot.ng' },

  // Cinemas
  { name: 'Genesis Cinema', category: 'Cinemas', type: 'website', url: 'https://genesiscinemas.com' },
  { name: 'Silverbird Cinema', category: 'Cinemas', type: 'website', url: 'https://silverbirdcinemas.com' },
  { name: 'Filmhouse', category: 'Cinemas', type: 'website', url: 'https://filmhousecinema.com' },

  // Malls
  { name: 'The Palms Lagos', category: 'Malls', type: 'instagram', url: 'https://www.instagram.com/thepalmslagos/' },
  { name: 'Jabi Lake Mall', category: 'Malls', type: 'website', url: 'https://jabilakemall.com.ng' },
  { name: 'Leisure Mall', category: 'Malls', type: 'website', url: 'https://leisuremall.com.ng' },

  // Cars
  { name: 'Cars45', category: 'Cars', type: 'website', url: 'https://blog.cars45.com' },
  { name: 'Cheki Nigeria', category: 'Cars', type: 'website', url: 'https://cheki.com.ng' },

  // Fuel
  { name: 'TotalEnergies Nigeria', category: 'Fuel', type: 'website', url: 'https://totalenergies.com.ng' },
  { name: 'Ardova', category: 'Fuel', type: 'website', url: 'https://ardovaplc.com' },

  // Health
  { name: 'HealthPlus', category: 'Health', type: 'website', url: 'https://healthplus.com.ng' },
  { name: 'MedPlus', category: 'Health', type: 'website', url: 'https://www.medplusnig.com' },

  // Events
  { name: 'Eventbrite Nigeria', category: 'Events', type: 'website', url: 'https://www.eventbrite.com/d/nigeria/events/' },
  { name: 'Nairabox', category: 'Events', type: 'website', url: 'https://www.nairabox.com' },

  // Fintech
  { name: 'Kuda', category: 'Fintech', type: 'website', url: 'https://kuda.com/blog' },
  { name: 'Opay', category: 'Fintech', type: 'website', url: 'https://opayweb.com/activity' },
];

function seedSources() {
  return RAW.map((s) => ({
    id: crypto.randomUUID(),
    name: s.name,
    category: s.category,
    type: s.type,
    url: s.url,
    active: true,
    createdAt: new Date().toISOString(),
    lastCrawled: null,
    dealsFound: 0,
    successRate: 0,
    addedBy: 'manual',
    notes: '',
    // internal bookkeeping used to compute successRate incrementally
    totalCrawls: 0,
    successfulCrawls: 0,
  }));
}

module.exports = { seedSources };
