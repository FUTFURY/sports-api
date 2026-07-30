# Documentation Exhaustive : API 1xBet & EventsStat (Multi-Sports)
## Session de validation : 08-07-2026

Ce document fournit la spécification technique complète et **validée empiriquement** pour le scraping des données sportives multi-sports depuis 1xBet et EventsStat. Chaque endpoint a été testé via des scripts Python sans navigateur.

---

## 🗂️ Sommaire
1. [Gestion des Miroirs](#1-gestion-des-miroirs)
2. [Headers HTTP](#2-headers-http)
3. [Endpoints 1xBet (Live, Upcoming, Past)](#3-endpoints-1xbet)
4. [Endpoints EventsStat (Rankings, Joueurs)](#4-endpoints-eventsstat)
5. [Limites Connues & Findings](#5-limites-connues--findings)
6. [Modèles JSON Normalisés](#6-modèles-json-normalisés)

---

## 1. Gestion des Miroirs

1xBet applique des blocages géographiques fréquents. Le miroir stable validé :

| Domaine | Statut |
|---------|--------|
| `https://sa.1xbet.com` | ✅ Principal (stable) |
| `https://1xbet.com` | ✅ Fonctionne |
| `https://1x-bet.mobi` | ✅ Fonctionne |
| `https://ca.1xbet.com` | ✅ Canada (régional) |

**Fichier miroirs** : [1xbet_countries_mirrors.json](file:///Users/melvinalgane/Desktop/Entrepreneuriat/searcSomeOpendata/1xbet_countries_mirrors.json)

**Test de connectivité** : `GET {mirror}/service-api/LineFeed/GetSportsShortZip?lng=en` → 200 = miroir actif.

---

## 2. Headers HTTP

### Headers Standard (Live/Line/EventsStat)
```python
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sa.1xbet.com/fr/line",
}
```

### Headers Results API (obligatoires pour v2/champs)
```python
RESULTS_HEADERS = {
    **HEADERS,
    "x-app-n":          "__RESULTS_FRONTEND__",
    "x-requested-with": "XMLHttpRequest",
    "x-svc-source":     "__RESULTS_FRONTEND__",
    "Origin":           "https://sa.1xbet.com",
    "Referer":          "https://sa.1xbet.com/fr/results",
    # ⚠️ PAS de cookie SESSION — invalide et cause des erreurs
}
```

---

## 3. Endpoints 1xBet

### 3.1 Matchs en Direct

```
GET {mirror}/service-api/LiveFeed/Get1x2_VZip
    ?sports={sportId}
    &count=100
    &lng=fr          # ou 'en' en fallback
    &mode=4
    &country=158
    &getEmpty=true
```

**Retourne** : `{ "Value": [ {...match...}, ... ] }`

**Clés importantes** :
| Clé | Description |
|-----|-------------|
| `I` | ID numérique du match |
| `O1` / `O2` | Nom équipe/joueur 1 et 2 |
| `O1I` / `O2I` | IDs des équipes/joueurs |
| `S` | Timestamp de début (Unix) |
| `SC` | Score live (avec `S1`, `S2`, `FS`, `ST`) |
| `L` | Nom du championnat |
| `CN` | Pays du championnat |
| `SGI` | Hex ID du match (EventsStat) |
| `STI` | Hex ID de la saison (EventsStat) |
| `E` | Cotes disponibles |
| `WP` | Win Probability |
| `MIS` | Métadonnées (tour, surface, etc.) |

---

### 3.2 Matchs à Venir (Calendrier)

```
GET {mirror}/service-api/LineFeed/Get1x2_VZip
    ?sports={sportId}
    &count=100
    &lng=fr
    &mode=4
    &country=158
    &getEmpty=true
```

**Retourne** : même structure que LiveFeed. Sans filtre date, retourne les prochains 24-48h.

> [!NOTE]
> Le paramètre `tsFrom`/`tsTo` renvoie HTTP 406 sur les versions récentes du CDN.
> Pour le calendrier étendu (ex: Rugby → 1 septembre 2026), faire une requête sans filtre date.

**Portée calendrier observée par sport** :
| Sport (ID) | Portée avant |
|------------|-------------|
| Football (1) | 24-48h |
| Tennis (4) | 24-48h |
| Rugby (40) | ~2 mois (Septembre 2026) |
| Golf (109) | 0 événements via LineFeed |

---

### 3.3 Résultats Passés

**Étape 1 — Championnats disponibles ce jour-là :**
```
GET {mirror}/service-api/result/web/api/v2/champs
    ?dateFrom={ts_from}
    &dateTo={ts_to}
    &lng=fr
    &ref=1
    &sportIds={sportId}
```

**Calcul timestamps (règle validée)** :
```python
import calendar, datetime

def results_timestamps(date_str):
    # date_str format: 'YYYY-MM-DD'
    y, m, d = map(int, date_str.split("-"))
    ts_midnight = int(calendar.timegm((y, m, d, 0, 0, 0)))
    ts_from = ts_midnight - 3 * 3600   # 21h UTC de la veille
    ts_to   = ts_from + 86400          # 21h UTC du jour cible
    return ts_from, ts_to
```

> [!WARNING]
> **Fenêtre max rétrospective : ~18 mois**
> Tests validés : 2025-01-01 ✅ (39 champs tennis), 2024-01-01 ❌ (HTTP 400)
> Ne pas inclure de cookie SESSION (invalide, retourne body vide).

**Étape 2 — Matchs d'un championnat :**
```
GET {mirror}/service-api/result/web/api/v3/games
    ?champId={champId}
    &dateFrom={ts_from}
    &dateTo={ts_to}
    &lng=fr
    &ref=1
```

**Retourne** : `{ "items": [ {"id", "opp1", "opp2", "score", "dateStart", "subGame", ...} ] }`

---

## 4. Endpoints EventsStat

Base URL : `https://eventsstat.com`

### 4.1 Classement Actuel (Rankings)

```
GET /en/services-api/SiteService/RatingDetailedNewBySelectors
    ?tournId={tournId}     # ID hexadécimal du tournoi
    &recLimit=l.100        # Nombre de joueurs (max ~200)
    &ln=fr                 # Langue
    &partner=0             # OBLIGATOIRE pour avoir les noms (TM)
    &geo=1
```

**Tournois connus** :
| Tournoi | tournId |
|---------|---------|
| ATP Classement | `5b19067ef87e5825813fb409` |
| WTA Classement | `5b19057ef87e5825813dc074` |

> [!CAUTION]
> **Le paramètre `ratingDate=YYYY.MM.DD` est ignoré côté serveur.**
> La réponse est identique (même taille 105750b) pour toutes les dates testées (2016 → 2026).
> Les rankings historiques nécessitent une session authentifiée via le frontend 1xBet — non accessible en accès direct.

**Structure de réponse** :
```json
{
  "T": {
    "TM": [   // Liste des métadonnées joueurs (TM EST UNE LISTE, pas un dict)
      { "I": "5af857ed...", "T": "Jannik Sinner", "S": [{"T": "Italie"}], "IM": "/sfiles/..." }
    ],
    "R": [    // Tableau de tableaux de lignes
      [
        { "C": [
            { "V": ["1"], "I": 1 },        // cols[0] = rank
            { "C": "5af857ed...", "I": 2 }, // cols[1] = playerId
            { "V": ["24"], "I": 3 },        // cols[2] = âge
            { "V": ["13450"], "I": 4 }      // cols[3] = points
        ], "I": 1 }
      ]
    ]
  }
}
```

---

### 4.2 Profil Joueur (PlayerDetailed)

```
GET /en/services-api/SiteService/PlayerDetailed
    ?playerId={hexId}
    &ln=fr
    &partner=0
    &geo=1
```

**Champs de réponse validés** :
| Clé | Type | Contenu | Portée |
|-----|------|---------|--------|
| `F` | liste | Prochains matchs (1-3) | Futur |
| `G` | liste | 10 derniers matchs avec score | ~2 mois |
| `PS` | objet | Stats (1er serve, break points…) | Saison actuelle |
| `TS` | objet | Calendrier tournois + rounds atteints + prize money | Saison actuelle |
| `PB` | objet | Biographie (anecdotes, main, nationalité…) | Permanent |
| `A` | int | Âge | - |
| `B` | int | Timestamp de naissance | - |
| `PM` | str | Main (ex: "Right-Handed") | - |
| `HM` | int | Taille (cm) | - |

**Structure d'un match dans `G` ou `F`** :
```json
{
  "I":   "6a4d7b33...",      // ID EventsStat du match
  "D":   1783686600,          // Timestamp Unix
  "A":   { "I": "...", "T": "Novak Djokovic" },   // Joueur A
  "H":   { "I": "...", "T": "Jannik Sinner" },     // Joueur H
  "S1":  1, "S2": 3,          // Score (sets gagnés)
  "W":   2,                   // Gagnant (1=A, 2=H)
  "P":   [{"S1":3,"S2":6}],  // Détail des sets (quand disponible)
  "S":   { "N": "Wimbledon", "I": "...", "T": 1 }, // Tournoi
  "SSt": 1                    // Statut (1=terminé, 2=en cours)
}
```

---

### 4.3 Endpoints Non Disponibles

| Endpoint | Code | Note |
|----------|------|------|
| `PlayerMatches`, `PlayerHistory`, `PlayerResults` | 404 | Inexistants |
| `TournResults`, `TournHistory`, `TournMatches` | 404 | Inexistants |
| `H2H`, `MatchInfo`, `GameList`, `MatchStats` | 404 | Inexistants |
| `HeadToHead` | 200 | Retourne toujours `{}` (vide) |
| `RatingDetailedNew` | 500 | Erreur serveur |
| Pages `/results?year=YYYY` | 200 | CSR Nuxt (pas de SSR), pas de données en HTML |
| `window.__NUXT__` IIFE | - | Encodage JS IIFE non parsable en Python |

---

## 5. Limites Connues & Findings

> [!IMPORTANT]
> **Tableau de bord des limitations confirmées**

| Besoin | Disponibilité | Solution |
|--------|--------------|----------|
| Rankings historiques (>18 mois) | ❌ Pas d'accès direct | Frontend 1xBet avec session auth |
| Matchs passés (>18 mois) | ❌ HTTP 400 | Aucune alternative publique trouvée |
| Matchs passés (6-18 mois) | ✅ Results API | `v2/champs` + `v3/games` |
| Matchs passés (hier) | ✅ 104-130 champs | `v2/champs` + `v3/games` |
| Calendrier futur (tennis, foot) | ✅ 24-48h | `LineFeed/Get1x2_VZip` |
| Calendrier futur (rugby) | ✅ ~2 mois | `LineFeed/Get1x2_VZip` |
| Calendrier futur (golf) | ❌ 0 events | Golf hors saison / API différente |
| Rankings actuels | ✅ Top 100 | `RatingDetailedNewBySelectors?partner=0` |
| Historique récent joueur | ✅ 10 derniers matchs | `PlayerDetailed.G` |
| Prochains matchs joueur | ✅ 1-3 matchs | `PlayerDetailed.F` |
| Stats joueur (service, BP…) | ✅ | `PlayerDetailed.PS` |
| Calendrier tournois joueur | ✅ | `PlayerDetailed.TS` |
| Score live détaillé (sets) | ✅ | `LiveFeed.SC.FS` |
| Stats live (possession, etc.) | ✅ | `LiveFeed.SC.ST` |

---

## 6. Modèles JSON Normalisés

Notre parser [scrape_all.py](file:///Users/melvinalgane/Desktop/Entrepreneuriat/searcSomeOpendata/scrape_all.py) normalise sous 3 schémas :

### DuelPayload (Tennis, Football, Basketball, Rugby…)
```json
{
  "id": 123456,
  "sportId": 4,
  "sportName": "Tennis",
  "tournamentName": "Wimbledon",
  "startTime": 1752134400,
  "title": "Sinner vs Djokovic",
  "status": "live",
  "opponents": [
    { "name": "Jannik Sinner", "id": "5af857ed..." },
    { "name": "Novak Djokovic", "id": "5ab2f3a0..." }
  ],
  "score": {
    "global": "2:1",
    "periods": [
      { "period": 1, "label": "1er Set", "score": {"S1": 6, "S2": 4} },
      { "period": 2, "label": "2ème Set", "score": {"S1": 3, "S2": 6} }
    ]
  },
  "live_statistics": [
    { "metric": "Aces", "opp1": 4, "opp2": 2 }
  ]
}
```

### RacePayload (Cyclisme, F1…)
```json
{
  "sportId": 66,
  "raceName": "Tour de France — Étape 5",
  "participants": [
    { "position": 1, "name": "Tadej Pogacar", "teamName": "UAE Emirates", "gap": "+0:00" }
  ]
}
```

### LeaderboardPayload (Golf…)
```json
{
  "sportId": 109,
  "eventName": "The Masters",
  "leaderboard": [
    { "position": 1, "name": "Scottie Scheffler", "scoreToPar": -12, "rounds": [68, 65, 70, 69] }
  ]
}
```

---

## 7. Statistiques Avancées & Données Unifiées (EventsStat HTML SSR)

Le nouveau endpoint **`/api/match/stats`** rassemble et normalise l'ensemble des données extraites du SSR d'EventsStat (via le parseur du `window.__NUXT__` injecté dans la page).

### Endpoint
```
GET https://sports-api-hazel.vercel.app/api/match/stats
    ?sgi={eventsstatMatchId}
    &sport={sportSlug}
```
* **sgi** : ID hex EventsStat du match (ex: `6a3518ab5e99bd05c63ea2df`)
* **sport** : nom du sport en minuscule (ex: `football`, `tennis`, `basketball`)

### 7.1 Confrontations Directes (H2H)
Extrait de l'onglet ID `3` :
* `gameIds` : IDs des confrontations passées entre ces deux entités.
* `meetsInfo` : Compteur de victoires/défaites/nuls.

### 7.2 Compositions d'Équipe (Lineups)
Extrait de l'onglet ID `8` :
* `formation` : Le schéma tactique (ex : `"4-3-3"`).
* `players` : Tableau de joueurs avec `name`, `number`, `role` (ex: `"Goalkeeper"`), `country` et statut `substitute` (booléen).

### 7.3 Commentaires & Actions en Direct
* **Match highlights** (onglet ID `13`) : Contient les actions majeures (`eventGroups` : buts, cartons, changements) avec leur minute exacte.
* **LIVE Text Commentary** (onglet ID `12`) : Contient les commentaires textuels en direct (`textBroadcasts`) avec l'importance de l'action (`isImportant`).

### 7.4 Données Terrain (Venue / Court)
Extrait de l'onglet ID `26` :
* `title` : Nom du stade ou court (ex: `"Mezőkövesdi Városi"`).
* `details` : Dictionnaire dynamique contenant la capacité, la surface de jeu, l'adresse, la date d'ouverture, etc.

