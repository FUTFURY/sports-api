import { gotScraping } from 'got-scraping';

async function testPlayer(id) {
    const url = `https://eventsstat.com/en/services-api/SiteService/PlayerDetailed?playerId=${id}&ln=en&partner=0&geo=1`;
    console.log(`Testing PlayerDetailed for ID: ${id}`);
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        console.log('Result (first keys):', Object.keys(res.body || {}).slice(0, 10));
        if (res.body?.P) {
            console.log('Player name found:', res.body.P.T);
        } else {
            console.log('Player data not found.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testPlayer(25763); // Alexander Zverev
