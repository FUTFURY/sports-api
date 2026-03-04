import express from 'express';
import { mapMatch } from '../../mappers/1xbet.js';
import { searchEntitiesRobust, searchEventsRobust } from '../../services/robustSearchService.js';

const searchDev = express.Router();

searchDev.get('/search', async (req, res) => {
    const query = req.query.q;
    const sportId = parseInt(req.query.sport) || 1;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    try {
        // Lancement des deux recherches via le service ROBUSTE (rotation de domaines)
        const [entityResponse, eventResponse] = await Promise.allSettled([
            searchEntitiesRobust(query, sportId),
            searchEventsRobust(query)
        ]);

        // Traitement des Entités
        const rawEntities = entityResponse.status === 'fulfilled' ?
            (entityResponse.value?.data || []) : [];

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
            (eventResponse.value?.Value || []) : [];

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
