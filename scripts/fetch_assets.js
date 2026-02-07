
// using global fetch
// Script to fetch static assets with full headers to bypass potential 403s

async function fetchAssets() {
    // 1. CSS from screenshot (High probability of existing if snippet is recent)
    const cssUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2/assets/TriangleAttack-C8LXdf6u.css";
    // 2. JS from user text
    const jsUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2/assets/TriangleAttack-kHXelRZJ.js";

    const headers = {
        "accept": "text/css,*/*;q=0.1",
        "accept-encoding": "gzip, deflate",
        "accept-language": "fr,en-US;q=0.9,en;q=0.8",
        "referer": "https://sa.1xbet.com/",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "sec-fetch-dest": "style",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "same-origin"
    };

    console.log(`Fetching CSS: ${cssUrl}...`);
    try {
        const resp = await fetch(cssUrl, { headers });
        console.log(`CSS Status: ${resp.status}`);
        if (resp.ok) {
            console.log("CSS Found!");
        } else {
            console.log("CSS Failed.");
        }
    } catch (e) { console.error("CSS Error", e); }

    console.log(`\nFetching JS: ${jsUrl}...`);
    try {
        const jsHeaders = { ...headers, "accept": "*/*", "sec-fetch-dest": "script" };
        const resp = await fetch(jsUrl, { headers: jsHeaders });
        console.log(`JS Status: ${resp.status}`);
        if (resp.ok) {
            console.log("JS Found! Reading content...");
            const text = await resp.text();
            console.log("JS Length:", text.length);
            // Search for interesting keywords in the JS
            const keywords = ["wss://", "ws://", "api/", "Get", "Zone", "heatmap", "socket"];
            console.log("--- Keywords Found ---");
            keywords.forEach(k => {
                if (text.includes(k)) {
                    console.log(`Found '${k}'`);
                    // Print snippets
                    const idx = text.indexOf(k);
                    console.log(`...${text.substring(idx - 20, idx + 40)}...`);
                }
            });
        }
    } catch (e) { console.error("JS Error", e); }
}

fetchAssets();
