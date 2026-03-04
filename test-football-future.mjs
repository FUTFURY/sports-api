import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://sa.1xbet.com/en/line/football',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br'
};

async function testFootballFuture() {
    const MAIN_BASE_URL = 'https://sa.1xbet.com';

    // testing tf values
    const urls = [
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&tf=24&lng=en&country=158`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&tf=48&lng=en&country=158`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&tf=720&lng=en&country=158`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&tz=24&lng=en&country=158`, // maybe tz?
    ];

    for (const url of urls) {
        console.log("Fetching: " + url);
        try {
            const response = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
            const matches = response.body?.Value || [];
            console.log(`✅ Loaded ${matches.length} matches.`);
            if (matches.length > 0) {
                const sorted = matches.sort((a, b) => b.S - a.S);
                console.log(`Furthest date: ${new Date(sorted[0].S * 1000).toISOString()}`);
            }
        } catch (e) { console.log(e.message); }
    }
}
testFootballFuture();
