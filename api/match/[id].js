import { fetchMatchDetails, fetchHeadToHead, fetchMatchDetailed, fetchSports } from '../../../services/1xbetService.js';
import { withCors } from '../../../utils/cors.js';
import { VERSION } from '../../../utils/version.js';
import { mapStats } from '../../../mappers/1xbet.js';

const handler = async (req, res) => {
    try {
        const { id, isLive, sportId, lang, lng, tz } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Match ID is required in the query or path.' });
        }

        const finalLang = lang || lng || 'fr';
        const finalTz = tz || '1';
        const liveFlag = isLive === 'true' || isLive === '1';
        const sid = parseInt(sportId) || 4; // Default to tennis if not provided

        const [matchDetails, h2h, detailedInfo, sportsList] = await Promise.all([
            fetchMatchDetails(id, liveFlag, sid, finalLang, finalTz),
            fetchHeadToHead(id, sid),
            fetchMatchDetailed(id, sid),
            fetchSports(finalLang)
        ]);

        const sportInfo = Array.isArray(sportsList) ? sportsList.find(s => s.sportId === sid) : null;

        let finalMatchDetails = matchDetails;

        // Fallback: If 1xBet fails (common for historical matches using string IDs), 
        // try to reconstruct the match info from the h2h/form data metadata or detailedInfo.
        if (!finalMatchDetails) {
            if (detailedInfo) {
                const game = detailedInfo.G || {};
                finalMatchDetails = {
                    id: game.I || id,
                    tournamentName: detailedInfo.T?.T || detailedInfo.T?.N,
                    player1: game.O1 || game.H?.T,
                    player1Id: game.O1I || game.H?.XI,
                    player2: game.O2 || game.A?.T,
                    player2Id: game.O2I || game.A?.XI,
                    startTime: game.S || game.D,
                    isLive: false,
                    score: {
                        gamesPlayer1: parseInt(game.S1) || 0,
                        gamesPlayer2: parseInt(game.S2) || 0,
                        sets: game.P
                    }
                };
            } else if (h2h) {
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
        }

        // Enrich with stats from detailedInfo if not already present
        if (finalMatchDetails && !finalMatchDetails.stats && detailedInfo) {
            const mappedStats = mapStats(detailedInfo);
            if (mappedStats) {
                finalMatchDetails.stats = mappedStats;
            }
        }

        if (!finalMatchDetails) {
            // Last resort: minimal info
            finalMatchDetails = { id, name: "Match", isLive: false };
        }

        res.status(200).json({
            success: true,
            version: VERSION,
            data: {
                ...finalMatchDetails,
                h2h,
                detailedInfo,
                sport: sportInfo ? {
                    id: sportInfo.sportId,
                    name: sportInfo.name,
                    command: sportInfo.command,
                    subCommand: sportInfo.subCommand,
                    shortName: sportInfo.shortName
                } : null
            }
        });
    } catch (error) {
        console.error(`API Error /match/${req.query.id}:`, error);
        res.status(500).json({ success: false, version: VERSION, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
