import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
};

async function testTsFilter() {
    const MAIN_BASE_URL = 'https://sa.1xbet.com';

    // March 1st, 2026 (approx 1772312400 as found by subagent)
    const tsFrom = 1772312400;
    const tsTo = 1772398800;

    const url = `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&tsFrom=${tsFrom}&tsTo=${tsTo}&count=100&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;

    console.log("Fetching with tsFrom/tsTo: " + url);

    try {
        const response = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
        const matches = response.body?.Value || [];
        console.log(`✅ Loaded ${matches.length} matches for March 1st.`);

        if (matches.length > 0) {
            console.log("Example matches:");
            matches.slice(0, 5).forEach(m => {
                console.log(`- [${new Date(m.S * 1000).toUTCString()}] ${m.L} : ${m.O1} vs ${m.O2}`);
            });
        }
    } catch (e) {
        console.log("Error: " + e.message);
    }
}
testTsFilter();
