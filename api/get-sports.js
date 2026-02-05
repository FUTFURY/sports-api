const SPORT_NAMES = {
    1: "Football", 2: "Hockey sur glace", 3: "Basket-ball", 4: "Tennis", 5: "Volley-ball",
    6: "Athlétisme", 7: "Sports mécaniques", 8: "Tennis de table", 9: "Darts", 10: "Snooker",
    11: "Futsal", 12: "Football Américain", 13: "Boxe", 15: "Floorball", 17: "Water-polo",
    19: "Badminton", 20: "Rugby", 21: "Curling", 23: "Futsal", 29: "Cricket",
    33: "Handball", 40: "Esports", 85: "Baseball", 91: "Beach Volley"
};

const SPORT_ICONS = {
    1: "mdi:soccer", 2: "mdi:hockey-sticks", 3: "mdi:basketball", 4: "mdi:tennis",
    5: "mdi:volleyball", 6: "mdi:run", 7: "mdi:car-sports", 8: "mdi:table-tennis",
    9: "mdi:bullseye-arrow", 10: "mdi:billiards", 12: "mdi:football",
    13: "mdi:boxing-glove", 19: "mdi:badminton", 20: "mdi:rugby",
    29: "mdi:cricket", 33: "mdi:handball", 40: "mdi:controller",
    85: "mdi:baseball", 91: "mdi:volleyball"
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

    // Capture active sports via Championships (Robust & Bypass Block)
    let now = Math.floor(Date.now() / 1000);
    now = now - (now % 300);
    const day = 86400;

    // Broad list of IDs to check
    const ids = Object.keys(SPORT_NAMES).join(',');
    const dynamicUrl = `https://sa.1xbet.com/service-api/result/web/api/v2/champs?dateFrom=${now - day}&dateTo=${now + day}&lng=fr&sportIds=${ids}`;

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

        const uniqueSports = {};
        const items = data.items || [];

        items.forEach(c => {
            if (!uniqueSports[c.sportId]) {
                const iconName = SPORT_ICONS[c.sportId] || "mdi:trophy-variant";
                uniqueSports[c.sportId] = {
                    id: c.sportId,
                    name: SPORT_NAMES[c.sportId] || `Sport ${c.sportId}`,
                    // Serve a reliable public SVG icon (Vector)
                    icon: `https://api.iconify.design/${iconName}.svg?color=%23333333`,
                    count: 0
                };
            }
            uniqueSports[c.sportId].count += (c.gamesCount || 0);
        });

        const sportsList = Object.values(uniqueSports).sort((a, b) => {
            // Priority Sort
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
