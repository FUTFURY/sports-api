import { gotScraping } from 'got-scraping';

async function testStats(id) {
    const url = `https://eventsstat.com/en/services-api/SiteService/MainStatistic?tournamentId=${id}&sId=4&ln=en&partner=0&geo=1`;
    console.log(`Testing MainStatistic for ID: ${id}`);
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        console.log('Result:', JSON.stringify(res.body, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testStats(31663); // ATP Santiago
