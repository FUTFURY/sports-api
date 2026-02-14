
import { getLiveMatches } from '@/lib/1xbet';

export default async function handler(req, res) {
    try {
        const matches = await getLiveMatches();
        return res.status(200).json({
            count: matches.length,
            matches: matches,
            source: 'LIVE_FEED'
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
