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
        let results = null;

        // Try fetching as Team first
        console.log(`[Debug] Trying as team for statId: ${statId}`);
        const teamStats = await xbet.fetchTeamDetailedStats(statId, lang).catch(() => null);
        
        if (teamStats && (teamStats.upcoming?.length > 0 || teamStats.past?.length > 0)) {
            const sortedUpcoming = (teamStats.upcoming || []).sort((a, b) => a.time - b.time);
            results = {
                entityType: 'team',
                name: teamStats.name || null,
                today: sortedUpcoming.find(m => {
                    const matchDate = new Date(m.time * 1000).toISOString().split('T')[0];
                    const todayDate = new Date().toISOString().split('T')[0];
                    return matchDate === todayDate;
                }) || null,
                upcoming: sortedUpcoming,
                results: (teamStats.past || []).sort((a, b) => b.time - a.time)
            };
        } else {
            // Try fetching as Championship/League
            console.log(`[Debug] Trying as league for statId: ${statId}`);
            const leagueStats = await xbet.fetchChampionshipDetailedStats(statId, lang).catch(() => null);
            
            if (leagueStats && (leagueStats.upcoming?.length > 0 || leagueStats.past?.length > 0)) {
                results = {
                    ...leagueStats,
                    entityType: 'league'
                };
            } else {
                // Try fetching as Player/Athlete
                console.log(`[Debug] Trying as player for statId: ${statId}`);
                const playerStats = await xbet.fetchPlayerDetailedStats(statId, lang).catch(() => null);
                
                if (playerStats && (playerStats.upcoming?.length > 0 || playerStats.past?.length > 0)) {
                    results = {
                        ...playerStats,
                        entityType: 'athlete'
                    };
                }
            }
        }

        if (!results) {
            return res.status(404).json({ success: false, error: 'Entity not found or no matches available for this ID' });
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
