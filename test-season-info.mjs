import { gotScraping } from 'got-scraping';

// The browser subagent confirmed that TournSeasonInfo uses a DIFFERENT tournament ID.
// It uses a generic tournamentId (like "5abc9cf7494765f3cac8d2f7") which is the PERMANENT ID across all seasons.
// The STI from match data is the SEASON-SPECIFIC ID (changes each year).
// So we need to get the permanent tournament ID somehow.
// Let's look at the TournamentSeasonInfo using the season ID and check if we can get the permanent tournament ID from it.

async function testSeasonInfo(sexId) {
    const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${sexId}&sId=4&ln=en&partner=1&geo=1`;
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        if (res.body && res.body.T) {
            console.log('✅ Success with season ID! Tournament =', res.body.T.T);
            console.log('Keys in T:', Object.keys(res.body.T));
            console.log('Full T object:', JSON.stringify(res.body.T, null, 2));
        } else {
            console.log(`❌ Failed. Body type: ${typeof res.body}`);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

// Try the "general" Santiago ID that the browser subagent found
testSeasonInfo('5abc9cf7494765f3cac8d2f7');
// Try the season-specific ID (STI) we see in match data
testSeasonInfo('699a0b7b5e99bd05c6eaabba');
