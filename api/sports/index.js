import { createRequire } from 'module';
import { withCors } from '../../utils/cors.js';

// Charge les fichiers JSON statiques
const require = createRequire(import.meta.url);
const allSports       = require('../../allsport.json');
const historyMatrix   = require('../../sports_history_matrix.json');

// Index de la matrice par sportId pour O(1) lookup
const matrixIndex = new Map(historyMatrix.map(s => [s.sportId, s]));

/**
 * GET /api/sports
 * GET /api/sports?active=true     → uniquement les sports avec au moins 1 event upcoming ou hier
 * GET /api/sports?cyber=false     → exclut les cyber-sports (défaut: false)
 * GET /api/sports?sportId=N       → détail d'un sport spécifique
 *
 * Retourne la liste des sports configurés avec leurs capacités :
 *  - upcoming  : nombre de matchs futurs actifs (LineFeed)
 *  - hasResults: true si des résultats passés sont disponibles (fenêtre 18 mois)
 *  - hasPast18m: true si des données à 18 mois existent
 */
const handler = (req, res) => {
    const filterActive = req.query.active === 'true';
    const includeCyber = req.query.cyber  === 'true';  // défaut: false
    const sportIdParam = req.query.sportId ? parseInt(req.query.sportId) : null;

    // Si sportId spécifique → retourne ce sport uniquement
    if (sportIdParam) {
        const sport = allSports.find(s => s.sportId === sportIdParam);
        if (!sport) {
            return res.status(404).json({ success: false, message: `Sport ${sportIdParam} non trouvé` });
        }
        return res.status(200).json({
            success: true,
            data: enrichSport(sport)
        });
    }

    let sports = allSports;

    // Filtre cyber sports (default: exclus)
    if (!includeCyber) {
        sports = sports.filter(s => !s.isCyber);
    }

    // Enrich avec capabilities
    let enriched = sports.map(enrichSport);

    // Filtre active (a au moins 1 event upcoming ou résultats hier)
    if (filterActive) {
        enriched = enriched.filter(s =>
            s.capabilities.upcoming > 0 ||
            s.capabilities.results.hasYesterday
        );
    }

    res.status(200).json({
        success: true,
        total:   enriched.length,
        data:    enriched
    });
};

function enrichSport(sport) {
    const matrix = matrixIndex.get(sport.sportId);

    return {
        sportId:     sport.sportId,
        name:        sport.name,
        shortName:   sport.shortName,
        command:     sport.command,      // "Mi-Temps", "Set", "Quart-temps"...
        subCommand:  sport.subCommand,
        isTeamSport: sport.isTeamSport,
        isCyber:     sport.isCyber,
        subSports:   sport.subSports || [],
        capabilities: matrix ? {
            upcoming:  matrix.upcoming,
            results: {
                hasYesterday: matrix.results.hier.ok && matrix.results.hier.count > 0,
                has6months:   matrix.results['6mois'].ok && matrix.results['6mois'].count > 0,
                has18months:  matrix.results['18mois'].ok && matrix.results['18mois'].count > 0,
                beyondLimit:  false  // Universel : 0 sport dépasse 18 mois
            }
        } : {
            upcoming: 0,
            results: { hasYesterday: false, has6months: false, has18months: false, beyondLimit: false }
        }
    };
}

export default withCors(handler);
