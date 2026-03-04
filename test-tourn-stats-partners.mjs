import { gotScraping } from 'got-scraping';

async function testStats(id) {
    // Try both partner 0 and 1
    for (let p of [0, 1]) {
        const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${id}&sId=4&ln=en&partner=${p}&geo=1`;
        console.log(`Testing TournSeasonInfo (partner=${p}) for ID: ${id}`);
        try {
            const res = await gotScraping.get(url, { responseType: 'json' });
            if (res.body && res.body.T) {
                console.log(`✅ Success with partner=${p}! Tournament:`, res.body.T.T);
            } else {
                console.log(`❌ Failed with partner=${p}. Body:`, JSON.stringify(res.body).substring(0, 100));
            }
        } catch (e) {
            console.error(`❌ Error with partner=${p}:`, e.message);
        }
    }
}

testStats('699a0b7b5e99bd05c6eaabba');
