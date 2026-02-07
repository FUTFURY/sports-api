import requests
import json

def probe_search():
    base_urls = [
        "https://sa.1xbet.com/LineFeed/GetAutoComplete",
        "https://sa.1xbet.com/LineFeed/GetSearchZip",
        "https://sa.1xbet.com/LineFeed/SearchZip",
        "https://sa.1xbet.com/LineFeed/Search",
    ]
    
    # Common params seen in other LineFeed calls
    params = {
        "text": "psg",
        "lng": "fr",
        "country": 1
    }

    try:
        # Load headers if available, else standard user agent
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        }
        
    except:
        pass

    for url in base_urls:
        print(f"Testing {url}...")
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=5)
            print(f"Status: {resp.status_code}")
            
            # Print body even if 203
            if resp.status_code in [200, 203, 204]:
                try:
                    data = resp.json()
                    print("SUCCESS! JSON Found.")
                    print(json.dumps(data, indent=2)[:500])
                    
                    if isinstance(data, list) and len(data) > 0:
                         print("It is a LIST. This looks promising for AutoComplete.")
                    
                    return
                except:
                    print(f"Status {resp.status_code} but not JSON or empty.")
                    # Show a bit of text if not json
                    print(resp.text[:200])
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    probe_search()
