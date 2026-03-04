// test-dates.mjs
import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
    'Origin': 'https://sa.1xbet.com',
    'Referer': 'https://sa.1xbet.com/en/results',
};

async function testApi() {
    const urls = [];

    // Check past 10 days
    for (let i = 1; i <= 10; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const tsFrom = Math.floor(d.getTime() / 1000);
        const tsTo = tsFrom + 86400 - 1;
        urls.push(`https://sa.1xbet.com/service-api/result/web/api/v2/champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportIds=4`);
    }

    for (const url of urls) {
        try {
            console.log(`\nURL: ${url}`);
            const res = await gotScraping.get(url, { headers: COMMON_HEADERS });
            console.log(`✅ Success (${res.statusCode}): ${res.body.substring(0, 100)}`);
        } catch (e) {
            console.log(`❌ Failed (${e.response?.statusCode}): ${e.response?.body || e.message}`);
        }
    }
}

testApi();
