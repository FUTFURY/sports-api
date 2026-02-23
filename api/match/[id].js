import { fetchMatchDetails } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';

const handler = async (req, res) => {
    try {
        const { id, isLive } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Match ID is required in the query or path.' });
        }

        const liveFlag = isLive === 'true' || isLive === '1';
        const matchDetails = await fetchMatchDetails(id, liveFlag);

        if (!matchDetails) {
            return res.status(404).json({ success: false, message: 'Match not found.' });
        }

        res.status(200).json({
            success: true,
            data: matchDetails
        });
    } catch (error) {
        console.error(`API Error /match/${req.query.id}:`, error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
