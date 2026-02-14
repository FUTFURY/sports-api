
import { botManager } from '../../utils/bot_manager.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { matchId, action } = req.body;

    if (!matchId || !action) {
        return res.status(400).json({ error: 'Missing matchId or action' });
    }

    try {
        if (action === 'start') {
            const result = botManager.startBot(matchId.toString());
            return res.status(200).json(result);
        }
        else if (action === 'stop') {
            const result = botManager.stopBot(matchId.toString());
            return res.status(200).json(result);
        }
        else if (action === 'status') {
            const result = botManager.getStatus(matchId.toString());
            return res.status(200).json(result);
        }
        else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (e) {
        console.error("Bot Control Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
