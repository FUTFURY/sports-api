import { gotScraping } from 'got-scraping';
import cache from './utils/cache.js';

const EVENTSSTAT_CORE_SEARCH = 'https://eventsstat.com/fr/services-api/core-api/v1/search';

const COMMON_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://eventsstat.com/fr/statistic/03.03.2026',
    'Origin': 'https://eventsstat.com'
};

/**
 * Recherche des entités (équipes, ligues, joueurs) directement sur EventsStat.
 * C'est l'explication de l'autocomplete de 1xBet.
 *
 * @param {string} query
 * @param {number} sportId (1=Football, 4=Tennis, etc.)
 */
export const searchEntity = async (query, sportId = 1) => {
    try {
        const url = `${EVENTSSTAT_CORE_SEARCH}?search=${encodeURIComponent(query)}&sportId=${sportId}&lng=fr&ref=1&fcountry=91&gr=285`;
        const { body } = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });

        return body;
    } catch (err) {
        console.error('Failed to search entity', err.message);
        return { data: [], totalCount: 0 };
    }
};

searchEntity('ps', 1).then(res => {
    console.log('Result for PS:', res);
});
