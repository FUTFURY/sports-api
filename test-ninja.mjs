import { gotScraping } from 'got-scraping';

async function testWorkingURL() {
    const url = 'https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=4&count=40&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true&noFilterBlockEvent=true';
    console.log(`🚀 Test de l'URL via gotScraping (bypass TLS fingerprinting)...`);

    try {
        const res = await gotScraping.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://sa.1xbet.com/en/live/tennis',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        console.log(`✅ Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            const data = JSON.parse(res.body);
            console.log(`✅ Succès ! ${data.Value.length} matchs Live trouvés.`);
            if (data.Value.length > 0) {
                console.log(`Détails du premier match :`, {
                    id: data.Value[0].I,
                    p1: data.Value[0].O1E,
                    p2: data.Value[0].O2E,
                    league: data.Value[0].L
                });
            }
        } else {
            console.log(`Aïe, réponse inattendue :`, res.body.substring(0, 200));
        }
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
        if (error.response) console.log(`Code HTTP: ${error.response.statusCode}`);
    }
}

testWorkingURL();
