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
            if response.status_code in [200, 203]:
                try:
                    data = response.json()
                    print("SUCCESS! JSON Found.")
                    filename = "sports_list.json"
                    with open(filename, "w") as f:
                        json.dump(data, f, indent=4)
                    
                    if isinstance(data, dict) and "Value" in data:
                         print(f"Found {len(data['Value'])} sports (Value key). Sample: {data['Value'][0]}")
                    
                    return
                except:
                    print("Status 203/200 but not JSON.")
                    print(response.text[:500])
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fetch_sports()
