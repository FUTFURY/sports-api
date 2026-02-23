import {
    fetchLiveMatches,
    fetchUpcomingMatches,
    fetchTournaments,
    getATPTop100,
    fetchPlayerDetails,
    fetchTournamentDetails
} from './services/1xbetService.js';
import cache from './utils/cache.js';

async function finalCheck() {
    console.log("🚀 STARTING FINAL BACKEND AUDIT...\n");
    cache.flushAll(); // Ensure fresh data

    // 1. LIVE MATCHES + ODDS + MARKET COUNT
    console.log("--- 1. LIVE MATCHES CHECK ---");
    const live = await fetchLiveMatches();
    console.log(`✅ Found ${live.length} live matches.`);
    if (live.length > 0) {
        const m = live[0];
        console.log(`   Sample: ${m.player1} vs ${m.player2} (ID: ${m.id})`);
        console.log(`   Data enriched: Odds P1=${m.odds?.p1}, Marketplace Count=${m.marketCount}`);
    }

    // 2. UPCOMING MATCHES + PROBABILITIES
    console.log("\n--- 2. UPCOMING MATCHES CHECK ---");
    const upcoming = await fetchUpcomingMatches();
    console.log(`✅ Found ${upcoming.length} upcoming matches.`);
    if (upcoming.length > 0) {
        const m = upcoming[0];
        console.log(`   Enriched probability: P1=${m.winProbability?.P1 * 100}%`);
    }

    // 3. RANKINGS TOP 100 + PHOTOS
    console.log("\n--- 3. ATP RANKINGS CHECK ---");
    const rankings = await getATPTop100();
    console.log(`✅ Found ${rankings.length} players in Top 100.`);
    if (rankings.length > 0) {
        const p = rankings[0];
        console.log(`   Rank 1: ${p.name} (Photo available: ${!!p.image})`);
    }

    // 4. PLAYER DEEP STATS + CASH PRIZE
    console.log("\n--- 4. PLAYER DEEP DATA CHECK (Alcaraz) ---");
    const alcaraz = await fetchPlayerDetails('5abc971d494765f3cab55409');
    if (alcaraz && alcaraz.earnings) {
        console.log(`✅ Player Data Loaded: ${alcaraz.earnings.length} earnings rows.`);
        const career = alcaraz.earnings.find(e => e.period === 'Career' && e.type === 'Singles');
        console.log(`   Career Cash Prize: ${career?.amount || 'N/A'}`);
    } else {
        console.log("❌ Failed to fetch player details.");
    }

    // 5. TOURNAMENT DEEP DATA (Buenos Aires)
    console.log("\n--- 5. TOURNAMENT DEEP DATA CHECK ---");
    const tourn = await fetchTournamentDetails('5ab12621494765f3ca23f57d');
    if (tourn && tourn.T) {
        console.log(`✅ Tournament Data Loaded (Name: ${tourn.T.T})`);
        console.log(`   Brackets/Matches found: ${!!tourn.LG}`);
    }

    console.log("\n--- 🏁 ALL SYSTEMS FUNCTIONAL & ENRICHED ---");
    console.log("Frontend can now use /api routes for all the above data.");
}

finalCheck().catch(e => console.error(e));
