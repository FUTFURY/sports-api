import { searchEntitiesRobust, searchEventsRobust } from './services/robustSearchService.js';

async function test() {
    console.log('--- TESTING ROBUST ENTITIES ---');
    try {
        const entities = await searchEntitiesRobust('PSG', 1);
        console.log('Entities Success:', (entities.data || []).length, 'found');
    } catch (e) {
        console.error('Entities Failed all domains:', e.message);
    }

    console.log('\n--- TESTING ROBUST EVENTS ---');
    try {
        const events = await searchEventsRobust('PSG');
        console.log('Events Success:', (events.Value || []).length, 'found');
    } catch (e) {
        console.error('Events Failed all domains:', e.message);
    }
}

test();
