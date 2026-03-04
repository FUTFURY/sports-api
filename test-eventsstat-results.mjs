import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br'
};

const ATP_TOURN_ID = '5b19067ef87e5825813fb409'; // ATP

async function check() {
    const url = `https://eventsstat.com/en/services-api/SiteService/Results?tournamentId=${ATP_TOURN_ID}`;
    try {
        console.log(`Testing ${url}`);
        const res = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json', timeout: { request: 8000 } });
        console.log(`✅ Success for ${url}:`, res.body ? Object.keys(res.body) : 'No body');
        if (res.body && res.body.T && res.body.T.R) {
            console.log("Found rows:", res.body.T.R.length);
            console.log(JSON.stringify(res.body.T.R[0]).substring(0, 300));
        } else {
            console.log(`Preview:`, JSON.stringify(res.body).substring(0, 500));
        }
    } catch (e) {
        console.log(`❌ Failed for ${url}: ${e.response ? e.response.statusCode : e.message}`);
    }
}
check();
