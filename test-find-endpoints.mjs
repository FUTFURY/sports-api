import { gotScraping } from 'got-scraping';

const stageId = '699a0b7b5e99bd05c6eaabba';
const res = await gotScraping.get(`https://eventsstat.com/en/statisticpopup/stage/tennis/${stageId}?hs=1&ln=en&partner=1&geo=1`);
const html = res.body;

// Find all script src references
const scripts = [...html.matchAll(/src=["']([^"']+\.js[^"']*)['"]/g)].map(m => m[1]);
console.log('Scripts loaded:', scripts.slice(0, 8));

// Find the SiteService endpoint calls in the embedded JS/HTML
const siteServiceCalls = [...new Set([...html.matchAll(/SiteService\/(\w+)/g)].map(m => m[1]))];
console.log('SiteService endpoints referenced:', siteServiceCalls);
