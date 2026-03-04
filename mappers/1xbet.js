/**
 * Normalizes 1xbet API matching data schemas into readable JSON.
 */

// Basic mapper for a single match or game object
export const mapMatch = (matchData) => {
    if (!matchData) return null;

    return {
        id: matchData.I, // Game ID
        tournamentId: matchData.LI,
        tournamentName: matchData.L, // League / Tournament Name
        tournamentCountry: matchData.CN, // Country name of the tournament

        player1Id: matchData.O1I,
        player1: matchData.O1E || matchData.O1, // Player 1 Name
        player1CountryId: matchData.O1C,
        player1Image: matchData.O1IMG?.[0],

        player2Id: matchData.O2I,
        player2: matchData.O2E || matchData.O2, // Player 2 Name
        player2CountryId: matchData.O2C,
        player2Image: matchData.O2IMG?.[0],

        startTime: matchData.S, // Unix timestamp representing start time
        score: mapScore(matchData.SC),
        winProbability: matchData.WP, // e.g. { P1: 0.22, P2: 0.78 }
        isLive: !!matchData.SC, // If score structure exists, it's often live or finished
        stats: matchData.SG ? mapStats(matchData.SG) : null,
        odds: matchData.E ? mapOdds(matchData.E) : null,
        marketCount: matchData.EC || 0, // Total number of betting markets available (for your sorting algo)

        // EventsStat Hex IDs for detailed metrics
        eventsstatMatchId: matchData.SGI,
        eventsstatTournamentId: matchData.STI
    };
};

export const mapOdds = (events) => {
    if (!events || !Array.isArray(events)) return null;

    // Group 1 is usually the main Match Result market (1x2)
    // T=1 is Player 1 wins, T=3 is Player 2 wins
    const mainMarket = events.filter(e => e.G === 1);
    const p1Win = mainMarket.find(e => e.T === 1);
    const p2Win = mainMarket.find(e => e.T === 3);

    if (!p1Win && !p2Win) return null;

    return {
        p1: p1Win ? p1Win.C : null,
        p2: p2Win ? p2Win.C : null
    };
};

export const mapScore = (sc) => {
    if (!sc) return null;
    return {
        sets: sc.FS, // Set scores array/object 
        gamesPlayer1: sc.S1, // Overall games/sets won
        gamesPlayer2: sc.S2,
        currentSetScore: sc.PS // Point score or current set details
    };
};

export const mapStats = (sg) => {
    if (!sg) return null;
    // Map specific advanced stats from SG arrays
    return sg.map(stat => ({
        name: stat.NA, // Stat Name
        p1: stat.P1,   // Player 1 stat
        p2: stat.P2    // Player 2 stat
    }));
};

export const mapTournament = (champ) => {
    return {
        id: champ.id || champ.LI,
        name: champ.name || champ.L,
        country: champ.country || champ.CN,
        isTop: champ.isTop || champ.T === 1, // Often implies Top tournament
        eventsstatId: champ.eventsstatId || champ.STI
    };
};

export const mapRanking = (player) => {
    if (!player) return null;
    return {
        id: player.I || player.Id,
        name: player.N || player.Name,
        rank: player.P || player.Pos || player.Position,
        points: player.Pts || player.Points || player.PTS,
        image: player.IM // Optional image path
    };
};

export const mapPlayerDetails = (data) => {
    if (!data) return null;

    // Prize money is in the 'TS.O' or root 'O' array
    const oArray = (data.TS && data.TS.O) || data.O || [];
    const earnings = oArray.map(e => ({
        amount: e.M,
        period: e.P === 1 ? 'Year To Date' : 'Career',
        type: e.T === 1 ? 'Singles' : 'Doubles',
        record: e.W
    }));

    return {
        ...data, // Keep raw data for now
        earnings
    };
};

export const mapPastMatch = (matchData) => {
    if (!matchData) return null;

    // Parse score string like: "0:3 (1:6,2:6,4:6) (222221...)"
    let sets = {};
    let s1 = 0, s2 = 0;

    if (matchData.score) {
        const parts = matchData.score.split(' (');
        const mainScore = parts[0].split(':');
        s1 = parseInt(mainScore[0]) || 0;
        s2 = parseInt(mainScore[1]) || 0;

        if (parts.length > 1) {
            const setsStr = parts[1].replace(')', ''); // "1:6,2:6,4:6"
            const setsArr = setsStr.split(',');
            setsArr.forEach((s, idx) => {
                const sp = s.split(':');
                sets[`S1`] = (sets[`S1`] || {});
                sets[`S2`] = (sets[`S2`] || {});
                sets[`S1`][idx] = parseInt(sp[0]) || 0;
                sets[`S2`][idx] = parseInt(sp[1]) || 0;
            });
        }
    }

    return {
        id: matchData.id,
        tournamentId: matchData.champId,
        tournamentName: matchData.champName,

        player1: matchData.opp1,
        player1Id: matchData.opp1Ids?.[0],
        player1Image: matchData.opp1Images?.[0],

        player2: matchData.opp2,
        player2Id: matchData.opp2Ids?.[0],
        player2Image: matchData.opp2Images?.[0],

        startTime: matchData.dateStart,

        score: {
            sets: sets,
            gamesPlayer1: s1,
            gamesPlayer2: s2,
            currentSetScore: null // Past match, so no current game point score
        },

        isLive: false,
        isFinished: true, // Marker for frontend that this is a historical result
        stats: matchData.subGame ? matchData.subGame.map(sg => {
            const points = sg.score.split(' ')[0].split(':');
            return {
                name: sg.title,
                p1: parseFloat(points[0]) || 0,
                p2: parseFloat(points[1]) || 0
            };
        }) : null,
        odds: null,
        marketCount: 0
    };
};

export default {
    mapMatch,
    mapPastMatch,
    mapScore,
    mapStats,
    mapTournament,
    mapRanking,
    mapPlayerDetails,
    mapOdds
};
