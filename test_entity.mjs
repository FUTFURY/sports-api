import { fetchWithRotation } from './services/robustSearchService.js';

async function testAthlete() {
    console.log("Testing athlete detail for Novak Djokovic...");
    const id = '5abf2e56494765f3cafefafa'; // Novak Djokovic from search results
    const path = `/en/services-api/SiteService/PlayerDetailed?playerId=${id}&ln=en&partner=1&geo=158`;

    try {
        const data = await fetchWithRotation(path, 'stat');
        console.log("Athlete data received:", !!data);
        if (data) {
            console.log("Keys in response:", Object.keys(data));
            console.log("Player name in T:", data.T?.T || data.T?.N);
            console.log("Player name in P:", data.P?.N || data.P?.T);
        }
    } catch (e) {
        console.error("Athlete detail failed:", e.message);
    }
}

async function testLeague() {
    console.log("\nTesting league detail for Premier League (England)...");
    const id = '5ab11e5c494765f3ca235f8f'; // Example league ID from user request
    const path = `/en/services-api/SiteService/StandingDetailed?tournId=${id}&ln=en&partner=1&geo=158`;

    try {
        const data = await fetchWithRotation(path, 'stat');
        console.log("League data received:", !!data);
        if (data) {
            console.log("Keys in response:", Object.keys(data));
            console.log("Tournament name in T:", data.T?.T || data.T?.N);
        }
    } catch (e) {
        console.error("League detail failed:", e.message);
    }
}

async function run() {
    await testAthlete();
    await testLeague();
}

run();
