import { gotScraping } from 'got-scraping';

// Download and scan the JS bundles for SiteService endpoint names
const bundleUrls = [
    'https://eventsstat.com/sys-static/desktop/default/6977afe.js',
    'https://eventsstat.com/sys-static/desktop/default/527be4d.js',
    'https://eventsstat.com/sys-static/desktop/default/24ded79.js',
];

const allEndpoints = new Set();

for (const url of bundleUrls) {
    const res = await gotScraping.get(url);
    const js = res.body;
    // Find SiteService/ endpoint names
    const matches = [...js.matchAll(/SiteService\/([A-Za-z]+)/g)].map(m => m[1]);
    matches.forEach(e => allEndpoints.add(e));
}

console.log('All SiteService endpoints found in JS bundles:');
[...allEndpoints].sort().forEach(e => console.log(' -', e));
