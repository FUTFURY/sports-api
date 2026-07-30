import urllib.request
import json
import urllib.parse

ATP_TOURN_ID = '5b19067ef87e5825813fb409'
BASE_URL = 'https://eventsstat.com/en/services-api/SiteService/RatingDetailedNewBySelectors'

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*"
}

def fetch_ranking(rating_date=None):
    params = {
        "tournId": ATP_TOURN_ID,
        "recLimit": "l.100",
        "ln": "en",
        "partner": "1",
        "geo": "158"
    }
    if rating_date:
        params["ratingDate"] = rating_date
        
    url = f"{BASE_URL}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8', errors='ignore'))
            
            # Extract player metadata
            meta = data.get("T", {}).get("TM", {})
            meta_list = list(meta.values()) if isinstance(meta, dict) else meta
            
            # Get first 3 players rank and name
            rows = data.get("T", {}).get("R", [])
            players_list = []
            if rows and rows[0]:
                for row in rows[0][:5]:
                    cols = row.get("C", [])
                    rank = cols[0].get("V", [None])[0] if cols and len(cols) > 0 else None
                    p_id = cols[1].get("C") if len(cols) > 1 else None
                    points = cols[3].get("V", [None])[0] if len(cols) > 3 else None
                    
                    # Find player name in metadata
                    p_name = "Unknown"
                    if isinstance(meta, dict):
                        p_data = meta.get(p_id, {})
                        p_name = p_data.get("T", "Unknown")
                    elif isinstance(meta, list):
                        p_data = next((item for item in meta if item.get("I") == p_id), {})
                        p_name = p_data.get("T", "Unknown")
                        
                    players_list.append(f"Rank {rank}: {p_name} ({points} pts)")
            
            # Print result
            date_label = rating_date or "Latest (Default)"
            print(f"\n📅 Date: {date_label}")
            for p in players_list:
                print(f"   {p}")
    except Exception as e:
        print(f"  Error fetching {rating_date}: {str(e)}")

fetch_ranking()
fetch_ranking("2021.08.09")
fetch_ranking("2015.06.01")
fetch_ranking("2012.01.09")
