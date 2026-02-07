
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

    // 2. Define 1xBet Live URL
    // Get1x2_VZip is standard for Live. 
    // sports=1 (Football)
    // count=50 (Top 50 games)
    // mode=4 (Top/All?)
    const url = `https://sa.1xbet.com/LiveFeed/Get1x2_VZip?sports=1&count=50&lng=fr&mode=4&country=1&partner=48&getEmpty=true`;

    // 3. Secure Headers (sharing same env vars as get-games)
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/live/football",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        console.log(`Fetching Live Games: ${url}`);
        const response = await fetch(url, { headers });

        if (!response.ok) {
            return res.status(response.status).json({ error: `1xBet Error: ${response.statusText}`, details: await response.text() });
        }

        const data = await response.json();

        // 4. Clean Data
        // Map 1xBet "Value" array to our app's Game format
        const games = (data.Value || []).map(game => ({
            id: game.I, // Game ID
            league_id: game.LI, // League ID
            league_name: game.L, // League Name
            teams: {
                home: game.O1,
                away: game.O2
            },
            score: game.SC?.FS?.S1 + ":" + game.SC?.FS?.S2, // Current Score
            startTime: game.S, // Start timestamp
            isLive: true,
            hasVideo: game.VA === 1, // Video Available flag
            hasZone: true // Assume all live games have zone for now
        }));

        // 5. Return JSON
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).json(games);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
