import { gotScraping } from 'got-scraping';

// The real solution: get the permanent ID from match data via GetGameZip
// Match data should contain STI for season AND possibly a permanent tournament ID

async function testGameZip() {
    // Get a match for Santiago - we know LI=31663 for ATP Santiago
    // First let's check GetSportsShortZip more carefully
    const url = 'https://sa.1xbet.com/service-api/LineFeed/Get1x2_VZip?sports=4&count=10&lng=en&mode=4&country=158&getEmpty=true';

    const res = await gotScraping.get(url, { responseType: 'json' });
    const match = res.body?.Value?.find(m => m.LI === 31663);

    if (match) {
        console.log('Found ATP Santiago match!');
        console.log('SGI (match permanentId):', match.SGI);
        console.log('STI (season-specific tournament HexId):', match.STI);

        // The STI is season-specific. But TournSeasonInfo needs permanent id.
        // Let's try fetching the game detail to see if it has more ID info
        const gameUrl = `https://sa.1xbet.com/service-api/LineFeed/GetGameZip?id=${match.I}&lng=en&mode=4&country=158`;
        const gameRes = await gotScraping.get(gameUrl, { responseType: 'json' });
        const game = gameRes.body?.Value;
        if (game) {
            console.log('Full game STI:', game.STI);
            console.log('Is STI same as match STI?', game.STI === match.STI);
            // Check if there's anything like 'TournId' or 'CHI' or different field
            const allKeys = Object.keys(game).filter(k => k.includes('T') || k.includes('ID') || k.includes('i'));
            console.log('Possible ID keys in game:', allKeys);
        }
    } else {
        console.log('No Santiago match today in upcoming, checking all matches...');
        const matches = res.body?.Value || [];
        console.log('Available tournaments:', [...new Set(matches.map(m => m.L))]);
    }
}
testGameZip();
