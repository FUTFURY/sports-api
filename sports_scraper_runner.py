import urllib.request
import urllib.parse
import json
import re
import sys
import os
import time

class XBetMirrorResolver:
    def __init__(self, mirrors_json_path="1xbet_countries_mirrors.json"):
        self.path = mirrors_json_path

    def resolve(self, country="Algeria"):
        if not os.path.exists(self.path):
            return "https://sa.1xbet.com"
        
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                mirrors_data = json.load(f)
            
            for entry in mirrors_data:
                if entry.get("country", "").lower() == country.lower():
                    for mirror in entry.get("all_mirrors", []):
                        if self._test_mirror(mirror):
                            return mirror
        except Exception:
            pass
            
        return "https://sa.1xbet.com"

    def _test_mirror(self, mirror):
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
            "Accept-Language": "fr,en-US;q=0.9,en;q=0.8"
        }

    def request(self, endpoint, is_json=True, referer=None, custom_headers=None):
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith("http") else endpoint
        
        headers = self.headers.copy()
        if referer:
            headers["Referer"] = referer
        if custom_headers:
            headers.update(custom_headers)
            
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
            return None


class SportsConfig:
    def __init__(self, config_path="allsport.json"):
        self.config_path = config_path
        self.sports = {}
        self.load_config()

    def load_config(self):
        if not os.path.exists(self.config_path):
            print(f"⚠️ Configuration file {self.config_path} not found.", file=sys.stderr)
            return
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for s in data:
                    s_id = int(s["sportId"])
                    self.sports[s_id] = s
                    # Also map by name (lowercase) for easier lookup
                    self.sports[s["name"].lower()] = s
                    if s.get("shortName"):
                        self.sports[s["shortName"].lower()] = s
        except Exception as e:
            print(f"⚠️ Error loading allsport.json: {str(e)}", file=sys.stderr)

    def get_by_identifier(self, identifier):
        try:
            # Try as ID
            s_id = int(identifier)
            return self.sports.get(s_id)
        except ValueError:
            # Try as Name
            return self.sports.get(str(identifier).lower())


class UniversalParser:
    @staticmethod
    def get_ordinal_label(index, command, lang="fr"):
        """Returns friendly ordinal labels like 1er Set / 1st Quarter."""
        idx = index + 1
        if lang == "fr":
            if command.lower() == "set":
                suffix = "er" if idx == 1 else "ème"
                return f"{idx}{suffix} Set"
            elif command.lower() == "mi-temps":
                suffix = "ère" if idx == 1 else "ème"
                return f"{idx}{suffix} Mi-temps"
            elif command.lower() == "quart-temps":
                suffix = "er" if idx == 1 else "ème"
                return f"{idx}{suffix} Quart-temps"
            elif command.lower() == "manche":
                suffix = "ère" if idx == 1 else "ème"
                return f"{idx}{suffix} Manche"
            elif command.lower() == "period" or command.lower() == "période":
                suffix = "ère" if idx == 1 else "ème"
                return f"{idx}{suffix} Période"
            elif command.lower() == "round":
                return f"Round {idx}"
            else:
                return f"{idx}e {command}"
        else:  # English fallback
            if command.lower() == "set":
                suffix = "st" if idx == 1 else "nd" if idx == 2 else "rd" if idx == 3 else "th"
                return f"{idx}{suffix} Set"
            elif command.lower() == "mi-temps" or command.lower() == "half":
                suffix = "st" if idx == 1 else "nd" if idx == 2 else "rd" if idx == 3 else "th"
                return f"{idx}{suffix} Half"
            elif command.lower() == "quart-temps" or command.lower() == "quarter":
                suffix = "st" if idx == 1 else "nd" if idx == 2 else "rd" if idx == 3 else "th"
                return f"{idx}{suffix} Quarter"
            else:
                return f"{command} {idx}"

    @staticmethod
    def parse_score(sc, config, lang="fr"):
        if not sc:
            return None
        
        command = config.get("command", "Période")
        raw_fs = sc.get("FS", {})
        
        periods_parsed = []
        if isinstance(raw_fs, dict):
            for k, val in raw_fs.items():
                try:
                    idx = int(k)
                    label = UniversalParser.get_ordinal_label(idx, command, lang)
                    periods_parsed.append({
                        "period": idx + 1,
                        "label": label,
                        "score": val
                    })
                except ValueError:
                    pass
        elif isinstance(raw_fs, list):
            for idx, val in enumerate(raw_fs):
                label = UniversalParser.get_ordinal_label(idx, command, lang)
                periods_parsed.append({
                    "period": idx + 1,
                    "label": label,
                    "score": val
                })

        # Sorting periods in order
        periods_parsed.sort(key=lambda x: x["period"])

        return {
            "global": f"{sc.get('S1', 0)}:{sc.get('S2', 0)}",
            "periods": periods_parsed,
            "current": sc.get("PS")
        }

    @staticmethod
    def normalize_event(event, config, lang="fr"):
        if not event:
            return None

        is_team = config.get("isTeamSport", True)
        
        # Mapping base values
        normalized = {
            "id": event.get("I"),
            "sportId": config["sportId"],
            "sportName": config["name"],
            "tournamentName": event.get("L"),
            "tournamentCountry": event.get("CN"),
            "startTime": event.get("S"),
            "title": f"{event.get('O1')} vs {event.get('O2') or 'N/A'}",
            "status": "live" if event.get("SC") else "upcoming",
            "matchHexId": event.get("SGI"),
            "seasonHexId": event.get("STI"),
            "winProbability": event.get("WP"),
            "odds": event.get("E")
        }

        # Handle Opponents
        opponents = []
        if event.get("O1"):
            opponents.append({
                "name": event.get("O1"),
                "id": event.get("O1I"),
                "image": event.get("O1IMG", [""])[0] if event.get("O1IMG") else None
            })
        if event.get("O2"):
            opponents.append({
                "name": event.get("O2"),
                "id": event.get("O2I"),
                "image": event.get("O2IMG", [""])[0] if event.get("O2IMG") else None
            })
        normalized["opponents"] = opponents

        # Handle Scores
        normalized["score"] = UniversalParser.parse_score(event.get("SC"), config, lang)

        # Handle Live Stats comparisons
        stats_list = []
        sc = event.get("SC", {})
        if sc and sc.get("ST"):
            st_list = sc.get("ST", [])
            for st in st_list:
                val = st.get("Value", [])
                for item in val:
                    stats_list.append({
                        "metric": item.get("N"),
                        "opp1": item.get("S1"),
                        "opp2": item.get("S2")
                    })
        normalized["live_statistics"] = stats_list

        # Meta Information (Weather, venue, referee, etc.)
        meta = []
        mis = event.get("MIS", [])
        for item in mis:
            meta.append({
                "key": item.get("K"),
                "value": item.get("V")
            })
        normalized["meta"] = meta

        return normalized


