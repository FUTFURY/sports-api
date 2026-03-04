import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
};

async function testDeepFuture() {
    const MAIN_BASE_URL = 'https://sa.1xbet.com';

    // 1. Get champs
    const champsUrl = `${MAIN_BASE_URL}/service-api/LineFeed/GetChampsZip?sport=1&lng=en&country=158`;
    const champsRes = await gotScraping.get(champsUrl, { headers: COMMON_HEADERS, responseType: 'json' });
    const champs = champsRes.body?.Value || [];

    // 2. Filter top 50 champs by game count or just take top ones
    const ids = champs.slice(0, 50).map(c => c.LI).join(',');

    // 3. Get matches
    const url = `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&champs=${ids}&count=1000&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;
    console.log("Fetching deep future matches...");

    const res = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
    const matches = res.body?.Value || [];
    console.log(`✅ Loaded ${matches.length} matches.`);

    let marchCount = 0;
    matches.forEach(m => {
        const d = new Date(m.S * 1000);
        if (d.getUTCMonth() === 2) marchCount++;
    });

    console.log(`Matches in March: ${marchCount}`);
}
testDeepFuture();
