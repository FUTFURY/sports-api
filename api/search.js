export default async function handler(req, res) {
    // 1. CORS Headers
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

    // 2. Query Parameters
    const { text = "", lng = "fr" } = req.query;

    if (!text || text.trim().length < 2) {
        return res.status(400).json({ error: "Search query 'text' is required (min 2 chars)." });
    }

    // 3. Search Endpoint
    // Allows searching for leagues and games
    const url = `https://sa.1xbet.com/service-api/result/web/api/v2/search?text=${encodeURIComponent(text)}&lng=${lng}&ref=1`;

    // 4. Secure Headers
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/results",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        console.log(`Searching: ${url}`);
        const response = await fetch(url, { headers });

        if (!response.ok) {
            return res.status(response.status).json({ error: "1xBet Error", details: await response.text() });
        }

        const data = await response.json();

        // 5. Clean Data
        // Structure: { sport: [ { champs: [ { games: [] } ] } ] }
        const results = [];
        const sports = data.sport || [];

        sports.forEach(s => {
            const sportName = (s.name || "").trim();

            (s.champs || []).forEach(c => {
                // Add League
                results.push({
                    type: 'League',
                    id: c.id,
                    name: c.name,
                    sportName: sportName,
                    logo: c.image,
                    count: (c.games || []).length
                });

                // Add Games
                (c.games || []).forEach(g => {
                    results.push({
                        type: 'Game',
                        id: g.id,
                        name: `${g.opp1} - ${g.opp2}`,
                        team1: g.opp1,
                        team2: g.opp2,
                        score: g.score,
                        startTime: g.dateStart,
                        leagueId: c.id,
                        leagueName: c.name,
                        sportName: sportName
                    });
                });
            });
        });

        res.setHeader('Cache-Control', 's-maxage=60');
        return res.status(200).json(results);

    } catch (error) {
        console.error("Search API Error:", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
