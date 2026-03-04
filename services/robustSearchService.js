// robustSearchService.js
// Handles domain rotation to bypass IP blocks in serverless environments like Vercel.

const XBET_MIRRORS = [
    'https://sa.1xbet.com',
    'https://1xbet.pe',
    'https://1xbet.mobi',
    'https://1xbet.sh',
    'https://1xbet.com'
];

const STAT_MIRRORS = [
    'https://eventsstat.com',
    'https://1xstavka.ru' // EventStat engine is often mirrored here
];

/**
 * Attempts to fetch from multiple mirrors until one succeeds.
 */
export async function fetchWithRotation(path, type = '1xbet', options = {}) {
    const mirrors = type === '1xbet' ? XBET_MIRRORS : STAT_MIRRORS;
    const errors = [];

    for (const mirror of mirrors) {
        try {
            const url = `${mirror}${path}`;
            console.log(`[RobustSearch] Trying mirror: ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per mirror

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': `${mirror}/en/`,
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log(`[RobustSearch] Success with mirror: ${mirror}`);
                return data;
            }

            errors.push(`${mirror}: HTTP ${response.status}`);
        } catch (err) {
            console.error(`[RobustSearch] Failed mirror ${mirror}:`, err.message);
            errors.push(`${mirror}: ${err.message}`);
        }
    }

    throw new Error(`All mirrors failed: ${errors.join(', ')}`);
}
