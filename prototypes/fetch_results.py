import requests
from bs4 import BeautifulSoup
import json
import os

def fetch_results_list():
    url = "https://sa.1xbet.com/service-api/result/web/api/v2/champs?dateFrom=1770162300&dateTo=1770248700&lng=fr&ref=1&sportIds=1,2,3"
    
    try:
        with open("headers_results.json", "r") as f:
            headers = json.load(f)
    except FileNotFoundError:
        print("headers_results.json missing")
        return

    print(f"Fetching Results List: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"SUCCESS with {url}")
            try:
                data = response.json()
                filename = "results_list.json"
                with open(filename, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=4)
                print(f"Saved JSON to {filename}")
                
                # Analyze keys if possible
                if isinstance(data, list):
                     print(f"Got list of {len(data)} items.")
                     if len(data) > 0:
                         print("Sample item:", data[0])
                elif isinstance(data, dict):
                     print("Keys:", list(data.keys()))
                
                return
            except Exception as e:
                print(f"JSON Parse Error: {e}")
                if len(response.text) < 1000:
                    print(response.text)
        else:
            print(f"Failed Status: {response.status_code}")
            print(f"Reason: {response.reason}")
    except Exception as e:
        print(f"Error: {e}") 

def fetch_games_for_champ(champ_id):
    # Confirmed endpoint
    url = "https://sa.1xbet.com/service-api/result/web/api/v3/games"
    
    params = {
        "champId": champ_id,
        "dateFrom": "1770211200", # As per user request log
        "dateTo": "1770297600",
        "lng": "fr",
        "ref": "1"
    }
    
    try:
        with open("headers_results.json", "r") as f:
            headers = json.load(f)
    except:
        return

    print(f"Fetching Games for Champ {champ_id}: {url}")
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            filename = f"games_{champ_id}.json"
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            print(f"Saved Games to {filename}")
            
            # Show game info
            if isinstance(data, dict) and "items" in data:
                items = data["items"]
                print(f"\n--- Found {len(items)} Games ---")
                for item in items:
                    print(f"ID: {item.get('id')} | {item.get('opp1')} vs {item.get('opp2')} | Score: {item.get('score')}")
                    # Check if detailed stats are already here
                    if "subGame" in item:
                        print(f"   -> Contains {len(item['subGame'])} stats (Corners, Cards...).")
        else:
            print(f"Failed. Reason: {response.reason}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # fetch_results_list() # Already done
    # Test with England League Cup (ID 119237) from previous step
    fetch_games_for_champ(119237)
