import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://sa.1xbet.com/en/line/football',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br'
};

async function testFootballChamps() {
    const MAIN_BASE_URL = 'https://sa.1xbet.com';
    const cid = 118593; // UEFA Europa League

    const urls = [
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&champs=${cid}&lng=en&country=158`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sport=1&champs=${cid}&lng=en&country=158`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&champ=${cid}&lng=en&country=158`,
        `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=1&champId=${cid}&lng=en&country=158`,
    ];

    for (const u of urls) {
        const res = await gotScraping.get(u, { headers: COMMON_HEADERS, responseType: 'json' });
        console.log(`URL: ${u}`);
        console.log(`Loaded: ${res.body?.Value?.length || 0}`);
    }
}

testFootballChamps();
