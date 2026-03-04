import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
    'Origin': 'https://sa.1xbet.com',
    'Referer': 'https://sa.1xbet.com/en/line/football/88637-england-premier-league',
};

async function testPremierLeague() {
    const cid = 88637;
    const url = `https://sa.1xbet.com/service-api/LineFeed/Get1x2_VZip?sports=1&champs=${cid}&count=100&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;

    console.log("Fetching Premier League: " + url);

    try {
        const response = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
        const matches = response.body?.Value || [];
        console.log(`✅ Loaded ${matches.length} Premier League matches.`);

        let marchMatches = [];
        matches.forEach(m => {
            const d = new Date(m.S * 1000);
            if (d.getUTCMonth() === 2) { // March
                marchMatches.push({
                    date: d.toUTCString(),
                    teams: `${m.O1} vs ${m.O2}`
                });
            }
        });

        console.log(`Found ${marchMatches.length} matches in March:`);
        marchMatches.forEach(m => console.log(`- ${m.date}: ${m.teams}`));

    } catch (e) {
        console.log("Error: " + e.message);
    }
}
testPremierLeague();
