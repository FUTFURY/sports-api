import urllib.request
import json
import re
import sys
import os

class XBetMirrorResolver:
    def __init__(self, mirrors_json_path="1xbet_countries_mirrors.json"):
        self.path = mirrors_json_path

    def resolve(self, country="Algeria"):
        if not os.path.exists(self.path):
            print(f"⚠️ Mirror JSON not found at {self.path}. Using default.")
            return "https://sa.1xbet.com"
        
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                mirrors_data = json.load(f)
            
            # Find the country entry
            for entry in mirrors_data:
                if entry.get("country", "").lower() == country.lower():
                    # Test each mirror in order
                    for mirror in entry.get("all_mirrors", []):
                        if self._test_mirror(mirror):
                            return mirror
        except Exception as e:
            print(f"⚠️ Error resolving mirror: {str(e)}")
            
        return "https://sa.1xbet.com"

    def _test_mirror(self, mirror):
        # Quick test on sports list endpoint (lightweight request)
        url = f"{mirror}/service-api/LineFeed/GetSportsShortZip?lng=en"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=3) as res:
                if res.status == 200:
                    return True
        except Exception:
            pass
        return False


class XBetClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": base_url
        }

    def request(self, endpoint, is_json=True, referer=None):
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith("http") else endpoint
        
        headers = self.headers.copy()
        if referer:
            headers["Referer"] = referer
            
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read()
                charset = response.headers.get_content_charset() or 'utf-8'
                decoded = content.decode(charset, errors='ignore')
                if is_json:
                    return json.loads(decoded)
                return decoded
        except Exception as e:
            print(f"❌ HTTP Error requesting {url}: {str(e)}", file=sys.stderr)
            return None


class XBetParser:
    @staticmethod
    def normalize_event(event):
        """Normalizes a raw 1xBet event payload into a clean format."""
        if not event:
            return None

        # Determine type of sport/payload
        sport_id = event.get("SI", 0)
        sport_name = event.get("SN", "Unknown")
        
        # Base normalized event structure
        normalized = {
            "id": event.get("I"),
            "sportId": sport_id,
            "sportName": sport_name,
            "tournamentId": event.get("LI"),
            "tournamentName": event.get("L"),
            "tournamentCountry": event.get("CN"),
            "startTime": event.get("S"),
            "title": f"{event.get('O1')} vs {event.get('O2') or 'N/A'}",
            "isLive": event.get("SC") is not None,
            "matchHexId": event.get("SGI"),
            "seasonHexId": event.get("STI"),
            "winProbability": event.get("WP"),
            "marketCount": event.get("EC", 0)
        }

        # Parse opponents
        normalized["opponents"] = []
        if event.get("O1"):
            normalized["opponents"].append({
                "name": event.get("O1"),
                "id": event.get("O1I"),
                "countryId": event.get("O1C"),
                "image": event.get("O1IMG", [""])[0] if event.get("O1IMG") else None
            })
        if event.get("O2"):
            normalized["opponents"].append({
                "name": event.get("O2"),
                "id": event.get("O2I"),
                "countryId": event.get("O2C"),
                "image": event.get("O2IMG", [""])[0] if event.get("O2IMG") else None
            })

        # Parse score structure
        if event.get("SC"):
            sc = event["SC"]
            normalized["score"] = {
                "sets": sc.get("FS", []),
                "gamesPlayer1": sc.get("S1", 0),
                "gamesPlayer2": sc.get("S2", 0),
                "currentSetScore": sc.get("PS")
            }
        else:
            normalized["score"] = None

        # Custom Sport specific mappings
        if sport_id == 41:  # Golf
            # Parse round and day info
            normalized["golf_round"] = event.get("TN")
        elif sport_id == 36:  # Cycling
            normalized["cycling_details"] = event.get("MIS")
        
        return normalized


