import { gotScraping } from 'got-scraping';

async function testBrief(id, type) {
    const url = `https://eventsstat.com/en/services-api/SiteService/BriefDetails?id=${id}&type=${type}&ln=en&partner=1&geo=1`;
    console.log(`Testing BriefDetails (${type}) for ID: ${id}`);
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        console.log('Result:', JSON.stringify(res.body, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

// Test with STI (Season ID) as tournament
testBrief('699a56745e99bd05c6eacd4f', 'tourn_season');
// Test with STI as tournament
testBrief('699a56745e99bd05c6eacd4f', 'tournament');
