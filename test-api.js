import {
    fetchLiveMatches,
    fetchUpcomingMatches,
    fetchTournaments,
    getATPTop100,
    getWTATop100
} from './services/1xbetService.js';

async function testEndpoints() {
    console.log('🚀 Starting API Endpoints Test (ESM Mode)...\n');

    try {
        // 1. Test Live Matches
        console.log('--- 🎾 LIVE MATCHES ---');
        const live = await fetchLiveMatches();
        console.log(`Found ${live.length} live matches.`);
        if (live.length > 0) {
            console.log('Sample:', JSON.stringify(live[0], null, 2));
        }
        console.log('\n');

        // 2. Test Upcoming Matches
        console.log('--- 📅 UPCOMING MATCHES ---');
        const upcoming = await fetchUpcomingMatches();
        console.log(`Found ${upcoming.length} upcoming matches.`);
        if (upcoming.length > 0) {
            console.log('Sample:', JSON.stringify(upcoming[0], null, 2));
        }
        console.log('\n');

        // 3. Test Tournaments
        console.log('--- 🏆 TOURNAMENTS ---');
        const tournaments = await fetchTournaments();
        console.log(`Found ${tournaments.length} active tournaments.`);
        if (tournaments.length > 0) {
            console.log('Sample:', JSON.stringify(tournaments[0], null, 2));
        }
        console.log('\n');

        // 4. Test ATP Rankings
        console.log('--- 🥇 ATP RANKINGS (TOP 100) ---');
        const atp = await getATPTop100();
        console.log(`Fetched ${atp.length} ATP players.`);
        if (atp.length > 0) {
            console.log('Sample Top 3:');
            console.table(atp.slice(0, 3));
        }
        console.log('\n');

        // 5. Test WTA Rankings
        console.log('--- 🏅 WTA RANKINGS (TOP 100) ---');
        const wta = await getWTATop100();
        console.log(`Fetched ${wta.length} WTA players.`);
        if (wta.length > 0) {
            console.log('Sample Top 3:');
            console.table(wta.slice(0, 3));
        }

        console.log('\n✅ All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testEndpoints();
