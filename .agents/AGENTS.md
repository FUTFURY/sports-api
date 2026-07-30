# Règles de Projet & Spécifications API

Ce projet est une API de proxying temps-réel (Just-In-Time) et d'historique (jusqu'à 18 mois) construite au-dessus de 1xBet et d'EventsStat pour alimenter un frontend multisports.

---

## 🛡️ Règle de Robustesse : Résolution des Miroirs

En raison des blocages Cloudflare géographiques et de taux, **toutes les requêtes de scraping vers 1xBet doivent transiter par le résolveur dynamique de miroir** implémenté dans `services/1xbetService.js` :
* Ping simultané (`Promise.any`) sur les miroirs de `1xbet_countries_mirrors.json`.
* Validation du format (type de réponse attendu : `json`).
* Rotation automatique du miroir sur échec 429 / 403.

---

## 📊 Endpoints Clés de Production Vercel

* **Miroir Actuel en Production** : `https://sports-api-hazel.vercel.app`

### Endpoints Standard
* `GET /api/sports?active=true` : Catalogue des sports configurés et capacités de données.
* `GET /api/matches?sportId={sportId}` : Matchs live et à venir.
* `GET /api/calendar?date={YYYY-MM-DD}&sportId={sportId}` : Matchs passés (jusqu'à 18 mois max) et futurs.
* `GET /api/rankings?type=atp|wta` : Classements officiels actuels.

### Endpoint Avancé : `GET /api/match/stats`
Permet de récupérer les statistiques avancées en parsant le Nuxt State de la page `statisticpopup` d'EventsStat :
* **Paramètres** : `?sgi={eventsstatMatchId}&sport={sportSlug}`
* **Données retournées** :
  * **H2H** (victoires/défaites des face-à-face).
  * **Lineups** (composition d'équipe, formations de jeu, remplaçants).
  * **Highlights** (buts, cartons, changements minute par minute).
  * **Commentary** (commentaires textuels minute par minute).
  * **Venue / Court** (caractéristiques du terrain, dimensions, type de surface).
  * **Draw** (arbre de tournois / brackets).

### Données Radar & Coordonnées 2D
Les endpoints `GET /api/matches?sportId={sportId}` et `GET /api/match/{id}` retournent directement les champs :
* **`zone`** (objet `Z` de 1xBet) : Coordonnées en direct de la balle/possession.
* **`radar2D`** (objet `Z2D` de 1xBet) : Flux brut des coordonnées cartésiennes X/Y en direct pour le widget 2D interactif.

---

## 📄 Documentation Détaillée et Formats JSON

Pour développer un frontend sur cette API, **consultez obligatoirement le fichier `API_DOCUMENTATION.md`** à la racine du projet. 
Voici les formats clés à retenir :

### Structure `/api/matches` (Live & Upcoming)
La réponse sépare strictement les matchs en direct (`live`) et à venir (`upcoming`) sous la clé `data` :
```json
{
  "success": true,
  "data": {
    "live": [ { "id": 1, "title": "Team A vs Team B", "isLive": true, ... } ],
    "upcoming": [ { "id": 2, "title": "Team C vs Team D", "isLive": false, ... } ]
  }
}
```

### Structure `/api/calendar` (Passés)
```json
{
  "success": true,
  "date": "2024-05-10",
  "data": {
    "past": [ { "id": 3, "title": "Team E vs Team F", "isLive": false, ... } ]
  }
}
```
