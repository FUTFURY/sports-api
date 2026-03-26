import { withCors } from '../../../utils/cors.js';
import { VERSION } from '../../../utils/version.js';
import xbet from '../../../services/1xbetService.js';

async function handler(req, res) {
    console.log(`[Debug] API Handler started for ID: ${req.query.id}`);
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { name, sportId = '1', lang = 'fr' } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, error: 'Team ID is required' });
    }

    try {
        const matches = await xbet.fetchTeamMatches(id, sportId, lang, name);
        
        res.status(200).json({
            success: true,
            version: VERSION,
            data: matches
        });
    } catch (error) {
        console.error('API Team Matches Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

export default withCors(handler);
