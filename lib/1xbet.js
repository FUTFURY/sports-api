
export async function getLiveMatches() {
    // 1. URL with specific params
    const url = "https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=4&count=500&lng=fr&mode=4&country=1&partner=159&getEmpty=true&noFilterBlockEvent=true";

    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/live/tennis",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`1xBet API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const matches = data.Value || [];

        // Filter valid matches (must have ID and Players)
        return matches
            .filter(m => m.I && m.O1 && m.O2)
            .map(m => {
                const hasOdds = m.E && m.E.some(e => e.T === 1) && m.E.some(e => e.T === 3);

                // Safe extraction of score components
                let sets_p1 = m.SC?.FS?.S1 || 0;
                let sets_p2 = m.SC?.FS?.S2 || 0;

                let games_p1 = 0;
                let games_p2 = 0;

                // Games: Last element of PS (Period Scores)
                if (m.SC?.PS && Array.isArray(m.SC.PS) && m.SC.PS.length > 0) {
                    const lastPoint = m.SC.PS[m.SC.PS.length - 1]; // Latest set games
                    if (lastPoint?.Value) {
                        games_p1 = lastPoint.Value.S1;
                        games_p2 = lastPoint.Value.S2;
                    }
                }

                // Points: 15, 30, 40 (Try SC.S1 or SC.QP)
                let points_p1 = m.SC?.S1 ?? m.SC?.QP?.S1 ?? 0;
                let points_p2 = m.SC?.S2 ?? m.SC?.QP?.S2 ?? 0;

                return {
                    id: m.I,
                    p1: m.O1,
                    p2: m.O2,
                    league: m.L,
                    score: `${sets_p1}-${sets_p2}`, // Keep simple score for compatibility
                    sets_p1, sets_p2,
                    games_p1, games_p2,
                    points_p1, points_p2,
                    hasOdds,
                    startTime: m.S ? new Date(m.S * 1000).toISOString() : null,
                    // Pass raw structure if needed for details? 
                    // matches-live.js didn't return raw SC. 
                    // validMatches array was mapped.
                    // match/[id].js uses SC?.FS?.S1 etc. on the output? 
                    // No, match/[id].js finds user match from the list.
                    // If the list is already mapped, `match` will have mapped fields.
                    // BUT match/[id].js enriched logic:
                    // sets_p1: match.SC?.FS?.S1 ?? match.sets_p1 ?? 0,
                    // It checks `match.SC`. 
                    // The mapped object does NOT have `SC`.
                    // Original `matches-live.js` returned the MAPPED object.
                    // params `match` in `match/[id].js` is the Item from the list.
                    // So `match.SC` would be undefined.
                    // But `match.sets_p1` would be defined.
                    // So the enrichment `?? match.sets_p1` handles it.
                    // I will include SC/Raw data in the mapped object just in case?
                    // No, simpler is better. The `sets_p1` are already extracted.
                };
            });

    } catch (error) {
        console.error("Live Matches API Error:", error);
        return [];
    }
}
