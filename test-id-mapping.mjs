import { gotScraping } from 'got-scraping';

// Try to get permanent tournament ID via the 1xBet Tournament info endpoint
// which might expose the STI→permanent mapping
async function tryDifferentApproaches() {
    // Option 1: 1xBet GetChampionshipZip with the tournament ID
    const urls = [
        'https://sa.1xbet.com/service-api/LineFeed/GetChampsZip?sport=4&lng=en&country=158',
        'https://sa.1xbet.com/service-api/LineFeed/GetSportsShortZip?sports=4&lng=en&country=158',
        'https://eventsstat.com/en/services-api/SiteService/MainStatistic?tournamentId=5abc9cf7494765f3cac8d2f7&sId=4&ln=en&partner=1&geo=1',
    ];

    for (const url of urls) {
        console.log('\nTesting:', url.replace('https://', '').split('?')[0]);
        try {
            const res = await gotScraping.get(url, { responseType: 'json' });
            const data = res.body;
            if (data?.Value) {
                // 1xBet response
                const champ = data.Value.find(c => c.LI === 31663);
                if (champ) {
                    console.log('Found ATP Santiago champ:', JSON.stringify(champ, null, 2));
                } else {
                    console.log('ATP Santiago not found. Total champs:', data.Value.length);
                    // Show first champ to check for STI field
                    console.log('First champ keys:', Object.keys(data.Value[0] || {}));
                }
            } else {
                const keys = Object.keys(data || {});
                console.log('Response keys:', keys.slice(0, 10));
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
    }
}
tryDifferentApproaches();
