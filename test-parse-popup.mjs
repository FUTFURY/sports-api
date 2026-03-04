import { gotScraping } from 'got-scraping';

// Let's check ALL exposed endpoints on eventsstat.com by looking at the statistics popup HTML
// The popup URL is: https://eventsstat.com/en/statisticpopup/game/tennis/<SGI>/main
// Let's parse the HTML to find the API calls it makes

async function parsePopupHTML() {
    const matchSGI = '699e947a5e99bd05c6ecf8b1'; // ATP Santiago match
    const url = `https://eventsstat.com/en/statisticpopup/game/tennis/${matchSGI}/main?hs=1&ln=en&partner=1&geo=1`;

    const res = await gotScraping.get(url);
    const html = res.body;

    // Find all /services-api/ references
    const apiMatches = [...html.matchAll(/services-api[^\s"']+/g)].map(m => m[0]).slice(0, 20);
    console.log('API endpoints found in HTML:');
    apiMatches.forEach(e => console.log(' -', e));

    // Also find any JSON data that might have tournamentId
    const tournIdMatches = [...html.matchAll(/"tournamentId"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
    console.log('\ntournamentId values in page:', [...new Set(tournIdMatches)]);
}
parsePopupHTML();
