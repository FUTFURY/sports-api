import { searchGlobal } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

const handler = async (req, res) => {
    try {
        const { q, type } = req.query;
        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }

        let results = await searchGlobal(q);

        res.status(200).json({
            success: true,
            version: VERSION,
            data: results
        });
    } catch (error) {
        console.error('API Error /search:', error);
        // CRITICAL: Always return a success-like object to prevent iOS errors
        res.status(200).json({ success: false, version: VERSION, message: 'Search briefly unavailable', data: [] });
    }
};

export default withCors(handler);
