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

    // Use the Authenticated v2/sports endpoint
    // Requires exact parameter sorting: dateFrom, dateTo, lng, sportIds
    let now = Math.floor(Date.now() / 1000);
    now = now - (now % 300);
    const day = 86400;
    const dateFrom = now - day;
    const dateTo = now + day;

    // We pass sportIds=1 to satisfy the validator, but the endpoint returns active sports
    const base = "https://sa.1xbet.com/service-api/result/web/api/v2/sports";
    const dynamicUrl = `${base}?dateFrom=${dateFrom}&dateTo=${dateTo}&lng=fr&sportIds=1`;

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

        const items = data.items || [];

        // Map API data to our clean format
        // Use Official Name from API + Reliable Icon from Iconify
        const sports = items.map(s => {
            const iconName = SPORT_ICONS[s.id] || "mdi:trophy-variant";
            return {
                id: s.id,
                name: (s.name || "").trim(), // Official Name
                icon: `https://api.iconify.design/${iconName}.svg?color=%23333333`
            };
        });

        // Sort: Top sports first (based on ID list) or mapped icons
        const topIds = [1, 4, 3, 2]; // Football, Tennis, Basket, Hockey
        sports.sort((a, b) => {
            const indexA = topIds.indexOf(a.id);
            const indexB = topIds.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.id - b.id;
        });

        res.setHeader('Cache-Control', 's-maxage=3600');
        return res.status(200).json(sports);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
