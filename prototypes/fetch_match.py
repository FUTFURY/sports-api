import requests
import json
import sys

# Load headers
def load_headers():
    try:
        with open('headers.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: headers.json not found.")
        sys.exit(1)

def fetch_match(match_id):
    print(f"=== FETCHING MATCH {match_id} ===\n")
    headers = load_headers()
    
    # The user provided a URL for 'Line' (Pre-match), so we use LineFeed
    # Common 1xBet endpoint for single game is GetGameZip
    
    # 1. Try generic ID endpoint on sa.1xbet.com
    url = "https://sa.1xbet.com/service-api/LineFeed/GetGameZip"
    params = {
        "id": match_id,
        "lng": "fr",
        "isSubGames": "true",
        "groupChamps": "true",
        "gr": "1208" # From user's previous log
    }
    
    print(f"Requesting: {url}")
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "Value" in data:
                game = data["Value"]
                print("\nSUCCESS! Match Found:")
                print(f"Teams: {game.get('O1')} vs {game.get('O2')}")
                print(f"League: {game.get('L')}")
                print(f"Sport: {game.get('SE')} (ID: {game.get('SI')})")
                print(f"Start Time: {game.get('S')}")
                
                # Check for odds (Ge = Game Events / Odds)
                # Structure varies, sometimes 'GE' or 'E' list
                if "GE" in game:
                    print(f"\nOdds/Events available: {len(game['GE'])} items found.")
                elif "E" in game:
                    print(f"\nOdds available: {len(game['E'])} items found.")

                # Inspect for Stadium/Arena Info
                # 'AI' often stands for Arena Info or similar?
                if "AI" in game:
                    print(f"\nStadium/Arena Info (AI): {game['AI']}")
                
                # Check for other potential keys
                print("\n--- ALL KEYS IN GAME OBJECT ---")
                print(list(game.keys()))
                
                # Check for sub-games or stats
                if "SG" in game:
                     print(f"SubGames (SG) found: {len(game['SG'])}")

                # Save raw JSON to inspect manually
                with open("match_debug.json", "w") as f:
                    json.dump(game, f, indent=4)
                print("\nSaved full match JSON to 'match_debug.json' for inspection.")
            else:
                print("Response JSON valid but 'Value' key missing or empty.")
                print(f"Keys: {data.keys()}")
        else:
            print(f"Failed. Reason: {response.reason}")
            print(response.text[:200])
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Match ID from user URL: 301704678
    fetch_match(301704678)
