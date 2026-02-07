
// using global fetch
// Script to find definitions of Dw and Ow variables

async function findDefinitions() {
    const baseUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2/assets";
    const mainJs = "index-B89oW5A2.js";
    const url = `${baseUrl}/${mainJs}`;

    const headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    };

    try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) return;
        const text = await resp.text();

        // Search for Dw = "..." or Dw="..."
        // Minified code often does: const Dw="JoinGame";
        // or var Dw="JoinGame"

        // Regex for string assignment to Dw or Ow
        const regexes = [
            /Dw\s*=\s*["']([^"']+)["']/,
            /Ow\s*=\s*["']([^"']+)["']/,
            /var\s+Dw\s*=\s*["']([^"']+)["']/,
            /const\s+Dw\s*=\s*["']([^"']+)["']/,
            /var\s+Ow\s*=\s*["']([^"']+)["']/,
            /const\s+Ow\s*=\s*["']([^"']+)["']/
        ];

        console.log("--- Searching for Definitions ---");
        regexes.forEach(r => {
            const m = text.match(r);
            if (m) console.log(`Match: ${m[0]} -> Value: ${m[1]}`);
        });

        // Also just look for "Ow" and "Dw" occurrences to see context if regex fails
        // They might be imported: import { ..., Dw, ... } from ...
        // In that case, we need to trace the import.

        // Let's print the first few occurrences of Dw and Ow to see context
        ["Dw", "Ow"].forEach(v => {
            const idx = text.indexOf(v);
            if (idx !== -1) {
                console.log(`\nContext for ${v}:`);
                console.log(text.substring(Math.max(0, idx - 100), idx + 100));
            }
        });

    } catch (e) { console.error(e); }
}

findDefinitions();
