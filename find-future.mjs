import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://sa.1xbet.com/en/line/tennis',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br'
};

async function checkFuturParams() {
    const MAIN_BASE_URL = 'https://sa.1xbet.com';
    const endpoints = [
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=4&lng=en&mode=4&country=158&getEmpty=true`, // no count
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=4&limit=1000&lng=en&mode=4&country=158&getEmpty=true`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_Zip?sports=4&lng=en&mode=4&country=158`, // VZip vs Zip
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=4&count=50&lng=en&mode=4&country=158&getEmpty=true&group=12`,
    ];

    for (const url of endpoints) {
        try {
            const response = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
            const matches = response.body?.Value || [];

            let maxDate = 0;
            let days = new Set();
            matches.forEach(m => {
                if (m.S > maxDate) maxDate = m.S;
                if (m.S) days.add(new Date(m.S * 1000).toISOString().split('T')[0]);
            });

            console.log(`\nURL: ${url}`);
            console.log(`✅ Loaded ${matches.length} matches.`);
            console.log('Days covered: ', Array.from(days).sort());
        } catch (e) {
            console.log(`❌ Failed: ${e.message}`);
        }
    }
}

checkFuturParams();
