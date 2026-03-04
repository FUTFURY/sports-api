import { fetchUpcomingMatches } from './services/1xbetService.js';

async function verify() {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    const requestedDate = d.setHours(0, 0, 0, 0);
    const nextDate = new Date(requestedDate).setDate(new Date(requestedDate).getDate() + 1);

    console.log("Fetching future matches for tomorrow");

    const upcoming = await fetchUpcomingMatches();
    console.log(`Total upcoming fetched: ${upcoming.length}`);

    const filtered = upcoming.filter(match => {
        if (!match.startTime) return false;
        const matchTimeMs = match.startTime * 1000;
        return matchTimeMs >= requestedDate && matchTimeMs < nextDate;
    });

    console.log(`Found ${filtered.length} future matches for tomorrow.`);
    if (filtered.length > 0) {
        console.log(JSON.stringify(filtered[0], null, 2));
    }
}
verify();
