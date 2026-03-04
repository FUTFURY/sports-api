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
        'results/v1/sports',
        'results/v1/champs',
        'results/v1/games',
        'results/sports',
        'results/champs',
        'results/games',
        'api/results/sports',
        'api/v1/results/sports',
        'bff-api/results/v1/sports',
        'bff-api/v1/results/sports',
        'bff-api/results/sports',
        'bff-api/events/sports',
        'bff/results/sports',
        'bff/v1/results/sports'
    ];

    for (const p of paths) {
        let url = `https://sa.1xbet.com/${p}?cyberFlag=4&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en`;
        if (p.includes('champs')) url = `https://sa.1xbet.com/${p}?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportId=4`;
        if (p.includes('games')) url = `https://sa.1xbet.com/${p}?champId=19853&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en`;

        try {
            const res = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'text', timeout: { request: 3000 } });
            if (res.statusCode !== 404 && !res.body.includes('Route not found') && !res.body.includes('<!DOCTYPE html>')) {
                console.log(`\n🎉 BINGO!! ${url} -> ${res.statusCode} : ${res.body.substring(0, 150)}`);
            } else {
                process.stdout.write(".");
            }
        } catch (e) {
            if (e.response && e.response.statusCode === 404) { process.stdout.write("."); }
            else if (e.response && e.response.statusCode === 403) { process.stdout.write("x"); }
            else if (e.response && e.response.statusCode === 203) { process.stdout.write("B"); } // Blocked
            else process.stdout.write("E");
        }
    }
}
check();
