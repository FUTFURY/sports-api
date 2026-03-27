// robustSearchService.js
// Handles domain rotation to bypass IP blocks in serverless environments like Vercel.
import { gotScraping } from 'got-scraping';

const XBET_MIRRORS = [
    'https://sa.1xbet.com',
    'https://1xbet.pe',
    'https://1xbet.mobi',
    'https://1xbet.sh',
    'https://1xbet.com'
];

const STAT_MIRRORS = [
    'https://eventsstat.com',
    'https://sa.1xbet.com',
    'https://1xbit-stat.com',
    'https://melbet-stat.com',
    'https://888starz-stat.com',
    'https://1xstavka.ru',
    'https://betandyou-stat.com'
];

/**
 * Attempts to fetch from multiple mirrors until one succeeds.
 */
export async function fetchWithRotation(path, type = '1xbet', options = {}) {
    const mirrors = type === '1xbet' ? XBET_MIRRORS : STAT_MIRRORS;
    const errors = [];

    // For stats, prioritize mirroring sa.1xbet.com if it's in the list
    const sortedMirrors = type === 'stat' ? 
        [...mirrors].sort((a,b) => a.includes('1xbet') ? -1 : 1) : mirrors;

    for (const mirror of sortedMirrors) {
        // Try original path and potential alternate path
        const pathsToTry = [path];
        if (type === 'stat' && (path.includes('services-api') || path.includes('service-api'))) {
            const alt = path.includes('services-api') ? path.replace('services-api', 'service-api') : path.replace('service-api', 'services-api');
            pathsToTry.push(alt);
        }

        for (const currentPath of pathsToTry) {
            try {
                const url = `${mirror}${currentPath}`;
                console.log(`[RobustSearch] Trying mirror: ${url}`);

                const response = await gotScraping.get(url, {
                    ...options,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Referer': `${mirror}/en/`,
                        'Accept': 'application/json, text/plain, */*',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...options.headers
                    },
                    responseType: 'json',
                    timeout: { request: 5000 }
                });

                if (response.body) {
                    const bodyStr = typeof response.body === 'string' ? response.body.trim() : '';
                    const isHtml = bodyStr.startsWith('<') || bodyStr.startsWith('<!doctype') || bodyStr.startsWith('﻿<');
                    
                    if (isHtml) {
                        console.log(`[RobustSearch] Mirror ${mirror} returned HTML for ${currentPath}, skipping...`);
                        continue;
                    }

                    if (response.body.success === false && response.body.message) {
                        console.log(`[RobustSearch] Mirror ${mirror} returned success:false for ${currentPath}: ${response.body.message}`);
                        continue;
                    }

                    console.log(`[RobustSearch] Success with mirror: ${mirror} on path ${currentPath}`);
                    return response.body;
                }
            } catch (err) {
                console.error(`[RobustSearch] Failed mirror ${mirror} on ${currentPath}:`, err.message);
                errors.push(`${mirror}${currentPath}: ${err.message}`);
            }
        }
    }

    throw new Error(`All mirrors failed: ${errors.join(', ')}`);
}