class EventsStatNuxtParser:
    @staticmethod
    def parse_nuxt_html(html):
        if not html:
            return None
        
        nuxt_match = re.search(r'window\.__NUXT__\s*=\s*([\s\S]+?);\s*</script>', html)
        if not nuxt_match:
            return None
        
        # We can extract strings, numbers, arrays, objects using safe regex or eval.
        # Since standard evaluation of complex Nuxt self-executing functions requires JS,
        # we can build a fallback python parser using regex to extract titles, games, and meets.
        script = nuxt_match.group(1)
        
        # Extract direct wins / H2H counts if available
        wins = re.findall(r'"Wins",\s*values:\s*\[\s*(\d+),\s*(\d+),\s*(\d+)\s*\]', script)
        total_wins = None
        if wins:
            total_wins = {"opp1": int(wins[0][0]), "opp2": int(wins[0][1]), "draws": int(wins[0][2])}

        # Extract game IDs for H2H
        game_ids = list(set(re.findall(r'"([a-f0-9]{24})"', script)))

        # Extract player/opponent names
        names = list(set(re.findall(r'"([A-Z][a-zA-Z\s]+)"', script[:10000])))

        return {
            "h2h_wins": total_wins,
            "associated_game_ids": game_ids[:10],
            "detected_names": names[:5]
        }


class XBetRunner:
    def __init__(self):
        self.resolver = XBetMirrorResolver()
        self.mirror = self.resolver.resolve()
        self.client = XBetClient(self.mirror)
        self.config = SportsConfig()

    def get_events(self, sport_id, feed_type="LineFeed", lang="fr"):
        # We try FR first, and if we get no value or error, fallback to EN
        url = f"service-api/{feed_type}/Get1x2_VZip?sports={sport_id}&count=50&lng={lang}&mode=4&country=158&getEmpty=true"
        print(f"ℹ️ Requesting {feed_type} for sport {sport_id} in '{lang}'...", file=sys.stderr)
        data = self.client.request(url)
        
        if not data or not data.get("Value"):
            if lang == "fr":
                print(f"⚠️ No data in 'fr'. Falling back to 'en'...", file=sys.stderr)
                return self.get_events(sport_id, feed_type, lang="en")
            return []
            
        return data.get("Value", [])

    def get_past_events(self, sport_id, lang="fr"):
        ts_now = int(time.time())
        ts_hour = ts_now - (ts_now % 3600)
        ts_from = ts_hour - (3600 * 24)
        ts_to = ts_hour
        
        # BFF headers required to avoid 400
        headers = {
            "Origin": self.mirror,
            "Referer": f"{self.mirror}/{lang}/results",
            "x-app-n": "__RESULTS_FRONTEND__",
            "x-requested-with": "XMLHttpRequest",
            "x-svc-source": "__RESULTS_FRONTEND__"
        }

        champs_url = f"service-api/result/web/api/v2/champs?dateFrom={ts_from}&dateTo={ts_to}&lng={lang}&ref=1&sportIds={sport_id}"
        print(f"ℹ️ Requesting past championships in '{lang}'...", file=sys.stderr)
        champs_data = self.client.request(champs_url, custom_headers=headers)
        
        if not champs_data or not champs_data.get("items"):
            if lang == "fr":
                print(f"⚠️ No results in 'fr'. Falling back to 'en'...", file=sys.stderr)
                return self.get_past_events(sport_id, lang="en")
            return []

        champs = champs_data.get("items", [])
        all_games = []
        
        # Query first 3 championships to avoid massive hits
        for champ in champs[:3]:
            games_url = f"service-api/result/web/api/v3/games?champId={champ.get('id')}&dateFrom={ts_from}&dateTo={ts_to}&lng={lang}&ref=1"
            games_data = self.client.request(games_url, custom_headers=headers)
            if games_data and games_data.get("items"):
                for game in games_data["items"]:
                    game["champName"] = champ.get("name")
                    all_games.append(game)

        return all_games


