import { gotScraping } from 'got-scraping';

// Let's try a completely different strategy: 
// call TournamentSeasonDetails or TournamentListExt from eventsstat
// to get the season → permanent ID mapping.
// OR: use the 1xBet search which returns SGI/STI per match.

async function testEventsStatEndpoints() {
    const stid = '699a0b7b5e99bd05c6eaabba'; // STI

    const urlsToTry = [
        `https://eventsstat.com/en/services-api/SiteService/TournamentSeasonDetails?tournamentId=${stid}&sId=4&ln=en&partner=1&geo=1`,
        `https://eventsstat.com/en/services-api/SiteService/TournamentInfo?tournamentId=${stid}&sId=4&ln=en&partner=1&geo=1`,
        `https://eventsstat.com/en/services-api/SiteService/SeasonInfo?seasonId=${stid}&sId=4&ln=en&partner=1&geo=1`,
        `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?seasonId=${stid}&sId=4&ln=en&partner=1&geo=1`,
    ];

    for (const url of urlsToTry) {
        const label = url.split('SiteService/')[1].split('?')[0] + ' ' + url.split('?')[1].split('&')[0];
        try {
            const res = await gotScraping.get(url, { responseType: 'json' });
            if (res.body && res.body.T) {
                console.log(`✅ ${label}: Tournament = ${res.body.T.T}, ID = ${res.body.T.I}`);
            } else {
                const bodyStr = JSON.stringify(res.body);
                console.log(`❌ ${label}: ${bodyStr.substring(0, 80)}`);
            }
        } catch (e) {
            console.error(`❌ ${label}: ${e.message}`);
        }
    }
}
testEventsStatEndpoints();
