import urllib.request
import json
import re
import os

MIRROR = "https://sa.1xbet.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9"
}

SPORTS_TO_TEST = {
    1: "Football",
    3: "Basketball",
    4: "Tennis",
    10: "Table Tennis (Ping-pong)",
    26: "Formula 1",
    36: "Bicycle Racing",
    41: "Golf"
}

def clean_html(text):
    return re.sub(r'<[^>]+>', '', text)

def make_request(url, is_json=True):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read()
            # Handle encoding
            charset = response.headers.get_content_charset() or 'utf-8'
            decoded = content.decode(charset, errors='ignore')
            if is_json:
                return json.loads(decoded)
            return decoded
    except Exception as e:
        print(f"  ⚠️ Error requesting {url}: {str(e)}")
        return None

def explore_sports():
    report = {}

    print("=== STARTING 1XBET SPORT DATA EXPLORATION ===\n")

    for sport_id, sport_name in SPORTS_TO_TEST.items():
        print(f"\n--- Exploring {sport_name} (ID: {sport_id}) ---")
        report[sport_name] = {"sport_id": sport_id}
        
        # 1. Fetch from LineFeed (Pre-match)
        url = f"{MIRROR}/service-api/LineFeed/Get1x2_VZip?sports={sport_id}&count=5&lng=en&mode=4&country=158&getEmpty=true"
        try:
            data = make_request(url)
            if not data:
                print(f"❌ Failed to fetch LineFeed.")
                continue
            
            events = data.get("Value", [])
            print(f"Found {len(events)} events in LineFeed.")
            report[sport_name]["events_count"] = len(events)
            
            if not events:
                # Try LiveFeed if LineFeed is empty
                live_url = f"{MIRROR}/service-api/LiveFeed/Get1x2_VZip?sports={sport_id}&count=5&lng=en&mode=4&country=158&getEmpty=true"
                live_data = make_request(live_url)
                if live_data:
                    events = live_data.get("Value", [])
                    print(f"Found {len(events)} events in LiveFeed instead.")
                    report[sport_name]["events_count_live"] = len(events)
            
            if events:
                sample_event = events[0]
                game_id = sample_event.get("I")
                sgi = sample_event.get("SGI")
                sti = sample_event.get("STI")
                
                print(f"Sample Event: [ID: {game_id}] {sample_event.get('O1')} vs {sample_event.get('O2') or 'N/A'}")
                print(f"SGI: {sgi} | STI: {sti}")
                
                report[sport_name]["sample_event"] = {
                    "id": game_id,
                    "title": f"{sample_event.get('O1')} vs {sample_event.get('O2') or 'N/A'}",
                    "sgi": sgi,
                    "sti": sti,
                    "keys": list(sample_event.keys()),
                    "score_keys": list(sample_event.get("SC", {}).keys()) if sample_event.get("SC") else []
                }
                
                # Fetch full Game Detail Zip
                game_zip_url = f"{MIRROR}/service-api/LineFeed/GetGameZip?id={game_id}&lng=en&mode=4&country=158"
                gz_data = make_request(game_zip_url)
                if gz_data and gz_data.get("Value"):
                    val = gz_data.get("Value")
                    # Handle if Value is a list (like in live games sometimes)
                    gz_val = val[0] if isinstance(val, list) else val
                    print(f"Game Detail Zip Keys: {list(gz_val.keys())[:10]}...")
                    report[sport_name]["game_detail_keys"] = list(gz_val.keys())
                    # Dump sample details
                    report[sport_name]["game_detail_sample"] = {
                        "MIS": gz_val.get("MIS"),
                        "SG": list(gz_val.get("SG", [])) if gz_val.get("SG") else None
                    }
                
                # If SGI exists, query EventsStat popup
                if sgi:
                    # Slug based on sport name
                    sport_slug = sport_name.lower().replace(" (ping-pong)", "").replace(" ", "-")
                    es_url = f"https://eventsstat.com/en/statisticpopup/game/{sport_slug}/{sgi}/main"
                    print(f"Querying EventsStat: {es_url}")
                    es_html = make_request(es_url, is_json=False)
                    
                    if es_html:
                        print(f"EventsStat Page loaded! Length: {len(es_html)}")
                        report[sport_name]["eventsstat_status"] = "Success"
                        
                        # Look for Nuxt state or V3 Host App
                        nuxt_match = re.search(r'window\.__NUXT__\s*=\s*([\s\S]+?);\s*</script>', es_html)
                        v3_match = re.search(r'window\.__V3_HOST_APP__\s*=\s*([\s\S]+?);\s*</script>', es_html)
                        
                        if nuxt_match:
                            print("Found window.__NUXT__ in EventsStat.")
                            report[sport_name]["eventsstat_state_type"] = "Nuxt"
                            # We can evaluate the first few chars
                            report[sport_name]["eventsstat_raw_snippet"] = nuxt_match.group(1)[:500]
                        elif v3_match:
                            print("Found window.__V3_HOST_APP__ in EventsStat.")
                            report[sport_name]["eventsstat_state_type"] = "V3_HOST_APP"
                            report[sport_name]["eventsstat_raw_snippet"] = v3_match.group(1)[:500]
                        else:
                            print("No script state found in HTML.")
                            report[sport_name]["eventsstat_state_type"] = "None"
                    else:
                        print("EventsStat request failed.")
                        report[sport_name]["eventsstat_status"] = "Failed"
                else:
                    print("No SGI found for this event, skipping EventsStat lookup.")
            else:
                print("No events found for this sport in either feed.")
                
        except Exception as e:
            print(f"❌ Error exploring {sport_name}: {str(e)}")
            report[sport_name]["error"] = str(e)
            
    # Save the exploration report
    with open("sports_data_exploration.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print("\n✅ Exploration finished! Results saved to sports_data_exploration.json")

if __name__ == "__main__":
    explore_sports()