def print_help():
    print("""
1xBet Dynamic Multi-Sports Scraper Runner
Usage:
  python3 sports_scraper_runner.py list                          : List all configured sports in allsport.json
  python3 sports_scraper_runner.py live <sport_name_or_id>      : Scrape live games of a sport (FR/EN)
  python3 sports_scraper_runner.py upcoming <sport_name_or_id>  : Scrape upcoming games of a sport (FR/EN)
  python3 sports_scraper_runner.py past <sport_name_or_id>      : Scrape past matches of a sport (FR/EN)
  python3 sports_scraper_runner.py details <game_id> <sport>    : Get full game details & EventsStat popup
""")

def main():
    if len(sys.argv) < 2:
        print_help()
        return

    action = sys.argv[1]
    runner = XBetRunner()

    if action == "list":
        print("=== CONFIGURED SPORTS (allsport.json) ===")
        sports = sorted(list(set(s["name"] for s in runner.config.sports.values() if isinstance(s, dict))))
        for s in sports:
            conf = runner.config.sports[s.lower()]
            print(f"- ID: {conf['sportId']} | {conf['name']} (isTeamSport: {conf['isTeamSport']}, command: {conf.get('command')})")
            
    elif action in ["live", "upcoming", "past"]:
        if len(sys.argv) < 3:
            print(f"❌ Error: Missing sport parameter. Ex: python3 sports_scraper_runner.py {action} football")
            return
        
        sport_ident = sys.argv[2]
        sport_config = runner.config.get_by_identifier(sport_ident)
        if not sport_config:
            print(f"❌ Error: Sport '{sport_ident}' not found in allsport.json.")
            return

        sport_id = sport_config["sportId"]
        sport_name = sport_config["name"]
        
        print(f"🔥 Scraping {action.upper()} events for {sport_name} (ID: {sport_id})...")
        
        if action == "live":
            events = runner.get_events(sport_id, "LiveFeed")
        elif action == "upcoming":
            events = runner.get_events(sport_id, "LineFeed")
        else:
            events = runner.get_past_events(sport_id)

        print(f"Found {len(events)} matches.")
        
        normalized_list = []
        for ev in events[:10]:  # Limit to 10 for terminal printing
            if action == "past":
                # Handle past game score normalization
                # past results matches are structured differently than line/live
                normalized_list.append({
                    "id": ev.get("id"),
                    "championship": ev.get("champName"),
                    "opponents": [ev.get("opp1"), ev.get("opp2")],
                    "score": ev.get("score"),
                    "date": ev.get("dateStart"),
                    "has_stats": ev.get("subGame") is not None
                })
            else:
                norm = UniversalParser.normalize_event(ev, sport_config, lang="fr")
                normalized_list.append(norm)

        print(json.dumps(normalized_list, indent=2, ensure_ascii=False))

    elif action == "details":
        if len(sys.argv) < 3:
            print("❌ Error: Missing game_id. Ex: python3 sports_scraper_runner.py details 734726806 tennis")
            return
        
        game_id = sys.argv[2]
        sport_ident = sys.argv[3] if len(sys.argv) > 3 else "tennis"
        
        sport_config = runner.config.get_by_identifier(sport_ident)
        if not sport_config:
            print(f"❌ Error: Sport '{sport_ident}' not found.")
            return
            
        print(f"🔍 Fetching details for Game {game_id} ({sport_config['name']})...")
        # Query 1xbet Game Details
        url = f"service-api/LineFeed/GetGameZip?id={game_id}&lng=fr&mode=4&country=158"
        res = runner.client.request(url)
        
        result_payload = {}
        if res and res.get("Value"):
            val = res["Value"]
            gz_val = val[0] if isinstance(val, list) else val
            norm = UniversalParser.normalize_event(gz_val, sport_config, lang="fr")
            result_payload["1xbet_details"] = norm
            
            sgi = norm.get("matchHexId")
            if sgi:
                sport_slug = sport_config["name"].lower().replace(" ", "-")
                es_url = f"https://eventsstat.com/fr/statisticpopup/game/{sport_slug}/{sgi}/main"
                print(f"🔍 Querying EventsStat statistics popup...")
                es_html = runner.client.request(es_url, is_json=False)
                if es_html:
                    result_payload["eventsstat_stats"] = EventsStatNuxtParser.parse_nuxt_html(es_html)
        
        print(json.dumps(result_payload, indent=2, ensure_ascii=False))
        
    else:
        print_help()

if __name__ == "__main__":
    main()
