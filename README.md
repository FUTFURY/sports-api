# Sports API

A Node.js backend API that fetches sports data from 1xBet, including live games, leagues, standings, and detailed game statistics.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
node api/server.js
```

The API will be available at `http://localhost:3000`

## 📡 API Endpoints

### Sports
- `GET /api/get-sports?dateFrom={timestamp}&dateTo={timestamp}&lng={language}`
  - Get all available sports for a date range

### Leagues
- `GET /api/get-leagues?sportId={id}&dateFrom={timestamp}&dateTo={timestamp}&lng={language}`
  - Get leagues for a specific sport

### Games
- `GET /api/get-games?champId={id}&dateFrom={timestamp}&dateTo={timestamp}&lng={language}`
  - Get games for a specific league

### Live Games
- `GET /api/get-live-games?lng={language}`
  - Get all currently live games

### Game Stats
- `GET /api/get-game-stats?id={gameId}&lng={language}`
  - Get detailed statistics for a specific game

### Search
- `GET /api/search?text={query}&lng={language}`
  - Search for teams, leagues, and games

### Standings
- `GET /api/get-standings?champId={id}&lng={language}`
  - Get league standings/table

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **CORS** - Cross-origin resource sharing
- **zlib** - Data decompression

## 📁 Project Structure

```
.
├── api/                    # API endpoint handlers
│   ├── server.js          # Express server
│   ├── get-sports.js      # Sports endpoint
│   ├── get-leagues.js     # Leagues endpoint
│   ├── get-games.js       # Games endpoint
│   ├── get-live-games.js  # Live games endpoint
│   ├── get-game-stats.js  # Game statistics endpoint
│   ├── search.js          # Search endpoint
│   └── get-standings.js   # Standings endpoint
├── scripts/               # Utility and debug scripts
└── data/                  # Data storage
```

## 🌐 Deployment

This API is designed to be deployed on **Vercel**. The endpoints are compatible with Vercel's serverless functions.

## 📝 Notes

- All timestamps are in Unix format (seconds)
- Language codes: `en`, `fr`, `es`, `de`, `it`, `pt`, `ru`
- The API handles GZIP/DEFLATE decompression automatically
