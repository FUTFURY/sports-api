export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Constants (Dates could be dynamic in future)
    const {
        dateFrom = "1770211200",
        dateTo = "1770297600",
        sportId = "1" // Default Football
    } = req.query;

    const url = `https://sa.1xbet.com/service-api/result/web/api/v2/champs?dateFrom=${dateFrom}&dateTo=${dateTo}&lng=fr&ref=1&sportIds=${sportId}`;

    // 3. Secure Headers (from Env Vars)
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/results",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            return res.status(response.status).json({ error: "1xBet Error", details: await response.text() });
        }

        const data = await response.json();

        // 4. Clean Data
        const leagues = (data.items || []).map(l => ({
            id: l.id,
            name: l.name,
            count: l.gamesCount,
            logo: l.image // If available
        }));

        res.setHeader('Cache-Control', 's-maxage=300'); // Cache 5 min
        return res.status(200).json(leagues);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
