import requests
import json
import time

def probe_endpoint():
    try:
        with open("headers_results.json", "r") as f:
            headers = json.load(f)
    except:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        }

    now_raw = int(time.time())
    now = now_raw - (now_raw % 300) 
    day = 86400
    date_from = now - day
    date_to = now + day
    
    base = "https://sa.1xbet.com/service-api/result/web/api/v2/sports"
    
    # Try different orders manually
    urls = [
        # 1. Alphabetical
        f"{base}?dateFrom={date_from}&dateTo={date_to}&lng=fr&sportIds=1,2,3,4,40",
        # 2. SportIds first
        f"{base}?sportIds=1,2,3,4,40&dateFrom={date_from}&dateTo={date_to}&lng=fr",
        # 3. Lng last
        f"{base}?dateFrom={date_from}&dateTo={date_to}&sportIds=1,2,3,4,40&lng=fr",
        # 4. Standard 1xBet
        f"{base}?lng=fr&sportIds=1,2,3,4,40&dateFrom={date_from}&dateTo={date_to}"
    ]

    for url in urls:
        print(f"\nTesting URL: {url}")
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("SUCCESS! JSON:")
                try:
                    data = resp.json()
                    # Check if it has names
                    print(json.dumps(data, indent=2)[:500])
                    return
                except:
                    pass
            else:
                print(f"Response: {resp.text[:200]}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    probe_endpoint()
