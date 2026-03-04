import { fetchUpcomingMatches } from './services/1xbetService.js';

async function checkFutur() {
    console.log("Loading all upcoming matches from 1xBet LineFeed...");
    const upcoming = await fetchUpcomingMatches();
    console.log(`✅ Loaded ${upcoming.length} upcoming matches programmed in the future.\n`);

    const daysCount = {};

    upcoming.forEach(match => {
        if (!match.startTime) return;
        const d = new Date(match.startTime * 1000);
        d.setHours(0, 0, 0, 0);
        const dateStr = d.toISOString().split('T')[0];

        daysCount[dateStr] = (daysCount[dateStr] || 0) + 1;
    });

    // Sort and display counts per future day
    const sortedDays = Object.keys(daysCount).sort();
    console.log("📅 MATCHS FUTURS PROGRAMMÉS PAR JOUR :");
    sortedDays.forEach(day => {
        console.log(`- ${day} : ${daysCount[day]} matchs prévus`);
    });
}

checkFutur();
