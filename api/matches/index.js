import { fetchLiveMatches, fetchUpcomingMatches, fetchResults, fetchLeagueResults } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

/**
 * GET /api/matches?sportId=N&leagueId=N&champId=N&type=live|upcoming|finished|both|all&date=YYYY-MM-DD&days=7
 *
 * sportId  : ID numérique du sport (défaut: 1 Football)
 * leagueId : ID numérique de la ligue / championnat (optionnel)
 * champId  : Alias de leagueId (optionnel)
 * type     : 'live', 'upcoming', 'finished', 'both' (défaut), ou 'all'
 * date     : Date au format YYYY-MM-DD (optionnel)
 * days     : Nombre de jours de matchs passés à récupérer si leagueId est fourni (défaut: 7, max: 30)
 */
const handler = async (req, res) => {
    try {
        const { lang, lng, tz, sportId, leagueId, champId, days } = req.query;
        const finalLang = lang || lng || 'fr';
        const finalTz = tz || '1';
        const finalSportId = sportId || '1';
        const finalChampId = leagueId || champId || null;
        const type = (req.query.type || 'both').toLowerCase();
        const datePassed = Boolean(req.query.date);
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const numDays = Math.min(Math.max(parseInt(days || '7', 10), 1), 30);

        let live     = [];
        let upcoming = [];
        let finished = [];

        const promises = [];
        if (type === 'live' || type === 'both' || type === 'all') {
            promises.push(fetchLiveMatches(finalSportId, finalLang, finalTz, finalChampId).then(res => live = res));
        }
        if (type === 'upcoming' || type === 'both' || type === 'all') {
            promises.push(fetchUpcomingMatches(finalSportId, finalLang, finalTz, finalChampId).then(res => upcoming = res));
        }
        if (type === 'finished' || type === 'all') {
            if (finalChampId && !datePassed) {
                promises.push(fetchLeagueResults(finalChampId, numDays, finalLang, finalTz).then(res => finished = res));
            } else {
                promises.push(fetchResults(date, finalSportId, finalLang, finalTz, finalChampId).then(res => finished = res));
            }
        }

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            version: VERSION,
            type,
            ...(finalChampId ? { leagueId: finalChampId } : {}),
            ...(type === 'finished' || type === 'all' ? { date, days: finalChampId && !datePassed ? numDays : 1 } : {}),
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


