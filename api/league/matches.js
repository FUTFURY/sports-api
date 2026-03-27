import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';
import xbet from '../../services/1xbetService.js';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { statId, lang = 'fr' } = req.query;

    if (!statId) {
        return res.status(400).json({ success: false, error: 'statId (Hex ID) is required' });
    }

    try {
        const leagueStats = await xbet.fetchChampionshipDetailedStats(statId, lang);
        
        res.status(200).json({
            success: true,
            version: VERSION,
            data: leagueStats
        });
    } catch (error) {
        console.error('API League Matches Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

export default withCors(handler);
