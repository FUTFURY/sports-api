import { gotScraping } from 'got-scraping';

async function testChampsMapping() {
    const url = 'https://sa.1xbet.com/service-api/LineFeed/GetChampsZip?sport=4&lng=en&country=158';

    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        const champs = res.body?.Value || [];
        console.log(`Loaded ${champs.length} championships.`);
        if (champs.length > 0) {
            console.log("Example championship mapping:");
            // Look for STI and LI
            const sample = champs.find(c => c.STI) || champs[0];
            console.log(JSON.stringify(sample, null, 2));
        }
    } catch (e) {
        console.error(e.message);
    }
}
testChampsMapping();
