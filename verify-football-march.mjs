import { fetchFutureMatches } from './services/1xbetService.js';

async function verifyFootballMarch() {
    const marchDate = '2026-03-01';
    const sportFootball = 1;

    console.log(`Checking football matches for ${marchDate}...`);
    const matches = await fetchFutureMatches(marchDate, sportFootball);

    console.log(`✅ Found ${matches.length} football matches.`);
    if (matches.length > 0) {
        matches.slice(0, 5).forEach(m => {
            console.log(`- [${new Date(m.startTime * 1000).toUTCString()}] ${m.tournamentName} : ${m.player1} vs ${m.player2}`);
        });
    }
}
verifyFootballMarch();
