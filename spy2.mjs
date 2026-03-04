import puppeteer from 'puppeteer';

(async () => {
    try {
        console.log("Démarrage du Chrome de Melvin avec écouteur réseau...");
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            userDataDir: '/Users/melvinalgane/Library/Application Support/Google/Chrome',
            defaultViewport: null,
            args: ['--start-maximized']
        });

        // Ouvrir 1xbet
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        page.on('response', async (response) => {
            const url = response.url();
            const req = response.request();
            if (url.includes('result') || url.includes('Match') || url.includes('LiveFeed') || url.includes('LineFeed')) {
                if (['fetch', 'xhr'].includes(req.resourceType()) && !url.includes('metrika') && !url.includes('yandex')) {
                    console.log(`\n========================================`);
                    console.log(`🔥 ENDPOINT TROUVÉ : ${req.method()} ${url}`);
                    if (req.postData()) {
                        console.log(`📦 PAYLOAD:`, req.postData());
                    }
                    try {
                        const body = await response.text();
                        if (!body.includes('<!DOCTYPE html>')) {
                            console.log(`📄 PREVIEW (1000 chars):\n`, body.substring(0, 1000));
                        } else {
                            console.log(`🔴 BLOCKED BY CLOUDFLARE`);
                        }
                    } catch (e) { }
                    console.log(`========================================\n`);
                }
            }
        });

        await page.goto('https://1xbet.com/en/results/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log("✅ Chrome est ouvert ! Si tu as la popup pour 'Restaurer', clique sur Restaurer (c'est normal).");
        console.log("👉 Vérifie que ton VPN est bien activé ! Puis clique sur la page pour charger des résultats (Tennis).");

        // Keep it alive
        await new Promise(resolve => setTimeout(resolve, 300000));
        await browser.close();
    } catch (e) {
        console.log("Erreur au lancement:", e.message);
    }
})();
