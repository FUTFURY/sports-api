import requests
import json
import os

def fetch_sports():
    # Attempt to guess the Sports endpoint based on v2/champs pattern
    urls = [
        "https://sa.1xbet.com/service-api/result/web/api/v2/sports?lng=fr",
        "https://sa.1xbet.com/service-api/result/web/api/v1/sports?lng=fr",
        "https://sa.1xbet.com/LineFeed/GetSportsShortZip?lng=fr&tf=2200000&tz=3", # Standard one
    ]
    
    try:
        with open("prototypes/headers_results.json", "r") as f:
            headers = json.load(f)
    except:
        print("No headers found at prototypes/headers_results.json")
        return

    for url in urls:
        print(f"Testing: {url}")
        try:
            response = requests.get(url, headers=headers, timeout=5)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("SUCCESS!")
                filename = "sports_list.json"
                with open(filename, "w") as f:
                    json.dump(data, f, indent=4)
                
                # Print sample
                if isinstance(data, list): # Standard API returns list
                     print(f"Found {len(data)} sports (List). Sample: {data[0]}")
                elif isinstance(data, dict) and "items" in data: # v2 usually returns dict
                     print(f"Found {len(data['items'])} sports (Dict). Sample: {data['items'][0]}")
                
                return
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fetch_sports()
