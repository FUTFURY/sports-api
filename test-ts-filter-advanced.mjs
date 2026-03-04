import { gotScraping } from 'got-scraping';

const HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://1xbet.com',
    'Referer': 'https://1xbet.com/en/line/football',
    'x-app-n': '__BETTING_APP__',
    'X-Requested-With': 'XMLHttpRequest'
};

async function testTsFilterAdvanced() {
    const MAIN_BASE_URL = 'https://sa.1xbet.com';
    const tsFrom = 1772312400;
    const tsTo = 1772398800;

    // Test both VZip and Zip
    const urls = [
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&tsFrom=${tsFrom}&tsTo=${tsTo}&count=100&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_Zip?sports=1&tsFrom=${tsFrom}&tsTo=${tsTo}&count=100&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`
    ];

    for (const url of urls) {
        console.log("\nTesting: " + url);
        try {
            const response = await gotScraping.get(url, { headers: HEADERS, responseType: 'json' });
            const matches = response.body?.Value || [];
            console.log(`✅ Loaded ${matches.length} matches.`);
            if (matches.length > 0) {
                console.log(`Example: ${matches[0].L} - ${matches[0].O1} vs ${matches[0].O2}`);
            }
        } catch (e) {
            console.log("Error: " + e.message);
        }
    }
}
testTsFilterAdvanced();
