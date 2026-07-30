import { fetchLiveMatches, fetchMatchDetails } from '../services/1xbetService.js';

async function main() {
    try {
        console.log("Fetching live football matches...");
        const matches = await fetchLiveMatches(1); // 1 = Football
        console.log(`Found ${matches.length} live matches.`);

        if (matches.length === 0) {
            console.log("No live football matches found.");
            return;
        }

        console.log("Scanning all matches detailed data (concurrently, in batches of 10) to find if any has Z or Z2D...");

        const batchSize = 10;
        let foundAny = false;

        for (let i = 0; i < matches.length; i += batchSize) {
            const batch = matches.slice(i, i + batchSize);
            console.log(`Checking batch indices ${i} to ${i + batch.length - 1}...`);
            
            const results = await Promise.all(
                batch.map(async (m) => {
                    try {
                        const details = await fetchMatchDetails(m.id, true);
                        return { match: m, details };
                    } catch (e) {
                        return { match: m, details: null, error: e.message };
                    }
                })
            );

            for (const { match, details, error } of results) {
                if (error) {
                    console.log(`- Error fetching ${match.title} (ID: ${match.id}): ${error}`);
                    continue;
                }
                if (details && (details.zone || details.radar2D)) {
                    console.log(`\n🎉 FOUND ONE!`);
                    console.log(`Match: ${details.title} (ID: ${details.id})`);
                    console.log(`Tournament: ${details.tournamentName}`);
                    console.log(`Zone field (Z):`, JSON.stringify(details.zone, null, 2));
                    console.log(`Radar2D field (Z2D):`, JSON.stringify(details.radar2D, null, 2));
                    foundAny = true;
                }
            }
        }

        if (!foundAny) {
            console.log("\nNone of the currently live football matches have Z or Z2D coordinates.");
        }
    } catch (err) {
        console.error("Error in test_live_game_zip:", err);
    }
}

main();
