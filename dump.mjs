import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
    'Origin': 'https://sa.1xbet.com',
    'Referer': 'https://sa.1xbet.com/en/results',
};

async function getFullItem() {
    try {
        const tsFrom = 1768770000;
        const tsTo = 1768856400;

        console.log(`Dates: ${tsFrom} - ${tsTo}`);
        const champsUrl = `https://sa.1xbet.com/service-api/result/web/api/v2/champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportIds=4`;
        const res1 = await gotScraping.get(champsUrl, { headers: COMMON_HEADERS });
        const champsRes = JSON.parse(res1.body);

        if (champsRes.items && champsRes.items.length > 0) {
            const champ = champsRes.items[0];
            console.log(`Champ: ${champ.name} (${champ.id})`);

            const gamesUrl = `https://sa.1xbet.com/service-api/result/web/api/v3/games?champId=${champ.id}&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`;
            const res2 = await gotScraping.get(gamesUrl, { headers: COMMON_HEADERS });
            const gamesRes = JSON.parse(res2.body);

            if (gamesRes.items && gamesRes.items.length > 0) {
                console.log(JSON.stringify(gamesRes.items[0], null, 2));
                console.log("\n\nFull item 2:");
                if (gamesRes.items[1]) console.log(JSON.stringify(gamesRes.items[1], null, 2));
            } else {
                console.log("No games found for champ", champ.id);
            }
        } else {
            console.log("No champs found");
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(e.response.body);
    }
}
getFullItem();
