import zlib from 'zlib';

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

    // 3. SECURE Search Endpoint ("Golden Ticket")
    // Using the LineFeed/Web_SearchZip endpoint which returns high quality data
    const url = "https://sa.1xbet.com/service-api/LiveFeed/Web_SearchZip";

    // Headers captured from the user's browser (The "Golden Ticket")
    const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "origin": "https://sa.1xbet.com",
        "referer": "https://sa.1xbet.com/fr/line/golf?platform_type=desktop",
        "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-app-n": "__BETTING_APP__",
        // Crucial security headers
        "x-hd": "Y6mGTs6B1g4AtkRvJ5Be2k3WHr/XZR3DVr7qjTCmnDyUOmmpamuvSt8iQX6u1p/p04KBwwlrk1mLq56gddtcOoktLfKXiTlS9rzc6Gh+7+daHhi2XZbqotG1rx4HaPaGJyGjJRWqc9HIQ+0xWMzShECiZR4PjWG1IqzyuSvJSF486tY0Vthq/p9WQvRWFAb4rdZs8b06bYbg1WEoyKRXbD+pc2fXvc9aQE4yRLQqYiIMupvscZw8TZIh6rOcNiHPG7UBx3HqBsNVMQOx8SkSR0cA4ZUpWadvVV1pN2BArvISx+MxwvQhXG1pwiH5JJemrNOUr0ph06RDFrFj/1FycC/TVsTGAycmg2+MO0KtD2rmQkzzW9st0QvfEuTM+VtOjOh2eKnVPYTs5CAyRSMVBaAAAUkYgREcTFnEmtjy8qLQ74az1se2VeUG3m+ZBWfu89gU93VMSSsnLFJtww8pawycozVlSqTdDIo2WdaOJ9G/MoisBEETn+MT1Vq2FR1lXoJ7RniE4YcxG2jcZU8olTwOf1XNokEwKQLtEnnHQN2zx9K77oIiMZUmWMZoKpStjT9PsqFPr5EF5tE+pmVeG2sG/MMTHbw=",
        "x-mobile-project-id": "0",
        "x-requested-with": "XMLHttpRequest",
        "x-svc-source": "__BETTING_APP__"
    };

    const params = new URLSearchParams({
        text: text,
        limit: "50",
        gr: "1208", // Optional but keeps consistent with browser
        lng: lng,
        country: "158",
        mode: "4"
    });

    try {
        console.log(`Searching (Secure): ${url}?${params.toString()}`);
        const response = await fetch(`${url}?${params.toString()}`, { headers });

        if (!response.ok) {
            console.error("1xBet Error Status:", response.status);
            return res.status(response.status).json({ error: "1xBet Secure API Error", details: await response.text() });
        }

        // Handle ZSTD or GZIP decompression
        // Node fetch might handle gzip automatically, but zstd usually requires manual handling
        // For simplicity in Vercel environment, we rely on standard fetch handling unless zstd is explicitly needed
        // The browser user-agent usually requests br/gzip

        const data = await response.json();

        // 5. Transform Data to match our Frontend Schema
        // The secure API returns: { Value: [ { N: "Team Name", ... } ] }
        let results = [];
        const items = data.Value || [];

        items.forEach(item => {
            // Map 1xBet "Secure" items to our schema

            // It seems "O1" and "O2" are the opponents
            // "L" is League Name
            // "S" is Start Time (unix timestamp)

            const team1 = item.O1 || "";
            const team2 = item.O2 || "";
            const league = item.L || "Unknown League";
            const sport = item.SN || "Unknown Sport"; // Sport Name
            const id = item.I || Math.random().toString();

            // Add as Game
            results.push({
                type: 'Game',
                id: id,
                name: `${team1} - ${team2}`,
                team1: team1,
                team2: team2,
                score: item.SC ? `${item.SC.FS?.S1 || 0}-${item.SC.FS?.S2 || 0}` : "", // Score info is nested in SC
                startTime: item.S, // Unix timestamp in seconds
                leagueId: item.LI,
                leagueName: league,
                sportName: sport,
                // Additional Metadata
                isLive: item.SC && item.SC.CPS !== "D\u00e9but dans", // Heuristic
            });

            // Also add "Teams" directly if they match query
            const lowerQuery = text.toLowerCase();
            [team1, team2].forEach(teamName => {
                if (teamName && teamName.toLowerCase().includes(lowerQuery)) {
                    // Check if we already added this team
                    if (!results.find(r => r.type === 'Team' && r.name === teamName)) {
                        results.push({
                            type: 'Team',
                            id: `team_${Math.random().toString(36).substr(2, 9)}`,
                            name: teamName,
                            sportName: sport,
                            leagueName: league,
                            logo: item.O1IMG && item.O1 === teamName ? `https://image.1xbet.com/${item.O1IMG[0]}` :
                                item.O2IMG && item.O2 === teamName ? `https://image.1xbet.com/${item.O2IMG[0]}` : null
                        });
                    }
                }
            });
        });

        // Remove duplicates and sort
        // Prioritize distinct Teams
        results.sort((a, b) => {
            if (a.type === 'Team' && b.type !== 'Team') return -1;
            if (a.type !== 'Team' && b.type === 'Team') return 1;
            return 0;
        });

        res.setHeader('Cache-Control', 's-maxage=60');
        return res.status(200).json(results);

    } catch (error) {
        console.error("Secure Search API Error:", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
