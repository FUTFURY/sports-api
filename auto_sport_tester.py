import urllib.request
import json
import time
import sys
import os

class AutoSportTester:
    def __init__(self, mirror):
        self.mirror = mirror
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9"
        }
        self.results_headers = {
            **self.headers,
            "Origin": mirror,
            "Referer": f"{mirror}/en/results",
            "x-app-n": "__RESULTS_FRONTEND__",
            "x-requested-with": "XMLHttpRequest",
            "x-svc-source": "__RESULTS_FRONTEND__"
        }

    def make_request(self, url, headers):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                return json.loads(response.read().decode('utf-8', errors='ignore'))
        except Exception:
            return None

    def test_sport(self, sport_id, sport_name):
        print(f"🧪 Testing capabilities for {sport_name} (ID: {sport_id})...")
        capabilities = {
            "upcoming": {"status": "Not Found", "has_sgi": False, "has_odds": False},
            "live": {"status": "Not Found", "score_format": None},
            "past": {"status": "Not Found", "has_stats": False, "opponent_format": None}
        }

        # 1. UPCOMING
        url_up = f"{self.mirror}/service-api/LineFeed/Get1x2_VZip?sports={sport_id}&count=50&lng=en&mode=4&country=158&getEmpty=true"
        data_up = self.make_request(url_up, self.headers)
        events_up = data_up.get("Value", []) if data_up else []
        if events_up:
            capabilities["upcoming"]["status"] = "OK"
            capabilities["upcoming"]["count"] = len(events_up)
            sample = events_up[0]
            capabilities["upcoming"]["has_sgi"] = sample.get("SGI") is not None
            capabilities["upcoming"]["has_odds"] = sample.get("E") is not None
            capabilities["upcoming"]["sample_keys"] = list(sample.keys())[:15]

        # 2. LIVE
        url_live = f"{self.mirror}/service-api/LiveFeed/Get1x2_VZip?sports={sport_id}&count=50&lng=en&mode=4&country=158&getEmpty=true"
        data_live = self.make_request(url_live, self.headers)
        events_live = data_live.get("Value", []) if data_live else []
        if events_live:
            capabilities["live"]["status"] = "OK"
            capabilities["live"]["count"] = len(events_live)
            sample = events_live[0]
            sc = sample.get("SC", {})
            if sc:
                capabilities["live"]["score_format"] = {
                    "has_periods": sc.get("FS") is not None,
                    "has_point_score": sc.get("PS") is not None,
                    "sample_score": sc
                }

        # 3. PAST
        ts_now = int(time.time())
        ts_hour = ts_now - (ts_now % 3600)
        ts_from = ts_hour - (3600 * 24)
        ts_to = ts_hour
        
        champs_url = f"{self.mirror}/service-api/result/web/api/v2/champs?dateFrom={ts_from}&dateTo={ts_to}&lng=en&ref=1&sportIds={sport_id}"
        champs_data = self.make_request(champs_url, self.results_headers)
        champs = champs_data.get("items", []) if champs_data else []
        if champs:
            capabilities["past"]["status"] = "OK"
            capabilities["past"]["championships_count"] = len(champs)
            
            # Fetch games for the first champ
            games_url = f"{self.mirror}/service-api/result/web/api/v3/games?champId={champs[0].get('id')}&dateFrom={ts_from}&dateTo={ts_to}&lng=en&ref=1"
            games_data = self.make_request(games_url, self.results_headers)
            games = games_data.get("items", []) if games_data else []
            if games:
                sample = games[0]
                capabilities["past"]["has_stats"] = sample.get("subGame") is not None
                opp1 = sample.get("opp1")
                capabilities["past"]["opponent_format"] = "string" if isinstance(opp1, str) else "object"
                capabilities["past"]["sample_score"] = sample.get("score")
                capabilities["past"]["sample_keys"] = list(sample.keys())
        
        return capabilities

def main():
    # 1. Resolve mirror
    from xbet_scraper import XBetMirrorResolver
    resolver = XBetMirrorResolver()
    mirror = resolver.resolve()
    print(f"ℹ️ Active Mirror resolved: {mirror}\n")

    # 2. Get list of active sports
    tester = AutoSportTester(mirror)
    print("🔍 Fetching active sports list...")
    sports_url = f"{mirror}/service-api/LineFeed/GetSportsShortZip?lng=en&country=158"
    sports_data = tester.make_request(sports_url, tester.headers)
    sports = sports_data.get("Value", []) if sports_data else []
    print(f"Found {len(sports)} active sports.\n")

    # Major sports we want to map and test automatically
    target_sports = {
        1: "Football",
        3: "Basketball",
        4: "Tennis",
        10: "Table Tennis",
        26: "Formula 1",
        36: "Bicycle Racing",
        41: "Golf",
        16: "Badminton",
        21: "Darts",
        30: "Snooker",
        66: "Cricket"
    }

    report = {}
    for s_id, s_name in target_sports.items():
        try:
            report[s_name] = tester.test_sport(s_id, s_name)
        except Exception as e:
            print(f"  ❌ Failed testing {s_name}: {str(e)}")
            report[s_name] = {"error": str(e)}

    # Save results to a capability matrix JSON file
    output_path = "sports_capabilities_matrix.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        
    print(f"\n✅ Capability Matrix saved to: {output_path}")
    print("\n--- MATRIX OVERVIEW ---")
    for name, cap in report.items():
        if "error" in cap:
            print(f"- {name}: ❌ Error: {cap['error']}")
            continue
        up = cap["upcoming"]["status"]
        lv = cap["live"]["status"]
        ps = cap["past"]["status"]
        print(f"- {name} | Upcoming: {up} | Live: {lv} | Past: {ps}")

if __name__ == "__main__":
    main()
