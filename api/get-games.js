export default async function handler(req, res) {
    // 1. CORS Headers (Allow Flutter App)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Get Parameters (League ID, Dates)
    // Default to "England League Cup" example if not provided
    const {
        champId = "119237",
        dateFrom = "1770211200",
        dateTo = "1770297600"
    } = req.query;

    // 3. Define 1xBet URL (v3/games)
    const url = `https://sa.1xbet.com/service-api/result/web/api/v3/games?champId=${champId}&dateFrom=${dateFrom}&dateTo=${dateTo}&lng=fr&ref=1`;

    // 4. Secure Headers (from Env Vars)
    // CRITICAL: These allow bypassing the 403/203 blocks
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/results",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url, { headers });

        if (!response.ok) {
            return res.status(response.status).json({ error: `1xBet Error: ${response.statusText}`, details: await response.text() });
        }

        const data = await response.json();

        // 5. Clean Data (Map to generic format)
        // This decouples the App from 1xBet structure
        const games = (data.items || []).map(game => ({
            id: game.id,
            league_id: champId,
            teams: {
                home: game.team1 || game.opp1 || "Home",
                away: game.team2 || game.opp2 || "Away"
            },
            score: game.score, // e.g. "3:1"
            stats: (game.subGame || []).map(s => ({
                label: s.title,
                value: s.score // e.g. "5:4"
            }))
        }));

        // 6. Return JSON
        res.setHeader('Cache-Control', 's-maxage=60'); // Cache for 60s
        return res.status(200).json(games);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
