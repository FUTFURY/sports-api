import { gotScraping } from 'got-scraping';

// THE REAL SOLUTION: 
// Looking at the match data from 1xBet we have:
//   STI = season-specific tournament hex ID (changes seasonally)
//   SGI = season-specific MATCH hex ID
// 
// But eventsstat TournSeasonInfo needs the "general" tournament ID (not season-specific).
// 
// TRICK: We can build the mapping on-the-fly. 
// CALL: TournSeasonInfo with tournamentId=<permanent_id>.
// The permanent ID can be FETCHED from a match's game stats page.
// 
// Let's try fetching the game stats with SGI to get the tournament info inside.

async function testGameStats() {
    const matchSGI = '699e947a5e99bd05c6ecf8b1'; // ATP Santiago match

    // This is the URL eventsstat.com/statisticpopup/game uses to load its API data
    const url = `https://eventsstat.com/en/services-api/SiteService/GameDetailedStatistic?gameId=${matchSGI}&sId=4&ln=en&partner=1&geo=1`;
    console.log('Testing:', url.split('com/')[1].split('?')[0]);

    const res = await gotScraping.get(url, { responseType: 'json' });
    if (res.body && typeof res.body === 'object') {
        console.log('Keys:', Object.keys(res.body));
        if (res.body.T) {
            console.log('T.T:', res.body.T.T);
            console.log('T.I:', res.body.T.I); // This might be the permanent tournament ID!
        }
    } else {
        console.log('Response:', JSON.stringify(res.body).substring(0, 200));
    }
}
testGameStats();
