
// using global fetch
// Script to test CORS on SignalR endpoint

async function testCors() {
    const url = "https://maxizone.win/playerzone/negotiate?negotiateVersion=1";

    // Simulate a request from a random localhost
    const headers = {
        "Origin": "http://localhost:3000",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    };

    console.log(`Fetching ${url} with Origin: ${headers.Origin}...`);
    try {
        const resp = await fetch(url, { method: 'POST', headers });
        console.log(`Status: ${resp.status}`);

        // Check Access-Control-Allow-Origin header
        const allowOrigin = resp.headers.get('access-control-allow-origin');
        console.log(`Access-Control-Allow-Origin: ${allowOrigin}`);

        if (resp.ok) {
            console.log("Response Body:", await resp.text());
            if (allowOrigin === "*" || allowOrigin === headers.Origin) {
                console.log("CORS CHECK PASSED: Frontend can connect directly.");
            } else {
                console.log("CORS CHECK FAILED: Browser will block this.");
            }
        } else {
            console.log("Request Failed (likely blocked or 403).");
            console.log("Body:", await resp.text());
        }

    } catch (e) { console.error("Error:", e); }
}

testCors();
