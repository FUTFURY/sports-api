import urllib.request
import json

ATP_TOURN_ID = '5b19067ef87e5825813fb409'
URL = 'https://eventsstat.com/en/services-api/SiteService/RatingDetailedNewBySelectors?tournId=5b19067ef87e5825813fb409&recLimit=l.100&ln=en&partner=1&geo=158'

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*"
}

req = urllib.request.Request(URL, headers=HEADERS)
try:
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode('utf-8', errors='ignore'))
        print("Top-level keys:", list(data.keys()))
        if "T" in data:
            print("T keys:", list(data["T"].keys()))
            for k in ['S', 'Y', 'D']:
                if k in data["T"]:
                    print(f"\n--- Key T['{k}'] ---")
                    print(json.dumps(data["T"][k], indent=2)[:500])
        if "select" in str(data).lower():
            print("Found 'select' in data!")
except Exception as e:
    print("Error:", str(e))
