// using global fetch

async function testLineSearch() {
    const text = "psg";
    const url = `https://sa.1xbet.com/service-api/line/sports/search?text=${encodeURIComponent(text)}&lng=fr&mode=4&country=1`;
    // added mode=4&country=1 based on common 1xbet usage, or minimal params

    console.log(`Fetching: ${url}`);

    // Minimal headers
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/line",
        "Cookie": ""
    };

    try {
        const response = await fetch(url, { headers });
        console.log(`Status: ${response.status}`);

        if (!response.ok) {
            console.log("Error Body:", await response.text());
            return;
        }

        const data = await response.json();
        const sports = data.j || data.sport || []; // Line API sometimes uses 'j' or 'sport'

        console.log(`Found ${sports.length} categories.`);
        console.log(JSON.stringify(sports, null, 2));

    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

testLineSearch();
