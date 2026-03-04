import { gotScraping } from 'got-scraping';
import express from 'express';
import { mapMatch } from '../../mappers/1xbet.js';

const searchDev = express.Router();

const EVENTSSTAT_CORE_SEARCH = 'https://eventsstat.com/fr/services-api/core-api/v1/search';
const X1BET_EVENT_SEARCH = 'https://sa.1xbet.com/service-api/LineFeed/Web_SearchZip';

searchDev.get('/search', async (req, res) => {
    const query = req.query.q;
    const sportId = parseInt(req.query.sport) || 1;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    try {
        // Lancement des deux recherches en parallèle pour plus de rapidité
        const [entityResponse, eventResponse] = await Promise.allSettled([
            // 1. Recherche d'ENTITÉS (Equipes, Joueurs, Ligues permanentes)
            gotScraping.get(`${EVENTSSTAT_CORE_SEARCH}?search=${encodeURIComponent(query)}&sportId=${sportId}&lng=fr&ref=1&fcountry=91&gr=285`, {
                responseType: 'json',
                headers: { 'Referer': 'https://eventsstat.com/fr/statistic/', 'Origin': 'https://eventsstat.com' }
            }),
            // 2. Recherche d'ÉVÉNEMENTS (Matchs réels et directs via 1xBet)
            gotScraping.get(`${X1BET_EVENT_SEARCH}?text=${encodeURIComponent(query)}&limit=20&lng=fr&country=158&mode=4`, {
                responseType: 'json'
            })
        ]);

        // Traitement des Entités (S'assurer que ça ne crash pas tout si le serveur est down)
        const rawEntities = entityResponse.status === 'fulfilled' ?
            (entityResponse.value.body?.data || []) : [];

        if (entityResponse.status === 'rejected') {
            console.error('⚠️ EventsStat Entities side failed:', entityResponse.reason.message);
        }

        const entities = { teams: [], leagues: [], players: [] };

        rawEntities.forEach(item => {
            const mapped = {
                id: item.id,
                name: item.title,
                image: item.image ? `https://eventsstat.com/en/image/${item.type === 6 ? 'team' : 'champ'}/min/${item.image}` : null
            };
            if (item.type === 6) entities.teams.push(mapped);
            else if (item.type === 10) entities.leagues.push(mapped);
            else entities.players.push(mapped);
        });

        // Traitement des Événements
        const rawEvents = eventResponse.status === 'fulfilled' ?
            (eventResponse.value.body?.Value || []) : [];

        if (eventResponse.status === 'rejected') {
            console.error('⚠️ 1xBet Events side failed:', eventResponse.reason.message);
        }

        const events = rawEvents.map(m => {
            const match = mapMatch(m);
            return {
                id: match.id,
                tournament: match.tournamentName,
                home: match.player1,
                away: match.player2,
                startTime: match.startTime,
                isLive: match.isLive,
                logo: match.player1Image ? `https://eventsstat.com/en/image/team/min/${match.player1Image}` : null
            };
        });

        res.json({
            success: true,
            query,
            eventsSideDown: eventResponse.status === 'rejected',
            entitiesSideDown: entityResponse.status === 'rejected',
            results: {
                entities,
                events
            }
        });

    } catch (error) {
        console.error('Combined Search API error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to perform global search' });
    }
});

export default searchDev;
