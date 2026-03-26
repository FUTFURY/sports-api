import { searchGlobal } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

const handler = async (req, res) => {
    try {
        const { q, lang, lng, tz } = req.query;
        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Supporte 'lang' ou 'lng', avec 'fr' par défaut pour éviter le Russe
        const finalLang = lang || lng || 'fr';
        const finalTz = tz || '1'; // GTM+1 par défaut (Paris)

        let results = await searchGlobal(q, finalLang, finalTz);

        // Optionnel : Enrichir les équipes avec leurs ligues si elles sont présentes dans les matchs de recherche
        // (Déjà fait partiellement par searchGlobal qui retourne des events/leagues)

        res.status(200).json({
            success: true,
            version: VERSION,
            data: results
        });
    } catch (error) {
        console.error('API Error /search:', error);
        // CRITICAL: Always return a success-like object to prevent iOS errors
        res.status(200).json({ success: false, version: VERSION, message: 'Search briefly unavailable', data: [] });
    }
};

export default withCors(handler);
