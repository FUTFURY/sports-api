import puppeteer from 'puppeteer';

(async () => {
    try {
        console.log("Connexion à ton Google Chrome...");
        const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });

        const attachToPage = (page) => {
            if (!page) return;
            page.on('response', async (response) => {
                const url = response.url();
                const req = response.request();

                if (url.includes('result') || url.includes('Match') || url.includes('LineFeed') || url.includes('LiveFeed') || url.includes('getresults')) {
                    if (['fetch', 'xhr'].includes(req.resourceType()) && !url.includes('metrika') && !url.includes('yandex')) {
                        console.log(`\n✅ REQUÊTE CAPTURÉE : ${req.method()} ${url}`);
                        if (req.postData()) {
                            console.log(`📦 Payload:`, req.postData());
                        }

                        try {
                            const body = await response.text();
                            if (body.length > 0 && !body.includes('<!DOCTYPE html>')) {
                                console.log(`📄 Response Preview:`, body.substring(0, 800));
                            }
                        } catch (e) { }
                    }
                }
            });
        };

        browser.on('targetcreated', async target => {
            if (target.type() === 'page') {
                const page = await target.page();
                attachToPage(page);
            }
        });

        const pages = await browser.pages();
        for (const page of pages) attachToPage(page);

        console.log("🔥 ESPIONNAGE ACTIF 🔥");
        console.log("Maintenant, retourne sur Chrome, active ton VPN s'il ne l'est pas, et lance une recherche de matchs passés (Tennis) ! Je lis tout en arrière-plan.");
    } catch (e) {
        console.log("Impossible de se lier à Chrome:", e.message);
    }
})();
