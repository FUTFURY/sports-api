import { fetchLiveMatches, fetchUpcomingMatches, fetchResults } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

/**
 * GET /api/matches?sportId=N&type=live|upcoming|both|finished|results|past|history|ended|all&date=YYYY-MM-DD
 *
 * sportId : ID numérique du sport (requis/défaut: 1). ex: 1=Football, 4=Tennis, 3=Basketball
 * type    : 'live', 'upcoming', 'both', 'finished', 'results', 'past', 'history', 'ended', 'all' (défaut: 'both')
 * date    : Date au format YYYY-MM-DD (optionnel, défaut: date du jour pour les matchs passés/terminés)
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

        const isPastType = ['finished', 'results', 'past', 'history', 'ended'].includes(type);

        const promises = [];
        if (type === 'live' || type === 'both' || type === 'all') {
            promises.push(fetchLiveMatches(finalSportId, finalLang, finalTz).then(res => live = res));
        }
        if (type === 'upcoming' || type === 'both' || type === 'all') {
            promises.push(fetchUpcomingMatches(finalSportId, finalLang, finalTz).then(res => upcoming = res));
        }
        if (isPastType || type === 'all') {
            promises.push(fetchResults(date, finalSportId, finalLang, finalTz).then(res => finished = res));
        }

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            version: VERSION,
            type,
            ...(isPastType || type === 'all' ? { date } : {}),
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

