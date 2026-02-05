import requests
import json
from tabulate import tabulate

def load_headers():
    try:
        with open('headers.json', 'r') as f:
            print("Loading headers from headers.json...")
            return json.load(f)
    except FileNotFoundError:
        print("No headers.json found. Using default User-Agent.")
        print("TIP: Rename headers.json.template to headers.json and paste your browser cookies to bypass 403 errors.")
        return {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

def test_endpoint(name, url, params=None, custom_headers=None):
    print(f"Testing {name}...")
    
    # Merge custom headers with defaults if provided
    request_headers = custom_headers if custom_headers else {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, params=params, headers=request_headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("SUCCESS: JSON Data received.")
                
                # Analyze structure
                if isinstance(data, dict):
                    keys = list(data.keys())[:5]
                    print(f"Top-level keys: {keys}")
                    
                    # Try to find a list of events to show sample data
                    val_sample = None
                    if "Value" in data: # 1xBet often uses 'Value'
                        val_sample = data["Value"]
                    elif "events" in data:
                        val_sample = data["events"]
                    
                    if isinstance(val_sample, list) and len(val_sample) > 0:
                        event = val_sample[0]
                        print("\n--- SAMPLE EVENT DATA (First Item) ---")
                        # Print first 5 logical keys to show user what's there
                        readable_keys = [k for k in event.keys() if isinstance(event[k], (str, int, float, bool))]
                        for k in readable_keys[:5]:
                            print(f"{k}: {event[k]}")
                        print("...")
                elif isinstance(data, list):
                    print("Root is a list.")
                    if len(data) > 0:
                        print(f"Sample item keys: {list(data[0].keys())[:5]}")
                
                return True
            except json.JSONDecodeError:
                print("Response is not JSON.")
                print(f"Snippet: {response.text[:100]}")
        else:
            print(f"Failed. Reason: {response.reason}")
            if response.status_code == 403:
                print("HINT: Try updating 'Cookie' in headers.json")
    except Exception as e:
        print(f"Error: {e}")
    
    print("-" * 30)
    return False

def main():
    print("=== LIVE CONNECTIVITY CHECK ===\n")
    headers = load_headers()
    
    # 1. 1xBet Test
    # Using specific params often required for 1xBet
    # Sport=1 (Football), Partner=7 usually works for public scrapers
    test_endpoint(
        "1xBet (LiveFeed)", 
        "https://1xbet.com/LiveFeed/Get1x2_VZip", 
        params={"sports": 1, "count": 5, "mode": 4, "partner": 7, "getEmpty": "true"},
        custom_headers=headers
    )

    # 1b. User's Detected Mirror (sa.1xbet.com)
    print("\nTesting User's Mirror (sa.1xbet.com):")
    test_endpoint(
        "1xBet (sa.1xbet.com - /service-api/)", 
        "https://sa.1xbet.com/service-api/LiveFeed/GetSportsShortZip", 
        params={
            "sports": "1",
            "champs": "1715448,2155978",
            "lng": "fr",
            "gr": "1208",
            "country": "158",
            "virtualSports": "true",
            "groupChamps": "true"
        },
        custom_headers=headers
    )
    # 1c. User's Mirror - Full Match Data (Get1x2_VZip)
    print("\nTesting User's Mirror Full Data (Get1x2_VZip):")
    test_endpoint(
        "1xBet (sa.1xbet.com - Get1x2_VZip)", 
        "https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip", 
        params={
            "sports": "1", # Football
            "count": "5",
            "mode": "4",
            "partner": "7",
            "getEmpty": "true",
            "lng": "fr"
        },
        custom_headers=headers
    )
    
    # Alternative 1xBet mirror if main fails
    test_endpoint(
        "1xBet (Mirror: 1xbet.whoscored.com - hypothetical)", 
        "https://1xbet.whoscored.com/LiveFeed/Get1x2_VZip",
        params={"sports": 1, "count": 5, "mode": 4},
        custom_headers=headers
    )

    # 2. Pin-Up Test
    test_endpoint(
        "Pin-Up (Live Events)",
        "https://pin-up.bet/api/v1/events/live",
        params={"limit": 5, "sport_id": 1}, # Guessing params
        custom_headers=headers
    )
    
    # 3. Random 'Open' API for comparison (e.g., generic if others fail)
    # Generic public implementation of 1xbet API often found on other domains
    # Try a known open mirror often used by scrapers: 'https://1xstavka.ru/' or similar? 
    # Let's try the user's specific URL pattern for 1xbet
    print("\nTesting User's Specific 1xBet Pattern:")
    test_endpoint(
        "1xBet (User Pattern)", 
        "https://1xbet.com/LiveFeed/Get1x2", 
        params={"sport": 1, "partner": 123},
        custom_headers=headers
    )

if __name__ == "__main__":
    main()
