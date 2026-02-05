# 🏆 Sports Data API (Serverless)

A professional, serverless proxy API to aggregate sports data (Leagues, Matches, Statistics) for mobile applications. Built with Node.js and designed for Vercel deployment.

## 🚀 Features

*   **Serverless Architecture:** Runs on Vercel Functions (Zero maintenance).
*   **Anti-Bot Bypass:** Uses secure headers and cookie injection via Environment Variables.
*   **Normalized Data:** Returns clean, mobile-friendly JSON (removes the complexity of the source provider).
*   **CDN Caching:** Automatic caching headers to optimize performance and reduce load.

## 📡 API Endpoints

Base URL: `https://your-project.vercel.app`

### 1. Get All Sports
List available sports with their official icons.
*   **URL:** `/api/get-sports`
*   **Method:** `GET`
*   **Response:**
    ```json
    [
      { "id": 1, "name": "Football", "icon": "https://.../1.svg", "count": 120 }
    ]
    ```

### 2. Get Leagues (Championships)
List active leagues for a specific sport.
*   **URL:** `/api/get-leagues?sportId=1`
*   **Method:** `GET`
*   **Response:**
    ```json
    [
      { "id": 119237, "name": "Angleterre. Coupe de la Ligue", "count": 2 }
    ]
    ```

### 3. Get Matches (Games)
List matches, scores, and detailed stats for a league.
*   **URL:** `/api/get-games?champId=119237`
*   **Method:** `GET`
*   **Response:**
    ```json
    [
      {
        "id": 692925967,
        "teams": { "home": "Man City", "away": "Newcastle" },
        "score": "3:1",
        "stats": [{ "label": "Corners", "value": "5:4" }]
      }
    ]
    ```

## 🛠 Setup & Deployment

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Local Development:**
    ```bash
    vercel dev
    ```

3.  **Production Deployment:**
    *   Push to GitHub.
    *   Import project in Vercel.
    *   **CRITICAL:** Add the following Environment Variable in Vercel Settings:
        *   `ONEXBET_COOKIE`: (Paste the cookie string captured by the bot)
        *   `ONEXBET_X_HD`: (The secure key)

## 🤖 Automation (Cookie Refresher)

A script is included to automatically retrieve new session cookies if the API is blocked.
*   Run: `node scripts/refresh_cookies.js`
*   It launches a headless browser, passes the challenge, and saves specific cookies.

---
*Powered by Vercel Serverless Functions.*
