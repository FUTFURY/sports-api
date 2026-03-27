import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';
import xbet from '../../services/1xbetService.js';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { statId, type = 'team', lang = 'fr' } = req.query;

    if (!statId) {
        return res.status(400).json({ success: false, error: 'statId (Hex ID) is required' });
    }

    try {
        let results;
        if (type === 'league' || type === 'championship') {
            results = await xbet.fetchChampionshipDetailedStats(statId, lang);
        } else {
            // Default to team stats
            results = await xbet.fetchTeamDetailedStats(statId, lang);
            
            // Re-format team results to match the simpler team-matches format
            const sortedUpcoming = (results.upcoming || []).sort((a, b) => a.time - b.time);
            results = {
                today: sortedUpcoming.find(m => {
                    const matchDate = new Date(m.time * 1000).toISOString().split('T')[0];
                    const todayDate = new Date().toISOString().split('T')[0];
                    return matchDate === todayDate;
                }) || null,
                upcoming: sortedUpcoming,
                results: (results.past || []).sort((a, b) => b.time - a.time)
            };
        }
        
        res.status(200).json({
            success: true,
            version: VERSION,
            data: results
        });
    } catch (error) {
        console.error(`API Entity Matches Error (${type}):`, error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

export default withCors(handler);
