import { getATPTop100, getWTATop100 } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';

const handler = async (req, res) => {
    try {
        const { type } = req.query; // Expected: 'atp' or 'wta'

        if (!type || (type.toLowerCase() !== 'atp' && type.toLowerCase() !== 'wta')) {
            return res.status(400).json({
                success: false,
                message: "Missing or invalid 'type' parameter. Must be 'atp' or 'wta'."
            });
        }

        const _type = type.toLowerCase();
        const rankings = _type === 'atp' ? await getATPTop100() : await getWTATop100();

        res.status(200).json({
            success: true,
            data: rankings,
            count: rankings.length
        });
    } catch (error) {
        console.error(`API Error /rankings:`, error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
