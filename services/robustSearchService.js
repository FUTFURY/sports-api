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

    for (const mirror of mirrors) {
        try {
            const url = `${mirror}${path}`;
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
                // Basic check if it's HTML instead of JSON
                const bodyStr = typeof response.body === 'string' ? response.body.trim() : '';
                const isHtml = bodyStr.startsWith('<') || bodyStr.startsWith('<!doctype') || bodyStr.startsWith('﻿<');
                
                if (isHtml) {
                    console.log(`[RobustSearch] Mirror ${mirror} returned HTML instead of JSON, skipping...`);
                    errors.push(`${mirror}: Returned HTML`);
                    continue;
                }

                console.log(`[RobustSearch] Success with mirror: ${mirror}`);
                return response.body;
            }

            errors.push(`${mirror}: Empty body`);
        } catch (err) {
            console.error(`[RobustSearch] Failed mirror ${mirror}:`, err.message);
            errors.push(`${mirror}: ${err.message}`);
        }
    }

    throw new Error(`All mirrors failed: ${errors.join(', ')}`);
}