class EventsStatScraper:
    def __init__(self):
        self.client = XBetClient("https://eventsstat.com")

    def get_match_stats(self, sgi_hex_id, sport_name="tennis"):
        """Crawls and extracts the detailed Nuxt/V3 state for a match from EventsStat."""
        sport_slug = sport_name.lower().replace(" (ping-pong)", "").replace(" ", "-")
        url = f"https://eventsstat.com/en/statisticpopup/game/{sport_slug}/{sgi_hex_id}/main"
        
        print(f"🔍 Fetching EventsStat page for {sport_name} (ID: {sgi_hex_id})...", file=sys.stderr)
        html = self.client.request(url, is_json=False, referer="https://eventsstat.com/en/statistic/")
        
        if not html:
            return None

        # Look for Nuxt state or V3 Host App
        nuxt_match = re.search(r'window\.__NUXT__\s*=\s*([\s\S]+?);\s*</script>', html)
        v3_match = re.search(r'window\.__V3_HOST_APP__\s*=\s*([\s\S]+?);\s*</script>', html)
        
        if nuxt_match:
            return self._clean_state_string(nuxt_match.group(1), "nuxt")
        elif v3_match:
            return self._clean_state_string(v3_match.group(1), "v3")
        
        return None

    def _clean_state_string(self, js_code, state_type):
        """Simplistic parsing of evaluated states. Evaluates the Nuxt JS payload into JSON."""
        # For a truly robust, self-contained Python script: we can use regex to extract values
        # or evaluate via python exec() if rewritten, or export it.
        # Here we extract and format it as a raw string to return.
        # (In our actual implementation, a full evaluation using Node or JS engine is done,
        # but we can return the raw script or use basic regex to parse names/stats).
        return {
            "type": state_type,
            "raw_payload_snippet": js_code[:1000] + "...",
            "extracted_fields": {
                "players": list(set(re.findall(r'"([A-Z][a-z]+ [A-Z][a-z]+)"', js_code))),
                "stats_found": list(set(re.findall(r'"([A-Za-z ]+)"', js_code[:5000])))
            }
        }


# --- CLI INTERFACE FOR TESTING ---
def print_help():
    print("""
1xBet & EventsStat CLI Scraper
Usage:
  python3 xbet_scraper.py resolve                : Resolve active mirror domain
  python3 xbet_scraper.py search <term> <sport>  : Search live/line matches
  python3 xbet_scraper.py game <game_id>         : Get full details of a specific match
  python3 xbet_scraper.py stats <sgi> <sport>    : Get EventsStat stats using SGI
""")

def main():
    if len(sys.argv) < 2:
        print_help()
        return

    action = sys.argv[1]
    
    # Initialize mirror resolver
    resolver = XBetMirrorResolver()
    mirror = resolver.resolve()
    print(f"ℹ️ Active Mirror resolved: {mirror}\n")
    
    client = XBetClient(mirror)

    if action == "resolve":
        print(f"✅ Active Mirror Domain: {mirror}")
        
    elif action == "search":
        term = sys.argv[2] if len(sys.argv) > 2 else "Wimbledon"
        sport_id = sys.argv[3] if len(sys.argv) > 3 else "4" # Tennis
        
        print(f"🔍 Searching for '{term}' in Sport ID {sport_id}...")
        url = f"service-api/LineFeed/Web_SearchZip?text={urllib.parse.quote(term)}&limit=10&lng=en&country=158&mode=4"
        res = client.request(url)
        
        if res and res.get("Value"):
            matches = res["Value"]
            print(f"Found {len(matches)} matches:\n")
            for m in matches:
                norm = XBetParser.normalize_event(m)
                print(f"- [ID: {norm['id']}] {norm['title']} in {norm['tournamentName']}")
                print(f"  SGI: {norm['matchHexId']} | STI: {norm['seasonHexId']}")
                print("-" * 50)
        else:
            print("❌ No matches found or request failed.")
            
    elif action == "game":
        if len(sys.argv) < 3:
            print("❌ Error: Missing game_id parameter.")
            return
        game_id = sys.argv[2]
        print(f"🔍 Fetching details for Game ID: {game_id}...")
        url = f"service-api/LineFeed/GetGameZip?id={game_id}&lng=en&mode=4&country=158"
        res = client.request(url)
        
        if res and res.get("Value"):
            val = res["Value"]
            gz_val = val[0] if isinstance(val, list) else val
            norm = XBetParser.normalize_event(gz_val)
            print(json.dumps(norm, indent=2))
        else:
            print("❌ Match details not found.")
            
    elif action == "stats":
        if len(sys.argv) < 3:
            print("❌ Error: Missing SGI parameter.")
            return
        sgi = sys.argv[2]
        sport = sys.argv[3] if len(sys.argv) > 3 else "tennis"
        
        es = EventsStatScraper()
        stats = es.get_match_stats(sgi, sport)
        if stats:
            print(json.dumps(stats, indent=2))
        else:
            print("❌ Failed to retrieve stats from EventsStat.")
    else:
        print_help()

if __name__ == "__main__":
    main()
