import urllib.request
import json
import urllib.parse

ATP_TOURN_ID = '5b19067ef87e5825813fb409'
BASE_URL = 'https://eventsstat.com/en/services-api/SiteService/RatingDetailedNewBySelectors'

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*"
}

def test_param(params):
    url = f"{BASE_URL}?tournId={ATP_TOURN_ID}&recLimit=l.100&ln=en&partner=1&geo=158&" + urllib.parse.urlencode(params)
    print(f"Testing URL: {url}")
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8', errors='ignore'))
            print("  Status: Success")
            # Print the rating date if returned in meta
            if data and data.get("T", {}).get("D"):
                print("  Dates in response:", data["T"]["D"])
            # Let's print first player rank and name
            if data and data.get("T", {}).get("R") and data["T"]["R"][0]:
                row = data["T"]["R"][0][0]
                print("  Sample Row:", row)
                # Print TM keys or D
                print("  TM keys:", list(data["T"].get("TM", {}).keys())[:3])
            else:
                print("  No rows returned.")
    except Exception as e:
        print(f"  Error: {str(e)}")

print("--- 1. Testing without date param ---")
test_param({})

print("\n--- 2. Testing with date=2021.08.09 ---")
test_param({"date": "2021.08.09"})

print("\n--- 3. Testing with ratingDate=2021.08.09 ---")
test_param({"ratingDate": "2021.08.09"})

print("\n--- 4. Testing with date=2021-08-09 ---")
test_param({"date": "2021-08-09"})

print("\n--- 5. Testing with ratingDate=2021-08-09 ---")
test_param({"ratingDate": "2021-08-09"})
