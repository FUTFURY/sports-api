const puppeteer = require('puppeteer');
const fs = require('fs');

async function refreshCookies() {
    console.log("🤖 Launching Headless Browser...");
    const browser = await puppeteer.launch({
        headless: "new", // Run in background
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 1. Visit the main site to trigger Cloudflare/Anti-bot
    console.log("🌍 Navigating to 1xBet...");
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    try {
        await page.goto('https://sa.1xbet.com/fr/results', { waitUntil: 'networkidle2', timeout: 60000 });

        // 2. Wait a bit for JS execution (Cookie generation)
        await new Promise(r => setTimeout(r, 5000));

        // 3. Extract Specific Cookies
        const cookies = await page.cookies();
        const requiredCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        console.log("\n🍪 FRESH COOKIES CAPTURED:");
        console.log(requiredCookies);

        // 4. (Optional) Update Vercel Env Var automatically
        // const { exec } = require('child_process');
        // exec(`vercel env add ONEXBET_COOKIE "${requiredCookies}" production`);

        // For now, save to local file
        fs.writeFileSync('fresh_cookies.txt', requiredCookies);
        console.log("\n✅ Saved to 'fresh_cookies.txt'");

    } catch (e) {
        console.error("❌ Error fetching cookies:", e);
    } finally {
        await browser.close();
    }
}

refreshCookies();
