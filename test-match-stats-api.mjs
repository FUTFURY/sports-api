import { gotScraping } from 'got-scraping';

async function testPopup(matchHexId) {
    // Note: The subagent saw /main at the end, let's see if it's JSON
    const url = `https://eventsstat.com/en/services-api/SiteService/MainStatistic?gameId=${matchHexId}&lng=en&partner=1&geo=1`;
    console.log(`Testing MainStatistic with gameId: ${matchHexId}`);
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        console.log('Keys in response:', Object.keys(res.body || {}));
        if (res.body?.T) {
            console.log('Tournament Info:', {
                name: res.body.T.T,
                tournamentId: res.body.T.I, // Is this the general hex ID?
                seasonId: res.body.T.SI    // Is this the season ID?
            });
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

// Use Zverev match hex ID from subagent
testPopup('699ea35d5e99bd05c6ecfef7');
