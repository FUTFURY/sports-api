/**
 * Normalizes 1xbet API matching data schemas into readable JSON.
 */

// Basic mapper for a single match or game object
export const mapMatch = (matchData) => {
    if (!matchData) return null;

    // Parse match info from MIS array (key-value pairs)
    // K=1: Round, K=2: Venue, K=10: Surface, K=7: City, K=11: Country, K=9: Temp
    const misMap = {};
    if (Array.isArray(matchData.MIS)) {
        matchData.MIS.forEach(item => { misMap[item.K] = item.V; });
    }

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
        stats: mapStats(matchData),
        odds: mapOdds(matchData.E),
        marketCount: matchData.EC || 0, // Total number of betting markets available

        // Match info enriched from MIS / MIO
        surface: misMap[10] || null,     // e.g. "Hard", "Clay", "Grass", "Hard-Indoors"
        round: misMap[1] || matchData.MIO?.TSt || null,   // e.g. "Round of 16", "Quarter-final"
        venue: misMap[2] || matchData.MIO?.Loc || null,   // e.g. "Aviation Club Tennis Centre (Dubai)"
        city: misMap[7] || null,          // e.g. "Dubai"
        venueImageId: matchData.SmI || null, // ID for stadium image on eventsstat.com
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
        currentSetScore: sc.PS, // Point score or current set details
        currentPointsP1: sc.SS?.S1 ?? null,
        currentPointsP2: sc.SS?.S2 ?? null
    };
};

export const mapStats = (matchData) => {
    if (!matchData) return null;

    // A collection of potential paths for statistics arrays in 1xBet response
    var potentialPaths = [
        matchData.SG,
        (matchData.SC && matchData.SC.ST && matchData.SC.ST[0] && (matchData.SC.ST[0].Value || matchData.SC.ST[0].V)),
        (matchData.ST && matchData.ST[0] && (matchData.ST[0].Value || matchData.ST[0].V)),
        (matchData.SC && matchData.SC.ST && matchData.SC.ST[1] && (matchData.SC.ST[1].Value || matchData.SC.ST[1].V))
    ];

    for (var i = 0; i < potentialPaths.length; i++) {
        var statsArray = potentialPaths[i];
        if (Array.isArray(statsArray) && statsArray.length > 0) {
            return statsArray.map(function (stat) {
                return {
                    name: stat.N || stat.NA || stat.ID || "Stat",
                    p1: String((stat.S1 !== undefined && stat.S1 !== null) ? stat.S1 : ((stat.P1 !== undefined && stat.P1 !== null) ? stat.P1 : '-')),
                    p2: String((stat.S2 !== undefined && stat.S2 !== null) ? stat.S2 : ((stat.P2 !== undefined && stat.P2 !== null) ? stat.P2 : '-'))
                };
            }).filter(function (s) { return s.name; });
        }
    }

    // Deep fallback search if the simple paths above failed
    var scst = (matchData.SC && matchData.SC.ST) || matchData.ST;
    if (Array.isArray(scst)) {
        for (var j = 0; j < scst.length; j++) {
            var items = scst[j].Value || scst[j].V;
            if (Array.isArray(items) && items.length > 0) {
                return items.map(function (stat) {
                    return {
                        name: stat.N || stat.NA || stat.ID || "Stat",
                        p1: String((stat.S1 !== undefined && stat.S1 !== null) ? stat.S1 : ((stat.P1 !== undefined && stat.P1 !== null) ? stat.P1 : '-')),
                        p2: String((stat.S2 !== undefined && stat.S2 !== null) ? stat.S2 : ((stat.P2 !== undefined && stat.P2 !== null) ? stat.P2 : '-'))
                    };
                });
            }
        }
    }

    return null;
};

export const mapTournament = (champ) => {
    return {
        id: champ.id || champ.LI,
        name: champ.name || champ.L,
        country: champ.country || champ.CN,
        isTop: champ.isTop || champ.T === 1 // Often implies Top tournament
    };
};

export const mapRanking = (player) => {
    if (!player) return null;
    return {
        id: player.I || player.Id,
        xId: player.XI,
        name: player.N || player.Name,
        rank: player.P || player.Pos || player.Position,
        points: player.Pts || player.Points || player.PTS,
        age: player.Age,
        tourneys: player.Tourneys,
        image: player.IM // Optional image path
    };
};

export const mapPlayerDetails = (data) => {
    if (!data) return null;

    // Player metadata is in the 'P' object
    // P.I = string player ID, P.N = name, P.XI = numeric xId,
    // P.IM = image path, P.C = country object { I: countryId, T: countryName }
    const playerMeta = data.P || {};

    // Prize money is in 'TS.O' array
    // e.P: 1=YTD, 2=Career | e.T: 1=Singles, 2=Doubles | e.M=amount | e.W=W-L record
    const oArray = (data.TS && data.TS.O) || data.O || [];
    const earnings = oArray.map((e, index) => ({
        id: `earning-${index}`,
        amount: e.M || null,
        period: e.P === 1 ? 'Year To Date' : 'Career',
        type: e.T === 1 ? 'Singles' : 'Doubles',
        record: e.W || null
    }));

    return {
        id: playerMeta.I || null,                   // String player ID (e.g. "6286be67f75...")
        name: playerMeta.N || null,                  // Full name (e.g. "Daniil Medvedev")
        image: playerMeta.IM || data.PI || null,     // Image path (e.g. "/sfiles/logo_teams/xxx.png")
        countryId: playerMeta.C?.I || null,          // Numeric country ID
        countryName: playerMeta.C?.T || null,        // Country name (e.g. "Russia")
        birthDate: data.B || null,                   // Unix timestamp of birth date
        earnings: earnings.length > 0 ? earnings : null,
        form: Array.isArray(data.G) ? data.G.map(m => ({
            id: m.I,
            date: m.D,
            winner: m.W,
            player1: {
                id: m.H?.XI,
                name: m.H?.T,
                score: m.S1,
                isWinner: m.W === 1
            },
            player2: {
                id: m.A?.XI,
                name: m.A?.T,
                score: m.S2,
                isWinner: m.W === 2
            },
            tournamentName: m.S?.N,
            surface: m.S?.ST,
            sets: m.P
        })).filter(Boolean) : null
    };
};

export const mapH2H = (h2hData) => {
    if (!h2hData) return null;

    const mapMatchShort = (m) => {
        if (!m) return null;

        // In eventsstat H2H: H=Home, A=Away, S1=HomeScore, S2=AwayScore, W=Winner(1 or 2)
        return {
            id: m.I,
            date: m.D,
            winner: m.W,
            player1: {
                id: m.H?.XI,
                name: m.H?.T,
                score: m.S1,
                isWinner: m.W === 1
            },
            player2: {
                id: m.A?.XI,
                name: m.A?.T,
                score: m.S2,
                isWinner: m.W === 2
            },
            tournamentName: m.S?.N,
            surface: m.S?.ST,
            sets: m.P
        };
    };

    return {
        player1Form: (h2hData.H || []).map(mapMatchShort).filter(Boolean),
        player2Form: (h2hData.A || []).map(mapMatchShort).filter(Boolean),
        headToHead: (h2hData.G || []).map(mapMatchShort).filter(Boolean)
    };
};

export default {
    mapMatch,
    mapScore,
    mapStats,
    mapTournament,
    mapRanking,
    mapPlayerDetails,
    mapOdds,
    mapH2H
};
