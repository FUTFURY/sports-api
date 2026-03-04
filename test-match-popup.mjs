import { gotScraping } from 'got-scraping';

// The STI is the season ID. The permanent tournament ID must be resolved differently.
// Approach: Use the eventsstat stats popup URL to get tournament page HTML, 
// then parse the permanent tournament ID from the response.
// 
// Simpler approach: build a local mapping by calling TournSeasonInfo for a one-time 
// mapping of season IDs to permanent IDs.
// Or even simpler: just call eventsstat popup URL with the SGI (match hex ID), 
// and let eventsstat handle it internally.
// 
// Let's verify: does the stats popup for a match ALSO include tournament info?

async function testMatchPopup() {
    const matchHexId = '699e947a5e99bd05c6ecf8b1'; // From previous test, Santiago match

    // Try the popup API for match stats
    const urls = [
        `https://eventsstat.com/en/services-api/SiteService/MainStatistic?gameId=${matchHexId}&sId=4&ln=en&partner=1&geo=1`,
        `https://eventsstat.com/en/services-api/SiteService/GameDetailMainPage?gameId=${matchHexId}&sId=4&ln=en&partner=1&geo=1`,
    ];

    for (const url of urls) {
        const label = url.split('SiteService/')[1].split('?')[0];
        try {
            const res = await gotScraping.get(url, { responseType: 'json' });
            if (typeof res.body === 'object' && !Array.isArray(res.body)) {
                const keys = Object.keys(res.body);
                console.log(`✅ ${label}: ${keys.length} keys. Has T? ${!!res.body.T}`);
                if (res.body.T) console.log('  T.T (name):', res.body.T.T);
                if (res.body.T?.I) console.log('  T.I (permanent id):', res.body.T.I);
            } else {
                console.log(`❌ ${label}: Got non-object response (${typeof res.body})`);
            }
        } catch (e) {
            console.error(`❌ ${label}: ${e.message}`);
        }
    }
}
testMatchPopup();
