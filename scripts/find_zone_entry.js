
// using global fetch
async function findEntryPoint() {
    const baseUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2";
    const candidates = [
        "index.html",
        "index.htm",
        "manifest.json",
        "asset-manifest.json",
        "vite.svg", // sometimes vite apps have this
        "assets/index.css",
        "assets/index.js"
    ];

    const headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    };

    for (let file of candidates) {
        const url = `${baseUrl}/${file}`;
        console.log(`Checking ${url}...`);
        try {
            const resp = await fetch(url, { method: 'HEAD', headers });
            if (resp.ok) {
                console.log(`FOUND: ${url} (${resp.status})`);
                if (file.endsWith('.json') || file.endsWith('.html')) {
                    const body = await (await fetch(url, { headers })).text();
                    console.log("Context:", body.substring(0, 500));
                }
            } else {
                console.log(`Miss: ${resp.status}`);
            }
        } catch (e) { console.log("Error", e.message); }
    }
}

findEntryPoint();
