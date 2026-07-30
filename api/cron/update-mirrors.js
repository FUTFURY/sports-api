import { gotScraping } from 'got-scraping';
import cache from '../../utils/cache.js';
import { withCors } from '../../utils/cors.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load default mirrors to bootstrap the list
function loadMirrorsList() {
    const DEFAULT_MIRROR = 'https://sa.1xbet.com';
    const filePath = join(process.cwd(), '1xbet_countries_mirrors.json');
    if (existsSync(filePath)) {
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf8'));
            const uniqueMirrors = new Set();
            for (const entry of data) {
                if (entry.all_mirrors) {
                    for (const m of entry.all_mirrors) {
                        uniqueMirrors.add(m.trim());
                    }
                }
            }
            return Array.from(uniqueMirrors);
        } catch (e) {
            console.error('[cron] Error reading json:', e.message);
        }
    }
    return [DEFAULT_MIRROR, 'https://1xbet.mobi', 'https://1xbet.lat', 'https://1xbet.com'];
}

// Predefined candidates to scan if all existing fail
const CANDIDATE_DOMAINS = [
    'https://sa.1xbet.com',
    'https://ca.1xbet.com',
    'https://1xbet.com',
    'https://1xbet.mobi',
    'https://1xbet.lat',
    'https://1xbet.cm',
    'https://1xbet.ng',
    'https://1xbet.kz',
    'https://1xbet.by',
    'https://1xbet.co.ke',
    'https://1xbet.co.ug'
];

async function testMirror(mirror) {
    try {
        const pingUrl = `${mirror}/service-api/LineFeed/GetSportsShortZip?lng=en`;
        const response = await gotScraping.get(pingUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: { request: 3000 },
            responseType: 'json',
            throwHttpErrors: true
        });
        if (response.statusCode === 200 && response.body && typeof response.body === 'object') {
            return true;
        }
    } catch (e) {
        // failed
    }
    return false;
}

const handler = async (req, res) => {
    console.log('[Cron/UpdateMirrors] Starting mirror health check and discovery...');
    
    // 1. Gather all candidates (cached, default list, and hardcoded TLDs)
    let currentMirrors = await cache.get('active_mirrors_list') || [];
    if (!currentMirrors.length) {
        currentMirrors = loadMirrorsList();
    }

    const allCandidates = Array.from(new Set([...currentMirrors, ...CANDIDATE_DOMAINS]));
    
    console.log(`[Cron/UpdateMirrors] Testing ${allCandidates.length} mirror candidates...`);

    const workingMirrors = [];
    
    // Test concurrently
    const testPromises = allCandidates.map(async (mirror) => {
        const ok = await testMirror(mirror);
        if (ok) {
            workingMirrors.push(mirror);
        }
    });

    await Promise.all(testPromises);

    console.log(`[Cron/UpdateMirrors] Found ${workingMirrors.length} working mirrors.`);

    if (workingMirrors.length > 0) {
        // Save to cache (24 hours TTL, or can be indefinite since Cron runs daily)
        await cache.set('active_mirrors_list', workingMirrors, 3600 * 24);
        
        // Also clear 'resolved_mirror' cache to force resolver to evaluate the new clean list
        await cache.del('resolved_mirror');

        return res.status(200).json({
            success: true,
            message: `Updated mirror cache with ${workingMirrors.length} working domains.`,
            mirrors: workingMirrors
        });
    } else {
        return res.status(500).json({
            success: false,
            message: 'All tested mirrors failed. Mirror list not updated.'
        });
    }
};

export default withCors(handler);
