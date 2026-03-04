import { gotScraping } from 'got-scraping';

// Scan ALL JS bundles for API calls patterns
const stageId = '699a0b7b5e99bd05c6eaabba';
const pageRes = await gotScraping.get(`https://eventsstat.com/en/statisticpopup/stage/tennis/${stageId}?hs=1&ln=en&partner=1&geo=1`);
const html = pageRes.body;

// Find all script src tags - both absolute and relative  
const scriptSrcs = [...html.matchAll(/src=["']([^"']+\.js[^"']*)['"]/g)].map(m => {
    const src = m[1];
    if (src.startsWith('http')) return src;
    if (src.startsWith('./')) return `https://eventsstat.com/${src.slice(2)}`;
    if (src.startsWith('/')) return `https://eventsstat.com${src}`;
    return `https://eventsstat.com/${src}`;
});

console.log(`Found ${scriptSrcs.length} scripts`);

const allEndpoints = new Set();
let found = false;

for (const url of scriptSrcs) {
    try {
        const res = await gotScraping.get(url);
        const js = res.body;

        // Look for any API-related strings
        if (js.includes('services-api') || js.includes('SiteService')) {
            found = true;
            const apiPaths = [...js.matchAll(/services-api[/\\]+\w+[/\\]+(\w+)/g)].map(m => m[1]);
            const svcNames = [...js.matchAll(/SiteService.{0,3}(\w+)/g)].map(m => m[1]);
            [...apiPaths, ...svcNames].forEach(e => allEndpoints.add(e));
        }
    } catch (e) {
        // skip
    }
}

console.log('API patterns found:', found);
console.log('Endpoints:', [...allEndpoints].slice(0, 20));
