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

    // 2. Constants
    const { lng = "fr" } = req.query;
    // Standard LineFeed endpoint
    const url = `https://sa.1xbet.com/LineFeed/GetSportsShortZip?lng=${lng}&tf=2200000&tz=3&country=1`;

    // 3. Secure Headers
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        const response = await fetch(url, { headers });
        const text = await response.text();

        if (!response.ok) {
            return res.status(response.status).json({
                error: "1xBet HTTP Error",
                status: response.status,
                details: text.substring(0, 500)
            });
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return res.status(500).json({
                error: "Invalid JSON",
                message: "1xBet returned HTML instead of JSON",
                preview: text.substring(0, 500)
            });
        }

        // 4. Transform & Add Icons
        const sports = (data.Value || []).map(s => ({
            id: s.I,
            name: s.N,
            icon: `https://v2.1xbet.com/simg/sports/light/${s.I}.svg`,
            count: s.C || 0
        }));

        sports.sort((a, b) => a.id - b.id);

        res.setHeader('Cache-Control', 's-maxage=3600');
        return res.status(200).json(sports);

    } catch (error) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
            stack: error.stack
        });
    }
}
