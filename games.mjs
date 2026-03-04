import { gotScraping } from 'got-scraping';

async function testApi() {
    const tsFrom = 1768770000;
    const tsTo = 1768856400;

    const rootUrl = `https://sa.1xbet.com/service-api/result/web/api`;
    const paths = ['v1/games', 'v2/games', 'v3/games', 'v1/games/bychamp', 'games'];

    for (const p of paths) {
        const url = `${rootUrl}/${p}?champId=19853&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`;
        try {
            console.log(`\nURL: ${url}`);
            const res = await gotScraping.get(url, { responseType: 'text', timeout: { request: 3000 } });
            console.log(`✅ Success (${res.statusCode}):`, res.body.substring(0, 200));
        } catch (e) {
            console.log(`❌ Failed:`, e.response ? e.response.statusCode : e.message);
            if (e.response && e.response.body && !e.response.body.includes('<!DOCTYPE html>')) {
                console.log(e.response.body.substring(0, 150));
            }
        }
    }
}
testApi();
