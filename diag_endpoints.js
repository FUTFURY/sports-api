const axios = require('axios');

async function testAll() {
    const client = axios.create({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://1xbet.com/',
            'Origin': 'https://1xbet.com'
        },
        timeout: 10000
    });

    const tests = [
        { name: 'LIVE MATCHES', url: 'https://1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=4&lng=en&partner=1' },
        { name: 'UPCOMING MATCHES', url: 'https://1xbet.com/service-api/LineFeed/Get1x2_VZip?sports=4&lng=en&partner=1' },
        { name: 'TOURNAMENTS', url: 'https://1xbet.com/service-api/LineFeed/GetChampsZip?sports=4&lng=en&partner=1' },
        { name: 'RANKINGS (EVENTSSTAT)', url: 'https://eventsstat.com/en/services-api/SiteService/RatingDetailedNewBySelectors?tournId=5b19067ef87e5825813fb409&recLimit=l.100&ln=en&partner=1&geo=158' }
    ];

    console.log('--- DIAGNOSTIC DES ENDPOINTS ---');
    for (const t of tests) {
        try {
            const res = await client.get(t.url);
            console.log(`✅ ${t.name}: Status ${res.status} - OK`);
        } catch (e) {
            console.log(`❌ ${t.name}: FAILED - Status ${e.response ? e.response.status : e.message}`);
        }
    }
}

testAll();
