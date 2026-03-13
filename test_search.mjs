import { searchGlobal } from './services/1xbetService.js';

async function test() {
    console.log("Searching for 'Premier League'...");
    const results = await searchGlobal('Premier League');
    console.log("Results found:", results.length);

    // Log all types found
    const types = [...new Set(results.map(r => r.type))];
    console.log("Types found:", types);

    results.slice(0, 10).forEach(r => {
        console.log(`- [${r.type}] ${r.name} (ID: ${r.id})`);
    });

    console.log("\nFull data for first athlete:", results.find(r => r.type === 'player'));
    console.log("\nFull data for first league:", results.find(r => r.type === 'league'));
}

test();
