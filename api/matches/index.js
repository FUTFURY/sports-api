import { fetchLiveMatches, fetchUpcomingMatches } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

const handler = async (req, res) => {
    try {
        const { lang, lng, tz, sportId } = req.query;
        const finalLang = lang || lng || 'fr';
        const finalTz = tz || '1';
        const finalSportId = sportId || '1'; // Football par défaut ici

        const [live, upcoming] = await Promise.all([
            fetchLiveMatches(finalSportId, finalLang, finalTz),
            fetchUpcomingMatches(finalSportId, finalLang, finalTz)
        ]);

        res.status(200).json({
            success: true,
            version: VERSION,
            data: {
                live,
                upcoming
            }
        });
    } catch (error) {
        console.error('API Error /matches:', error);
        res.status(500).json({ success: false, version: VERSION, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
