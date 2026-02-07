
// using global fetch
// Script to debug get-live-games.js logic using the *exact* URL that worked in read_url_content

async function debugWorkingUrl() {
    // This URL worked in read_url_content!
    const url = `https://sa.1xbet.com/service-api/result/web/api/v3/games?champId=119237&dateFrom=1770211200&dateTo=1770297600&lng=fr&ref=1`;

    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/results",
        "Cookie": "",
        "x-hd": ""
    };

    console.log(`Fetching ${url}...`);
    try {
        const resp = await fetch(url, { headers });
        console.log(`Status: ${resp.status}`);

        if (!resp.ok) {
            console.log("Response text:", await resp.text());
            return;
        }

        const data = await resp.json();
        console.log("Data keys:", Object.keys(data));
        console.log("Items:", (data.items || []).length);

    } catch (e) { console.error("Error", e); }
}

debugWorkingUrl();
