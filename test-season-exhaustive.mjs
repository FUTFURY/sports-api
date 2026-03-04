import { gotScraping } from 'got-scraping';

// Direct test with all possible IDs and params
async function testAll() {
    const idsToTest = [
        '699a0b7b5e99bd05c6eaabba', // STI from match data (tournFetchTournaments' eventsstatId)
        '5abc9cf7494765f3cac8d2f7', // Permanent ID found by browser subagent
    ];

    const paramNames = ['tournamentId', 'seasonId'];
    const partners = ['0', '1'];

    for (const id of idsToTest) {
        for (const param of paramNames) {
            for (const partner of partners) {
                const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?${param}=${id}&sId=4&ln=en&partner=${partner}&geo=1`;
                try {
                    const res = await gotScraping.get(url, { responseType: 'json' });
                    const ok = res.body && res.body.T;
                    console.log(`${ok ? '✅' : '❌'} param=${param}, partner=${partner}, id=${id.substring(0, 8)}... → ${ok ? res.body.T.T : 'empty'}`);
                } catch (e) {
                    console.log(`❌ ERROR param=${param}, partner=${partner}: ${e.message}`);
                }
            }
        }
    }
}
testAll();
