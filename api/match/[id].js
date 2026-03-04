import { fetchMatchDetails, fetchHeadToHead } from '../../../services/1xbetService.js';
import { withCors } from '../../../utils/cors.js';

const handler = async (req, res) => {
    try {
        const { id, isLive } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Match ID is required in the query or path.' });
        }

        const liveFlag = isLive === 'true' || isLive === '1';
        const [matchDetails, h2h] = await Promise.all([
            fetchMatchDetails(id, liveFlag),
            fetchHeadToHead(id)
        ]);

        let finalMatchDetails = matchDetails;

        // Fallback: If 1xBet fails (common for historical matches using string IDs), 
        // try to reconstruct the match info from the h2h/form data metadata.
        if (!finalMatchDetails && h2h) {
            // Find a reference to the current game in the forms or h2h list
            const allMatches = [...(h2h.player1Form || []), ...(h2h.player2Form || []), ...(h2h.headToHead || [])];
            const found = allMatches.find(m => m.id === id);

            if (found) {
                finalMatchDetails = {
                    id: found.id,
                    tournamentName: found.tournamentName,
                    player1: found.player1?.name,
                    player1Id: found.player1?.id,
                    player2: found.player2?.name,
                    player2Id: found.player2?.id,
                    startTime: found.date,
                    surface: found.surface,
                    isLive: false,
                    // Map score if available
                    score: {
                        setsPlayer1: found.player1?.score,
                        setsPlayer2: found.player2?.score,
                        allSets: found.sets ? found.sets.map((s, idx) => ({
                            Key: idx + 1,
                            Value: { S1: s.H, S2: s.A }
                        })) : []
                    }
                };
            }
        }

        if (!finalMatchDetails) {
            return res.status(404).json({ success: false, message: 'Match not found.' });
        }

        res.status(200).json({
            success: true,
            data: {
                ...finalMatchDetails,
                h2h
            }
        });
    } catch (error) {
        console.error(`API Error /match/${req.query.id}:`, error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
