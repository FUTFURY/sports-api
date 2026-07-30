# Production API Specifications: sports-api-hazel.vercel.app (Multi-Sports)

This document defines the complete production contract of the unified sports API. All endpoints are hosted at `https://sports-api-hazel.vercel.app/api`.

---

## 🗂️ Sommaire
1. [Vercel API Production Endpoints](#1-vercel-api-production-endpoints)
2. [Dynamic Multi-Sport Logic](#2-dynamic-multi-sport-logic)
3. [Unified JSON Schemas](#3-unified-json-schemas)
4. [Under-the-Hood Scraping Technical Details](#4-under-the-hood-scraping-technical-details)

---

## 1. Vercel API Production Endpoints

### 1.1 GET `/sports`
Retrieve all supported sports with active capabilities indicators.
* **Query Parameters**:
  * `active` (boolean, optional): Set to `true` to return only sports with active live/upcoming games or recent results.
  * `cyber` (boolean, optional): Set to `true` to include virtual/cyber sports. Defaults to `false`.

**Response Example (`/sports?active=true`)**:
```json
{
  "success": true,
  "total": 4,
  "data": [
    {
      "sportId": 1,
      "name": "Football",
      "shortName": "Football",
      "command": "Mi-temps",
      "isTeamSport": true,
      "isCyber": false,
      "capabilities": {
        "upcoming": 20,
        "results": {
          "hasYesterday": true,
          "has6months": true,
          "has18months": true
        }
      }
    },
    {
      "sportId": 4,
      "name": "Tennis",
      "shortName": "Tennis",
      "command": "Set",
      "subCommand": "Jeu",
      "isTeamSport": false,
      "isCyber": false,
      "capabilities": {
        "upcoming": 15,
        "results": {
          "hasYesterday": true,
          "has6months": true,
          "has18months": true
        }
      }
    }
  ]
}
```

---

### 1.2 GET `/matches`
Get active live, upcoming, or finished matches for a specific sport.
* **Query Parameters**:
  * `sportId` (integer, optional): The ID of the sport (e.g. `1` for Football, `4` for Tennis, default: `1`).
  * `type` (string, optional): Filter matches: `live`, `upcoming`, `finished`, `both` (live+upcoming, default), or `all` (live+upcoming+finished).
  * `date` (string, optional): Format `YYYY-MM-DD` (defaults to today). Used when `type=finished` or `type=all`.

**Response Example (`/matches?sportId=1&type=both`)**:
```json
{
  "success": true,
  "sportId": 1,
  "type": "both",
  "data": {
    "live": [
      {
        "id": 734988103,
        "title": "FAR Rabat vs Stade Marocain",
        "tournamentId": 89083,
        "tournamentName": "Coupe du Maroc",
        "tournamentCountry": "Maroc",
        "player1": "FAR Rabat",
        "player1Id": 4068,
        "player1Image": "5021c6d778dbfca7a6d72beca77388aa.png",
        "player2": "Stade Marocain",
        "player2Id": 221013,
        "player2Image": "9132e81cb0fd4dd40df648b5b066aca0.png",
        "startTime": 1783537200,
        "score": {
          "gamesPlayer1": 1,
          "gamesPlayer2": 1,
          "sets": {
            "S1": 1,
            "S2": 1
          },
          "currentSetScore": [
            { "Key": 1, "Value": { "S1": 1, "S2": 1, "NF": "1ère mi-temps" } },
            { "Key": 2, "Value": { "NF": "2ème mi-temps" } }
          ]
        },
        "isLive": true,
        "eventsstatMatchId": "6a0055a35e99bd05c622cf03",
        "eventsstatTournamentId": "6a0055a35e99bd05c622cf04",
        "sportSlug": "football"
      }
    ],
    "upcoming": []
  }
}
```

---

### 1.3 GET `/calendar`
Retrieve past match results or extended future schedules for any date.
* **Query Parameters**:
  * `date` (string, required): Format `YYYY-MM-DD` (e.g. `2026-07-04`).
  * `sportId` (integer, required): The ID of the sport.

**Response Example (`/calendar?date=2026-07-04&sportId=41` for Golf)**:
```json
{
  "success": true,
  "date": "2026-07-04",
  "sportId": 41,
  "data": [
    {
      "id": 734003958,
      "tournamentId": 3025794,
      "tournamentName": "John Deere Classic. 2026. Round 3",
      "player1": "Ben Kohles/David Lipsky/Ryo Hisatsune",
      "player1Id": 212113,
      "player1Image": "bcd5bc06569e28551218cbfe26d471ff.png",
      "player2": "",
      "startTime": 1783181580,
      "score": {
        "sets": {
          "S1": { "0": 3, "1": 4, "2": 3, "3": 5, "4": 4, "5": 4 },
          "S2": { "0": 4, "1": 5, "2": 3, "3": 3, "4": 3, "5": 4 }
        },
        "gamesPlayer1": 66,
        "gamesPlayer2": 71
      },
      "champName": "John Deere Classic. 2026. Round 3",
      "champId": 3025794,
      "sportSlug": "golf"
    }
  ],
  "count": 1
}
```

---

### 1.4 GET `/rankings`
Retrieve official player rankings. Currently available for Tennis.
* **Query Parameters**:
  * `type` (string, required): `atp` (Men's Rankings) or `wta` (Women's Rankings).

**Response Example (`/rankings?type=atp`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "5af857ed494765f3ca89be64",
      "name": "Jannik Sinner",
      "rank": "1",
      "points": "13450",
      "country": "Italie",
      "image": "/sfiles/logo_teams/ee1ed71b8f9678d0108fe92e421b47f1.png"
    }
  ]
}
```

---

### 1.5 GET `/match/stats`
Deep matches data unifies H2H, Commentary, lineups, and Venue information.
* **Query Parameters**:
  * `sgi` (string, required): The EventsStat Hex Match ID (e.g. `eventsstatMatchId`).
  * `sport` (string, required): The lowercased `sportSlug` (e.g. `football`, `tennis`, `basketball`).

**Response Example (`/match/stats?sgi=6a0055a35e99bd05c622cf03&sport=football`)**:
```json
{
  "success": true,
  "sgi": "6a0055a35e99bd05c622cf03",
  "sport": "football",
  "data": {
    "h2h": {
      "gameIds": ["6414739694fca712b49abddb"],
      "meetsInfo": [
        { "title": "Confrontations totales", "values": [3, 1, 1], "sum": 5 }
      ]
    },
    "lineups": [
      {
        "formation": "4-3-3",
        "players": [
          { "name": "Ayoub Lakred", "number": 1, "role": "Goalkeeper", "substitute": false }
        ]
      }
    ],
    "commentary": [
      { "time": "45'", "text": "Mi-temps de la rencontre sur ce score nul." }
    ],
    "venue": {
      "title": "Complexe Sportif Prince Moulay Abdellah",
      "details": {
        "Capacité": "52000",
        "Surface": "Pelouse naturelle"
      }
    }
  }
}
```

---

### 1.6 GET `/tournament/:id`
Retrieve tournament draw brackets, rounds, and schedules.
* **Path Parameters**:
  * `id` (string, required): The EventsStat season tournament ID (`eventsstatTournamentId`).
* **Query Parameters**:
  * `sportId` (integer, optional): The ID of the sport. Defaults to `4` (Tennis).

**Response Example (`/tournament/6a0055a35e99bd05c622cf04?sportId=4`)**:
```json
{
  "success": true,
  "sportId": 4,
  "data": {
    "T": {
      "T": "Wimbledon Championships",
      "S": "2026",
      "C": "Royaume-Uni",
      "HM": "Grass"
    },
    "LG": [
      {
        "N": "Final",
        "list": [
          {
            "opp1": { "title": "Jannik Sinner", "id": "5af857ed..." },
            "opp2": { "title": "Carlos Alcaraz", "id": "5abc971d..." },
            "score": "3:2",
            "dateStart": 1783531800
          }
        ]
      }
    ]
  }
}
```

---

### 1.7 GET `/player/:id`
Detailed biographic information, season summaries, recent matches, and next schedules of a player.
* **Path Parameters**:
  * `id` (string, required): The player's ID (`player1Id`, `player2Id`, or ranking ID).

**Response Example (`/player/5abc971d494765f3cab55409`)**:
```json
{
  "name": "Carlos Alcaraz",
  "country": "Espagne",
  "image": "/sfiles/logo_teams/83e864d5d1b3a372eec7c713bf39ccf0.png",
  "handedness": "Right-Handed",
  "height": 183,
  "birthDate": "2003-05-05",
  "age": 23,
  "earnings": [
    { "type": "Singles", "period": "Career", "amount": "31548220" }
  ],
  "recentMatches": [
    {
      "matchId": "69dbd65f5e...",
      "date": "2026-07-01T15:30:00.000Z",
      "tournament": "Wimbledon",
      "playerA": { "id": "5b5f7d01...", "name": "Otto Virtanen" },
      "playerH": { "id": "5abc971d...", "name": "Carlos Alcaraz" },
      "scoreA": 0,
      "scoreH": 2,
      "winner": 2,
      "status": 1
    }
  ],
  "upcomingMatches": [],
  "seasonStats": {
    "Aces": 142,
    "Double Faults": 58
  }
}
```

---

### 1.8 GET `/tournaments`
Active live and upcoming tournaments directory.
* **Query Parameters**:
  * `sportId` (integer, required): The ID of the sport.

**Response Example (`/tournaments?sportId=4`)**:
```json
{
  "success": true,
  "sportId": 4,
  "data": [
    {
      "id": 89083,
      "name": "Wimbledon Men Singles"
    }
  ],
  "count": 1
}
```

---

## 2. Dynamic Multi-Sport Logic

To build a frontend that works seamlessly for **all 300+ sports**, use the following unified properties returned inside each match object of the `/api/matches` and `/api/calendar` responses:

1. **`sportSlug`**: The English string key representing the sport (e.g. `football`, `tennis`, `basketball`, `ice-hockey`, `golf`, `rugby`, `handball`, `table-tennis`). 
   * **Rule**: Directly forward `match.sportSlug` to the `sport` parameter of the `/api/match/stats` endpoint. Avoid hardcoding ID-to-slug mappings in the frontend.
2. **`eventsstatMatchId`**: Hexadecimal match ID for EventsStat. If present, deep stats `/api/match/stats` are available for this match.
3. **`eventsstatTournamentId`**: Hexadecimal tournament season ID for EventsStat. If present, draw brackets `/api/tournament/:id` are available for this tournament.

---

## 3. Unified Score Structures

Scores formats are normalized per sport inside `score.periods` (for live matches) or `sets` (for past matches):

* **Football (sportId 1)**: Divided into halves. Periods labeled `"1ère mi-temps"` (1st Half), `"2ème mi-temps"` (2nd Half).
* **Basketball (sportId 3)**: Divided into quarters. Periods labeled `"1er Quart-temps"`, `"2ème Quart-temps"`, etc.
* **Ice Hockey (sportId 2)**: Divided into periods. Periods labeled `"1ère Période"`, `"2ème Période"`, etc.
* **Tennis (sportId 4)**: Divided into sets. Periods labeled `"1er Set"`, `"2ème Set"`, etc.

---

## 4. Under-the-Hood Scraping Technical Details

The backend resolver uses rotating mirrors and Cloudflare-bypass got requests (`got-scraping`).
* Mirror endpoints ping: `GET {mirror}/service-api/LineFeed/GetSportsShortZip?lng=en`.
* Cache fallback: If Redis `REDIS_URL` is configured, it caches variables. Otherwise, falls back to memory-cache (`node-cache`). Memory-cache results (e.g. past matches, ranking results) are cached for 24h.
