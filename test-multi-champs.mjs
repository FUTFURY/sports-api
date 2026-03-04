import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
    'Origin': 'https://sa.1xbet.com',
};

async function testMultiChamps() {
    // Premier league + Ligue 1 (example ID 12821 or similar)
    // Actually let's just use 88637 and another one.
    const url = `https://sa.1xbet.com/service-api/LineFeed/Get1x2_VZip?sports=1&champs=88637,118593&count=100&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;

    console.log("Fetching: " + url);

    try {
        const response = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
        const matches = response.body?.Value || [];
        console.log(`✅ Loaded ${matches.length} matches.`);

        const champs = new Set(matches.map(m => m.LI));
        console.log("Championships found: ", Array.from(champs));

    } catch (e) {
        console.log("Error: " + e.message);
    }
}
testMultiChamps();
