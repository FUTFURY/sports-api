import { gotScraping } from 'got-scraping';

/**
 * Robust Search Service
 * Rotates through multiple domains to bypass IP blocks (like Vercel).
 */

const X1BET_DOMAINS = [
    'https://sa.1xbet.com',
    'https://1xbet.com',
    'https://1xbet.pe',
    'https://1xbet.mobi',
    'https://1xbet.xyz',
    'https://1xbet.sh'
];

const EVENTSSTAT_DOMAINS = [
    'https://eventsstat.com',
    'https://1xbet.eventsstat.com'
];

async function tryFetch(urls, options = {}) {
    let lastError;
    for (const url of urls) {
        try {
            console.log(`[ROBUST] Trying: ${url}`);
            const response = await gotScraping.get(url, {
                ...options,
                timeout: { request: 5000 }, // 5s timeout per try
                retry: { limit: 0 } // Handle retries manually via domain rotation
            });
            if (response.statusCode === 200) {
                console.log(`[ROBUST] Success with: ${url}`);
                return response.body;
            }
        } catch (error) {
            console.warn(`[ROBUST] Failed: ${url} - ${error.message}`);
            lastError = error;
        }
    }
    throw lastError || new Error('All domains failed');
}

export const searchEntitiesRobust = async (query, sportId = 1) => {
    const urls = EVENTSSTAT_DOMAINS.map(domain =>
        `${domain}/fr/services-api/core-api/v1/search?search=${encodeURIComponent(query)}&sportId=${sportId}&lng=fr&ref=1&fcountry=91&gr=285`
    );

    return tryFetch(urls, {
        responseType: 'json',
        headers: {
            'Referer': 'https://eventsstat.com/fr/statistic/',
            'Origin': 'https://eventsstat.com'
        }
    });
};

export const searchEventsRobust = async (query) => {
    const urls = X1BET_DOMAINS.map(domain =>
        `${domain}/service-api/LineFeed/Web_SearchZip?text=${encodeURIComponent(query)}&limit=20&lng=fr&country=158&mode=4`
    );

    return tryFetch(urls, { responseType: 'json' });
};

export default {
    searchEntitiesRobust,
    searchEventsRobust
};
