import { gotScraping } from 'got-scraping';

// Extract the permanent tournament ID from the match stats popup HTML.
// The popup HTML for any match in a tournament contains the permanent tournament ID.
// Pattern: permanent IDs start with "5abc" or similar "old" date-based ObjectIds.
// Season IDs start with "699..." (June 2024+)

async function extractPermanentTournId(matchSGI) {
    const url = `https://eventsstat.com/en/statisticpopup/game/tennis/${matchSGI}/main?hs=1&ln=en&partner=1&geo=1`;
    const res = await gotScraping.get(url);
    const html = res.body;

    // Find all 24-char hex IDs that are NOT season IDs (which start with 699)
    const allHexIds = [...new Set([...html.matchAll(/[a-f0-9]{24}/g)].map(m => m[0]))];
    // Filter: season IDs start with "699" (2024+), permanent IDs start with older prefixes like "5abc"
    const permanentIds = allHexIds.filter(id => !id.startsWith('699'));

    return permanentIds;
}

const sgid = '699e947a5e99bd05c6ecf8b1'; // ATP Santiago match SGI
const ids = await extractPermanentTournId(sgid);
console.log('Permanent IDs extracted from popup:', ids);

// Now test each to find which one is the tournament
for (const id of ids.slice(0, 5)) {
    const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${id}&sId=4&ln=en&partner=1&geo=1`;
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        if (res.body?.T?.T) {
            console.log(`✅ ${id} → Tournament: ${res.body.T.T}`);
        }
    } catch (e) { }
}
