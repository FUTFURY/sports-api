import { gotScraping } from 'got-scraping';

async function testStats(id) {
    const url = `https://eventsstat.com/en/services-api/SiteService/TournamentStats?tournamentId=${id}&sId=4&ln=en&partner=1&geo=1`;
    console.log(`Testing TournamentStats for ID: ${id}`);
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        console.log('Success! Keys:', Object.keys(res.body || {}));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testStats('699a0b7b5e99bd05c6eaabba'); // Season ID
testStats('5abc9cf7494765f3cac8d2f7'); // General ID
