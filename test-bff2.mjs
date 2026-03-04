import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    'Origin': 'https://1xbet.com',
    'Referer': 'https://1xbet.com/'
};

async function check() {
    const tsFrom = 1768770000;
    const tsTo = 1768856400;

    const paths = [
        `games?champId=19853&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en`,
        `champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportId=4`,
        `sports?cyberFlag=4&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en`,
        `results/sports?cyberFlag=4&dateFrom=${tsFrom}&dateTo=${tsTo}  `,
        `api/sports?cyberFlag=4&dateFrom=${tsFrom}&dateTo=${tsTo}`
    ];

    for (const p of paths) {
        const url = `https://sa.1xbet.com/bff-api/${p}`;
        try {
            console.log(`Testing ${url}`);
            const res = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'text', timeout: { request: 3000 } });
            console.log(`✅ Success (${res.statusCode}):`, res.body.substring(0, 100));
        } catch (e) {
            console.log(`❌ Failed: ${e.response ? e.response.statusCode : e.message} for ${url}`);
        }
    }
}
check();
