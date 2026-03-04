import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
    'Origin': 'https://sa.1xbet.com',
    'Referer': 'https://sa.1xbet.com/en/results',
};

async function testApi() {
    const tsFrom = 1768770000;
    const tsTo = 1768856400;

    try {
        const url = `https://sa.1xbet.com/service-api/result/web/api/v2/games?champId=19853&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`;
        console.log(`\nTesting OPTIONS: ${url}`);
        const res = await gotScraping({
            url: url,
            method: 'OPTIONS',
            headers: COMMON_HEADERS,
            responseType: 'text',
            timeout: { request: 5000 }
        });
        console.log(`✅ Success (${res.statusCode})! Headers:`);
        console.log(res.headers['allow'] || res.headers['access-control-allow-methods']);
    } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        if (error.response) {
            console.log(`Allow Header:`, error.response.headers['allow'] || error.response.headers['access-control-allow-methods']);
        }
    }

    try {
        const urlv2 = `https://sa.1xbet.com/service-api/result/web/api/v2/games/19853?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`;
        console.log(`\nTesting GET v2 games/id: ${urlv2}`);
        const res2 = await gotScraping.get(urlv2, { headers: COMMON_HEADERS, responseType: 'text' });
        console.log('✅ Success:', res2.body.substring(0, 300));
    } catch (e) { console.log('❌ Failed GET games/id'); }
}

testApi();
