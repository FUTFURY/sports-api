import { fetchTournamentDetails } from './services/1xbetService.js';

async function test() {
    const id = 31663;
    console.log(`Testing numeric ID: ${id}`);
    const details = await fetchTournamentDetails(id);
    if (details) {
        console.log('Success! Tournament name:', details.T.T);
    } else {
        console.log('Failed to fetch details.');
    }
}
test();
