import { fetchTournamentDetails } from './services/1xbetService.js';

async function test() {
    const id = 41097; // Challenger Saint-Brieuc from user screenshot
    console.log(`Testing fetchTournamentDetails for ID: ${id}`);
    try {
        const result = await fetchTournamentDetails(id);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
