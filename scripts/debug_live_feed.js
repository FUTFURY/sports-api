
// using global fetch
// Script to debug get-live-games.js logic

async function debugLive() {
    // LiveFeed keeps redirecting. 
    // Let's try the V3 API which we know works for historical games, but for LIVE.
    // Usually removing dateFrom/dateTo and adding type/live works?
    // Or maybe just a different champId (live ones). 
    // Actually, let's try 'LiveFeed/Get1x2_VZip' but with different headers or flags?
    // Wait, the error is 'redirect count exceeded'. 
    // This often means we are being redirected to a captcha or login page.
    // Let's try the EXACT headers from the working request, including Referer.

    // Attempt 4: Use the service-api mirror which worked for historical games.
    // Maybe it has a live endpoint too?
    // https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip
    const url = `https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=1&count=50&lng=fr&mode=4&country=1`;

    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/live/football",
        // Note: In the Vercel function, we use process.env.ONEXBET_COOKIE
        // Here we might need to rely on the fact that sometimes it works without, or we need to grab a fresh one.
        // Let's try without first, as per the code committed (which uses fallback to "")
        "Cookie": "",
        "x-hd": ""
    };

    console.log(`Fetching ${url}...`);
    try {
        const resp = await fetch(url, { headers, redirect: 'manual' });
        console.log(`Status: ${resp.status}`);

        if (!resp.ok) {
            console.log("Response text:", await resp.text());
            return;
        }

        const data = await resp.json();
        console.log("Data keys:", Object.keys(data));

        if (data.Value && Array.isArray(data.Value)) {
            console.log(`Found ${data.Value.length} games.`);
            if (data.Value.length > 0) {
                const g = data.Value[0];
                console.log("Sample Game:", {
                    id: g.I,
                    team1: g.O1,
                    team2: g.O2,
                    video: g.VA
                });
            }
        } else {
            console.log("Value is empty or not an array:", data);
        }

    } catch (e) { console.error("Error", e); }
}

debugLive();
