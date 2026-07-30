import { fetchLiveMatches, fetchUpcomingMatches, fetchResults } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

/**
 * GET /api/matches?sportId=N&type=live|upcoming|finished|both|all&date=YYYY-MM-DD
 *
 * sportId : ID numérique du sport (défaut: 1 Football)
 * type    : 'live', 'upcoming', 'finished', 'both' (défaut), ou 'all'
 * date    : Date au format YYYY-MM-DD (optionnel, utilisé si type=finished ou type=all)
 */
const handler = async (req, res) => {
    try {
        const { lang, lng, tz, sportId } = req.query;
        const finalLang = lang || lng || 'fr';
        const finalTz = tz || '1';
        const finalSportId = sportId || '1';
        const type = (req.query.type || 'both').toLowerCase();
        const date = req.query.date || new Date().toISOString().split('T')[0];

        let live     = [];
        let upcoming = [];
        let finished = [];

        const promises = [];
        if (type === 'live' || type === 'both' || type === 'all') {
            promises.push(fetchLiveMatches(finalSportId, finalLang, finalTz).then(res => live = res));
        }
        if (type === 'upcoming' || type === 'both' || type === 'all') {
            promises.push(fetchUpcomingMatches(finalSportId, finalLang, finalTz).then(res => upcoming = res));
        }
        if (type === 'finished' || type === 'all') {
            promises.push(fetchResults(date, finalSportId, finalLang, finalTz).then(res => finished = res));
        }

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            version: VERSION,
            type,
            ...(type === 'finished' || type === 'all' ? { date } : {}),
            data: {
                live,
                upcoming,
                finished
            },
            count: {
                live: live.length,
                upcoming: upcoming.length,
                finished: finished.length
            }
        });
    } catch (error) {
        console.error('API Error /matches:', error);
        res.status(500).json({ success: false, version: VERSION, message: 'Internal Server Error' });
    }
};

export default withCors(handler);


