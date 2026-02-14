
export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { id, lng = "fr" } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Game ID is required" });
    }

    // URL for Live Games
    const liveUrl = `https://sa.1xbet.com/service-api/LiveFeed/GetGameZip?id=${id}&lng=${lng}&isSubGames=true&grouped=true`;
    // URL for Pre-match/Line Games (fallback)
    const lineUrl = `https://sa.1xbet.com/service-api/LineFeed/GetGameZip?id=${id}&lng=${lng}&isSubGames=true&grouped=true`;

    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        // Try Live Feed First
        let response = await fetch(liveUrl, { headers });
        let data = await response.json();
        let game = data.Value;

        // If not found in Live, try Line Feed
        if (!game) {
            console.log(`Game ${id} not found in LiveFeed, trying LineFeed...`);
            response = await fetch(lineUrl, { headers });
            data = await response.json();
            game = data.Value;
        }

        if (!game) {
            return res.status(404).json({ error: "Game not found in Live or Line feed" });
        }

        // Parse Stats
        const stats = [];
        if (game.SC && game.SC.ST && game.SC.ST.length > 0) {
            const rawStats = game.SC.ST[0].Value || [];
            rawStats.forEach(s => {
                stats.push({
                    name: s.N,
                    home: s.S1,
                    away: s.S2,
                    key: s.ID // Keep ID for potential icon mapping
                });
            });
        }

        const result = {
            id: game.I,
            teams: {
                home: game.O1,
                away: game.O2
            },
            score: game.SC && game.SC.FS ? `${game.SC.FS.S1 || 0}-${game.SC.FS.S2 || 0}` : "0-0",
            stats: stats,
            // Include other useful info
            league: game.L,
            time: game.SC && game.SC.TS ? game.SC.TS : null, // Timestamp
            status: game.SC && game.SC.CPS ? game.SC.CPS : "Unknown"
        };

        res.setHeader('Cache-Control', 's-maxage=30');
        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
