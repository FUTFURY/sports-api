import { gotScraping } from 'got-scraping';

/**
 * Script de test complet pour la recherche.
 * 
 * Rechreche d'ENTITÉS (Teams, Leagues, Players):
 *   node test-search.mjs "lorient" [sportId]
 *   node test-search.mjs "pga" all
 * 
 * Recherche d'ÉVÉNEMENTS (Matchs réels):
 *   node test-search.mjs event "psg"
 */

const isEventMode = process.argv[2] === 'event';
const term = isEventMode ? process.argv[3] : (process.argv[2] || 'PSG');
const sportId = process.argv[3] || 1;

async function searchEntities() {
    const sportParam = sportId === 'all' ? '' : `&sportId=${sportId}`;
    const url = `https://eventsstat.com/fr/services-api/core-api/v1/search?search=${encodeURIComponent(term)}${sportParam}&lng=fr&ref=1&fcountry=91&gr=285`;

    console.log(`\n🔍 [ENTITÉS] Recherche de : "${term}" (Sport: ${sportId}) ...`);

    try {
        const response = await gotScraping.get(url, {
            responseType: 'json',
            headerGeneratorOptions: {
                browsers: ['chrome', 'firefox', 'safari'],
                devices: ['desktop', 'mobile'],
                locales: ['fr-FR']
            },
            headers: {
                'Referer': 'https://eventsstat.com/fr/statistic/',
                'Origin': 'https://eventsstat.com',
                'Accept': 'application/json, text/plain, */*',
                'Connection': 'keep-alive'
            }
        });

        const data = response.body.data || [];
        console.log(`✅ Trouvé : ${data.length} entités.\n`);

        data.forEach(item => {
            let cat = 'Inconnu';
            if (item.type === 6) cat = 'ÉQUIPE';
            if (item.type === 7) cat = 'ATHLÈTE';
            if (item.type === 10) cat = 'LIGUE';
            console.log(`[${cat}] ${item.title} (ID: ${item.id})`);
        });
    } catch (e) {
        if (e.code === 'ECONNRESET') {
            console.error('⚠️ [BLOQUAGE SERVEUR] EventsStat a fermé la connexion (ECONNRESET).');
            console.log('   C\'est probablement dû au VPN ou au serveur qui est instable actuellement.');
        } else {
            console.error('❌ Erreur Entités:', e.message);
        }
    }
}

async function searchEvents() {
    const url = `https://sa.1xbet.com/service-api/LineFeed/Web_SearchZip?text=${encodeURIComponent(term)}&limit=20&lng=fr&country=158&mode=4`;

    console.log(`\n🔥 [ÉVÉNEMENTS] Recherche de matchs pour : "${term}" ...`);

    try {
        const response = await gotScraping.get(url, { responseType: 'json' });
        const matches = response.body.Value || [];

        console.log(`✅ Trouvé : ${matches.length} matchs.\n`);

        matches.forEach(m => {
            const date = new Date(m.S * 1000).toLocaleString('fr-FR');
            console.log(`[${date}] ${m.L}`);
            console.log(`   ⚽ ${m.O1} vs ${m.O2}`);
            console.log(`   ID Match: ${m.I} | ID Ligue: ${m.LI}`);
            console.log('---');
        });
    } catch (e) {
        console.error('❌ Erreur Événements:', e.message);
    }
}

async function runAll() {
    await searchEntities();
    await searchEvents();
}

runAll();
