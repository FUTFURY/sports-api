import { fetchLeagues } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

/**
 * GET /api/leagues
 *
 * Query parameters:
 *  - sportId / sport : Numerical ID of the sport (e.g., 1 for Football, 4 for Tennis). Optional.
 *  - type           : 'live', 'upcoming', 'line', 'both', or 'all' (default: 'both')
 *  - cyber          : 'true' or 'false' (default: 'false' -> excludes cyber/virtual sports)
 *  - lang / lng     : Language code (default: 'fr')
 *  - tz             : Timezone offset (default: '1')
 */
const handler = async (req, res) => {
    try {
        const { lang, lng, tz, sportId, sport, type, cyber } = req.query;
        const finalLang = lang || lng || 'fr';
        const finalTz = tz || '1';
        const finalSportId = sportId || sport || null;
        const finalType = (type || 'both').toLowerCase();
        const includeCyber = cyber === 'true';

        const leaguesData = await fetchLeagues(
            finalSportId,
            finalType,
            finalLang,
            finalTz,
            includeCyber
        );

        const liveCount = leaguesData.live ? leaguesData.live.length : 0;
        const upcomingCount = leaguesData.upcoming ? leaguesData.upcoming.length : 0;

        res.status(200).json({
            success: true,
            version: VERSION,
            sportId: finalSportId ? parseInt(finalSportId, 10) : null,
            type: finalType,
            cyber: includeCyber,
            data: {
                live: leaguesData.live || [],
                upcoming: leaguesData.upcoming || []
            },
            count: {
                live: liveCount,
                upcoming: upcomingCount,
                total: liveCount + upcomingCount
            }
        });
    } catch (error) {
        console.error('API Error /api/leagues:', error);
        res.status(500).json({
            success: false,
            version: VERSION,
            message: 'Internal Server Error'
        });
    }
};

export default withCors(handler);
