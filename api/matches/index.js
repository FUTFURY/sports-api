import { fetchLiveMatches, fetchUpcomingMatches } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

const handler = async (req, res) => {
    try {
        const [live, upcoming] = await Promise.all([
            fetchLiveMatches(),
            fetchUpcomingMatches()
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
