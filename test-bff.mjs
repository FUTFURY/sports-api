import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    'Origin': 'https://1xbet.com',
    'Referer': 'https://1xbet.com/'
};

async function check() {
    const tsFrom = Math.floor(Date.now() / 1000) - (3 * 86400); // 3 days ago
    const tsTo = Math.floor(Date.now() / 1000);

    const urls = [
        `https://sa.1xbet.com/bff-api/results/champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportId=4`,
        `https://1xbet.com/bff-api/results/champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportId=4`,
        `https://sa.1xbet.com/results/api/champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportId=4`,
        `https://sa.1xbet.com/results/champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportId=4`
    ];

    for (const url of urls) {
        try {
            console.log(`Testing ${url}`);
            const res = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'text', timeout: { request: 5000 } });
            console.log(`✅ Success (${res.statusCode}):`, res.body.substring(0, 100));
        } catch (e) {
            console.log(`❌ Failed: ${e.response ? e.response.statusCode : e.message} for ${url}`);
        }
    }
}
check();
