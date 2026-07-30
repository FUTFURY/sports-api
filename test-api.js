import {
    fetchLiveMatches,
    fetchUpcomingMatches,
    fetchPastMatches,
    fetchTournaments,
    getATPTop100,
    getWTATop100
} from './services/1xbetService.js';

const SPORT_FOOTBALL   = 1;
const SPORT_TENNIS     = 4;
const SPORT_BASKETBALL = 3;
const SPORT_RUGBY      = 7;

async function testEndpoints() {
    console.log('🚀 Test complet API multi-sports\n');

    // ── 1. Live Football ──────────────────────────────────────────────────
    console.log('--- ⚽ LIVE Football (ID=1) ---');
    const liveFootball = await fetchLiveMatches(SPORT_FOOTBALL);
    console.log(`  ${liveFootball.length} matchs live`);
    if (liveFootball[0]) console.log('  Sample:', liveFootball[0].title, '|', liveFootball[0].tournamentName);

    // ── 2. Live Tennis ────────────────────────────────────────────────────
    console.log('\n--- 🎾 LIVE Tennis (ID=4) ---');
    const liveTennis = await fetchLiveMatches(SPORT_TENNIS);
    console.log(`  ${liveTennis.length} matchs live`);
    if (liveTennis[0]) console.log('  Sample:', liveTennis[0].title, '| Score:', JSON.stringify(liveTennis[0].score));

    // ── 3. Upcoming Basketball ────────────────────────────────────────────
    console.log('\n--- 🏀 UPCOMING Basketball (ID=3) ---');
    const upcomingBball = await fetchUpcomingMatches(SPORT_BASKETBALL);
    console.log(`  ${upcomingBball.length} matchs à venir`);
    if (upcomingBball[0]) console.log('  Sample:', upcomingBball[0].title);

    // ── 4. Upcoming Rugby ─────────────────────────────────────────────────
    console.log('\n--- 🏉 UPCOMING Rugby (ID=7) ---');
    const upcomingRugby = await fetchUpcomingMatches(SPORT_RUGBY);
    console.log(`  ${upcomingRugby.length} matchs à venir`);
    if (upcomingRugby[0]) console.log('  Sample:', upcomingRugby[0].title);

    // ── 5. Past Results — Football hier ──────────────────────────────────
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    console.log(`\n--- 📆 PAST Football ${yesterday} ---`);
    const pastFoot = await fetchPastMatches(yesterday, SPORT_FOOTBALL);
    console.log(`  ${pastFoot.length} matchs passés`);
    if (pastFoot[0]) console.log('  Sample:', pastFoot[0].player1, 'vs', pastFoot[0].player2, '|', pastFoot[0].score?.global || pastFoot[0].score);

    // ── 6. Tournaments Football ───────────────────────────────────────────
    console.log('\n--- 🏆 TOURNAMENTS Football (ID=1) ---');
    const tourns = await fetchTournaments(SPORT_FOOTBALL);
    console.log(`  ${tourns.length} tournois actifs`);
    if (tourns[0]) console.log('  Sample:', tourns[0].name);

    // ── 7. Rankings ATP ───────────────────────────────────────────────────
    console.log('\n--- 🥇 RANKINGS ATP Top 5 ---');
    const atp = await getATPTop100();
    console.log(`  ${atp.length} joueurs`);
    for (const p of atp.slice(0, 5)) {
        console.log(`  #${p.rank} ${p.name} (${p.country || '?'}) — ${p.points} pts`);
    }

    // ── 8. Rankings WTA ───────────────────────────────────────────────────
    console.log('\n--- 🏅 RANKINGS WTA Top 5 ---');
    const wta = await getWTATop100();
    console.log(`  ${wta.length} joueuses`);
    for (const p of wta.slice(0, 5)) {
        console.log(`  #${p.rank} ${p.name} (${p.country || '?'}) — ${p.points} pts`);
    }

    console.log('\n✅ Tests terminés');
}

testEndpoints().catch(e => {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
});
