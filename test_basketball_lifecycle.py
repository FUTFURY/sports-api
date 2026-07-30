import urllib.request
import json
import time

MIRROR = "https://sa.1xbet.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9"
}

def make_request(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8', errors='ignore'))
    except Exception as e:
        print(f"  ⚠️ Error requesting {url}: {str(e)}")
        return None

def make_results_request(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": MIRROR,
        "Referer": f"{MIRROR}/en/results",
        "x-app-n": "__RESULTS_FRONTEND__",
        "x-requested-with": "XMLHttpRequest",
        "x-svc-source": "__RESULTS_FRONTEND__"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8', errors='ignore'))
    except Exception as e:
        print(f"  ⚠️ Error requesting {url}: {str(e)}")
        return None

def test_lifecycle():
    print("=== TESTING BASKETBALL MATCH LIFECYCLE (UPCOMING, LIVE, PAST) ===\n")
    
    # 1. UPCOMING MATCHES (LineFeed)
    print("1. Querying UPCOMING Basketball matches...")
    upcoming_url = f"{MIRROR}/service-api/LineFeed/Get1x2_VZip?sports=3&count=50&lng=en&mode=4&country=158&getEmpty=true"
    upcoming_data = make_request(upcoming_url)
    upcoming_events = upcoming_data.get("Value", []) if upcoming_data else []
    print(f"   Found {len(upcoming_events)} upcoming basketball matches.")
    for ev in upcoming_events[:2]:
        print(f"   - [ID: {ev.get('I')}] {ev.get('O1')} vs {ev.get('O2')} | Has Odds? {ev.get('E') is not None} | Has Live Score? {ev.get('SC') is not None} | SGI: {ev.get('SGI')}")

    # 2. LIVE MATCHES (LiveFeed)
    print("\n2. Querying LIVE Basketball matches...")
    live_url = f"{MIRROR}/service-api/LiveFeed/Get1x2_VZip?sports=3&count=50&lng=en&mode=4&country=158&getEmpty=true"
    live_data = make_request(live_url)
    live_events = live_data.get("Value", []) if live_data else []
    print(f"   Found {len(live_events)} live basketball matches.")
    for ev in live_events[:2]:
        sc = ev.get("SC", {})
        print(f"   - [ID: {ev.get('I')}] {ev.get('O1')} vs {ev.get('O2')}")
        print(f"     Score global: {sc.get('S1')}:{sc.get('S2')} | Current point/set score: {sc.get('PS')} | Quarters: {sc.get('FS')}")

    # 3. PAST MATCHES (Results API)
    print("\n3. Querying PAST Basketball matches (Results API)...")
    # Query results aligned with exact hourly boundaries (1xBet strict checking)
    ts_now = int(time.time())
    ts_hour = ts_now - (ts_now % 3600)
    ts_from = ts_hour - (3600 * 24)
    ts_to = ts_hour
    
    # Query championships first
    champs_url = f"{MIRROR}/service-api/result/web/api/v2/champs?dateFrom={ts_from}&dateTo={ts_to}&lng=en&ref=1&sportIds=3"
    champs_data = make_results_request(champs_url)
    champs = champs_data.get("items", []) if champs_data else []
    print(f"   Found {len(champs)} basketball championships with results.")
    
    match_count = 0
    for champ in champs[:2]:
        print(f"   - Championship: {champ.get('name')} (ID: {champ.get('id')})")
        # Fetch games for this champ
        games_url = f"{MIRROR}/service-api/result/web/api/v3/games?champId={champ.get('id')}&dateFrom={ts_from}&dateTo={ts_to}&lng=en&ref=1"
        games_data = make_results_request(games_url)
        games = games_data.get("items", []) if games_data else []
        for g in games[:2]:
            match_count += 1
            print(f"     * Game [ID: {g.get('id')}]: {g.get('opp1')} vs {g.get('opp2')}")
            print(f"       Final Score: {g.get('score')} | Has stats? {g.get('subGame') is not None}")
            
    if match_count == 0:
        print("   ⚠️ No past games found in the resolved window. (Check results parameters/headers if needed).")

if __name__ == "__main__":
    test_lifecycle()
