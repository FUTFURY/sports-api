import { gotScraping } from 'got-scraping';

async function testMatchMapping() {
    const url = 'https://sa.1xbet.com/service-api/LineFeed/Get1x2_VZip?sports=4&count=10&lng=en&mode=4&country=158&getEmpty=true';

    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        const matches = res.body?.Value || [];
        console.log(`Loaded ${matches.length} matches.`);
        if (matches.length > 0) {
            console.log("Example match mapping:");
            console.log(JSON.stringify(matches[0], null, 2));
        }
    } catch (e) {
        console.error(e.message);
    }
}
testMatchMapping();
