
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Default: Today +/- 1 day logic for active sports
    let now = Math.floor(Date.now() / 1000);
    now = now - (now % 300); // 5-min alignment
    const day = 86400;

    // Allow overriding from Query Params
    const {
        dateFrom = now - day,
        dateTo = now + day,
        lng = "fr"
    } = req.query;

    // We pass sportIds=1 to satisfy the validator, but the 1xBet endpoint returns active sports
    const base = "https://sa.1xbet.com/service-api/result/web/api/v2/sports";
    const dynamicUrl = `${base}?dateFrom=${dateFrom}&dateTo=${dateTo}&lng=${lng}&sportIds=1`;

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
        // Use Official Name from API
        const sports = items.map(s => {
            return {
                id: s.id,
                name: (s.name || "").trim() // Official Name
            };
        });

        // Sort: Top sports first (based on ID list)
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
