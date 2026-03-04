import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
};

async function inspectChamps() {
    const url = `https://sa.1xbet.com/service-api/LineFeed/GetChampsZip?sport=1&lng=en&country=158`;
    const res = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
    const champs = res.body?.Value || [];

    console.log(`Loaded ${champs.length} champs.`);
    if (champs.length > 0) {
        console.log("Example champ:", JSON.stringify(champs[0], null, 2));
    }
}
inspectChamps();
