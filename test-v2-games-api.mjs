import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8,sv;q=0.7',
    'Origin': 'https://sa.1xbet.com',
    'Referer': 'https://sa.1xbet.com/en/results',
    'x-app-n': '__RESULTS_FRONTEND__',
    'x-requested-with': 'XMLHttpRequest',
    'x-svc-source': '__RESULTS_FRONTEND__'
};

async function testApi() {
    const tsFrom = 1768770000;
    const tsTo = 1768856400;

    // We try v1 GET, v2 POST, v3 GET etc
    const configs = [
        { url: `https://sa.1xbet.com/service-api/result/web/api/v2/games?champId=19853&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`, method: 'POST' },
        { url: `https://sa.1xbet.com/service-api/result/web/api/v1/games?champId=19853&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`, method: 'GET' },
        { url: `https://sa.1xbet.com/service-api/result/web/api/v1/games?champId=19853&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`, method: 'POST' }
    ];

    for (const conf of configs) {
        try {
            console.log(`\nTesting: ${conf.method} ${conf.url}`);
            const res = await gotScraping({
                url: conf.url,
                method: conf.method,
                headers: COMMON_HEADERS,
                responseType: 'text',
                timeout: { request: 5000 }
            });
            console.log(`✅ Success (${res.statusCode})! Preview:`);
            console.log(res.body.substring(0, 500));
        } catch (error) {
            console.log(`❌ Failed: ${error.response ? error.response.statusCode : error.message}`);
            if (error.response && error.response.body) {
                console.log(`Body: ${error.response.body.substring(0, 200)}`);
            }
        }
    }
}

testApi();
