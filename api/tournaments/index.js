import { fetchTournaments } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

const handler = async (req, res) => {
    try {
        const tournaments = await fetchTournaments();

        res.status(200).json({
            success: true,
            version: VERSION,
            data: tournaments,
            count: tournaments.length
        });
    } catch (error) {
        console.error('API Error /tournaments:', error);
        res.status(500).json({ success: false, version: VERSION, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
