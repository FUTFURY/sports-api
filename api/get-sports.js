const SPORT_NAMES = {
    1: "Football", 2: "Hockey sur glace", 3: "Basket-ball", 4: "Tennis", 5: "Volley-ball",
    6: "Athlétisme", 7: "Sports mécaniques", 8: "Tennis de table", 9: "Darts", 10: "Snooker",
    12: "Football Américain", 13: "Boxe", 15: "Floorball", 17: "Water-polo", 19: "Badminton",
    20: "Rugby", 23: "Futsal", 29: "Cricket", 40: "Esports", 85: "Baseball"
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Use the endpoint that WORKS (v2/champs) instead of the blocked one (LineFeed)
    // Dynamic dates: -1 day to +1 day to capture active sports, rounded to 5 min (300s)
    let now = Math.floor(Date.now() / 1000);
    now = now - (now % 300); // Round down to nearest 5 minutes

    const day = 86400;
    const dynamicUrl = `https://sa.1xbet.com/service-api/result/web/api/v2/champs?dateFrom=${now - day}&dateTo=${now + day}&lng=fr`;

    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        const response = await fetch(dynamicUrl, { headers });
        const text = await response.text();

        if (!response.ok) {
            return res.status(response.status).json({ error: "1xBet HTTP Error", details: text.substring(0, 500) });
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return res.status(500).json({ error: "Invalid JSON", preview: text.substring(0, 500) });
        }

        // Aggregate unique sports from the championships list
        const uniqueSports = {};
        const items = data.items || [];

        items.forEach(c => {
            if (!uniqueSports[c.sportId]) {
                uniqueSports[c.sportId] = {
                    id: c.sportId,
                    name: SPORT_NAMES[c.sportId] || `Sport ${c.sportId}`,
                    icon: `https://v2.1xbet.com/simg/sports/light/${c.sportId}.svg`,
                    count: 0
                };
            }
            uniqueSports[c.sportId].count += (c.gamesCount || 0);
        });

        const sportsList = Object.values(uniqueSports).sort((a, b) => {
            // Sort priority: Football(1) > Tennis(4) > Others by active games
            if (a.id === 1) return -1;
            if (b.id === 1) return 1;
            return b.count - a.count;
        });

        res.setHeader('Cache-Control', 's-maxage=3600');
        return res.status(200).json(sportsList);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
