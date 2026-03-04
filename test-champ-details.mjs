import { gotScraping } from 'got-scraping';

// NEW STRATEGY: Cache an STI → permanent ID mapping at startup.
// 
// Since TournSeasonInfo(season_id=STI) returns empty,
// but TournSeasonInfo(tournamentId=PERMANENT_ID) returns data with T.I = permanent ID,
// 
// We can build the map by scanning all active matches (which have STI from 1xBet),
// and calling a special endpoint to resolve each STI to its permanent ID.
// 
// But wait — let's try the reverse: call TournSeasonInfo with STI as seasonId specifically.
// Already tested — doesn't work.
// 
// REAL SOLUTION: The match data from 1xBet has BOTH STI and SGI (for matches).
// For tournaments, we need to find any match in that tournament and use SGI's tournament component.
// 
// Let's check: is there a GetChampDetails endpoint in the 1xBet API?

async function testChampDetails() {
    const champId = 31663; // ATP Santiago
    const urls = [
        `https://sa.1xbet.com/service-api/LineFeed/GetChampDetails?champId=${champId}&lng=en`,
        `https://sa.1xbet.com/service-api/LineFeed/GetChampInfoZip?id=${champId}&lng=en&country=158`,
        `https://sa.1xbet.com/service-api/LineFeed/GetLeagueInfo?id=${champId}&lng=en&country=158`,
    ];

    for (const url of urls) {
        const label = url.split('/LineFeed/')[1].split('?')[0];
        try {
            const res = await gotScraping.get(url, { responseType: 'json' });
            const val = res.body?.Value;
            console.log(`${val ? '✅' : '❌'} ${label}: ${val ? JSON.stringify(val).substring(0, 200) : 'no Value'}`);
        } catch (e) {
            console.error(`❌ ${label}: ${e.message}`);
        }
    }
}
testChampDetails();
