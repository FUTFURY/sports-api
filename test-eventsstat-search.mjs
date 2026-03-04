import { gotScraping } from 'got-scraping';

// Try to find the permanent tournament ID by searching on EventsStat
async function searchTournament(name) {
    const url = `https://eventsstat.com/en/services-api/SiteService/Search?text=${encodeURIComponent(name)}&sId=4&ln=en&partner=1&geo=1&limit=10`;
    console.log(`Searching for: ${name}`);
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        console.log('Result:', JSON.stringify(res.body, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

searchTournament('Santiago');
