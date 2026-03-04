import { fetchPastMatches } from './services/1xbetService.js';

async function verify() {
    const d = new Date();
    d.setDate(d.getDate() - 3); // 3 days ago
    const iso = d.toISOString().split('T')[0];
    console.log("Fetching past matches for", iso);

    const results = await fetchPastMatches(iso);
    console.log(`Found ${results.length} past matches.`);
    if (results.length > 0) {
        console.log(JSON.stringify(results[0], null, 2));
    }
}
verify();
