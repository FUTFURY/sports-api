import requests
import json
import os
import time

# --- CONFIGURATION ---
DATES = {
    "dateFrom": "1770211200", # Example Date (From User)
    "dateTo": "1770297600"
}
HEADERS_FILE = "headers_results.json" 

def load_headers():
    try:
        with open(HEADERS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {HEADERS_FILE} not found.")
        return None

def fetch_leagues(headers):
    """Step 1: Get all championships."""
    url = "https://sa.1xbet.com/service-api/result/web/api/v2/champs"
    params = {
        "dateFrom": DATES["dateFrom"],
        "dateTo": DATES["dateTo"],
        "lng": "fr",
        "ref": "1",
        "sportIds": "1" # Football only
    }
    
    print("--- 1. Fetching Leagues ---")
    try:
        response = requests.get(url, params=params, headers=headers, timeout=15)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            print(f"Found {len(items)} leagues.")
            return items
        else:
            print(f"Failed to fetch leagues. Status: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching leagues: {e}")
        return []

def fetch_games_for_league(league_id, headers):
    """Step 2: Get games for a specific league."""
    url = "https://sa.1xbet.com/service-api/result/web/api/v3/games"
    params = {
        "champId": league_id,
        "dateFrom": DATES["dateFrom"],
        "dateTo": DATES["dateTo"],
        "lng": "fr",
        "ref": "1"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("items", [])
        else:
            print(f"Failed to fetch games for League {league_id}. Status: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching games for League {league_id}: {e}")
        return []

def main():
    headers = load_headers()
    if not headers:
        return

    # 1. Get Leagues
    leagues = fetch_leagues(headers)
    
    # 2. Iterate and Get Games
    all_data = []
    
    # Limit to first 5 leagues for demo purposes to avoid ban
    for league in leagues[:5]: 
        print(f"Processing League: {league.get('name')} (ID: {league.get('id')})")
        
        games = fetch_games_for_league(league.get("id"), headers)
        print(f"   -> Found {len(games)} games.")
        
        league_data = {
            "league_name": league.get("name"),
            "league_id": league.get("id"),
            "games": games
        }
        all_data.append(league_data)
        
        # Polite delay
        time.sleep(1)

    # 3. Save Master JSON
    with open("master_results.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=4, ensure_ascii=False)
    
    print("\n✅ DONE! Saved 'master_results.json'.")

if __name__ == "__main__":
    main()
