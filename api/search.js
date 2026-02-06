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
        let results = [];
        const sports = data.sport || [];
        const lowerQuery = text.toLowerCase();

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
                    count: (c.games || []).length,
                    leagueName: c.name // Self-reference for scoring
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

        // --- Extract Teams ---
        const distinctTeams = new Map();
        results.filter(r => r.type === 'Game').forEach(g => {
            [g.team1, g.team2].forEach(teamName => {
                const lowerTeam = teamName.toLowerCase();
                // Fuzzy match: if team name contains query or query contains team name
                if (lowerTeam.includes(lowerQuery) || lowerQuery.includes(lowerTeam)) {
                    if (!distinctTeams.has(teamName)) {
                        distinctTeams.set(teamName, {
                            type: 'Team',
                            id: `team_${teamName.replace(/\s+/g, '_')}`, // Virtual ID
                            name: teamName,
                            sportName: g.sportName,
                            leagueName: g.leagueName // Just for scoring context
                        });
                    }
                }
            });
        });

        results.push(...distinctTeams.values());

        // --- Relevance Scoring ---
        const penaltyKeywords = ["women", "femmes", "u19", "u21", "u23", "reserve", "youth", "esports", "cyber", "simulated", "rl", "2x4", "liga pro", " srl"];
        const majorLeagues = ["champions league", "ligue 1", "premier league", "laliga", "serie a", "bundesliga", "nba", "nhl", "euroleague"];
        const userAskedForSecondary = penaltyKeywords.some(k => lowerQuery.includes(k));

        results = results.map(item => {
            let score = 0;
            const lowerName = item.name.toLowerCase();
            const lowerLeague = (item.leagueName || "").toLowerCase();

            // 1. Match Quality
            if (lowerName === lowerQuery) score += 100;
            else if (lowerName.startsWith(lowerQuery)) score += 50;
            else if (lowerName.includes(lowerQuery)) score += 20;

            // 2. Penalties (The "Real Team" heuristic)
            const isSecondary = penaltyKeywords.some(k => lowerName.includes(k) || lowerLeague.includes(k));

            if (isSecondary && !userAskedForSecondary) {
                score -= 50;
            }

            // 3. League Boost (Prioritize top-tier events)
            if (majorLeagues.some(l => lowerLeague.includes(l))) {
                score += 25;
            }

            return { ...item, _score: score };
        });

        // Sort by score descending
        results.sort((a, b) => b._score - a._score);

        res.setHeader('Cache-Control', 's-maxage=60');
        return res.status(200).json(results);

    } catch (error) {
        console.error("Search API Error:", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
