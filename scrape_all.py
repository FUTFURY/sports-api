import urllib.request
import urllib.parse
import json
import re
import os
import time
import calendar
import datetime

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
        except Exception:
            return None


class UniversalParser:
    @staticmethod
    def get_ordinal_label(index, command, lang="fr"):
        """Returns dynamically generated friendly ordinal labels without hardcoded sport names."""
        idx = index + 1
        if not command:
            command = "Période"
            
        if lang == "fr":
            # Feminine nouns in French for sports matches divisions
            feminine_words = {"mi-temps", "manche", "période", "éliminatoire", "tentative", "session", "partie", "volée"}
            is_fem = command.lower() in feminine_words
            suffix = ("ère" if is_fem else "er") if idx == 1 else "ème"
            return f"{idx}{suffix} {command}"
        else:
            if 11 <= idx <= 13:
                suffix = "th"
            else:
                suffix = {1: "st", 2: "nd", 3: "rd"}.get(idx % 10, "th")
            return f"{idx}{suffix} {command}"

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
        normalized["score"] = UniversalParser.parse_score(event.get("SC"), config, lang)

        # Stats comparison
        stats_list = []
        sc = event.get("SC", {})
        if sc and sc.get("ST"):
            for st in sc.get("ST", []):
                for item in st.get("Value", []):
                    stats_list.append({
                        "metric": item.get("N"),
                        "opp1": item.get("S1"),
                        "opp2": item.get("S2")
                    })
        normalized["live_statistics"] = stats_list

        meta = []
        for item in event.get("MIS", []):
            meta.append({
                "key": item.get("K"),
                "value": item.get("V")
            })
        normalized["meta"] = meta

        return normalized


# ──────────────────────────────────────────────────────────────
# EventsStat API Client
# Confirmed working endpoints (validated via probe scripts):
#  - RatingDetailedNewBySelectors?ratingDate=YYYY.MM.DD  → rankings historiques (back to 2016)
#  - PlayerDetailed?playerId=HEX                         → F(upcoming), G(10 last), PS(stats), TS(schedule)
# ──────────────────────────────────────────────────────────────
class EventsStatFetcher:
    BASE = "https://eventsstat.com"
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Referer": "https://eventsstat.com/",
    }

    def _get(self, url):
        req = urllib.request.Request(url, headers=self.HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return json.loads(r.read().decode("utf-8", errors="ignore"))
        except Exception:
            return None

    def get_ranking(self, tourn_id, date_str=None, lang="fr", limit=100):
        """
        Récupère le classement actuel d'un tournoi EventsStat.
        NOTE IMPORTANTE : le paramètre ratingDate est ignoré côté serveur —
        l'API retourne toujours le classement en cours, indépendamment de la date.
        Pour des rankings historiques, la voie serait le scraping de la page
        SSR 1xBet (nécessite authentification/session), non disponible en accès direct.
        """
        url = (f"{self.BASE}/en/services-api/SiteService/RatingDetailedNewBySelectors"
               f"?tournId={tourn_id}&recLimit=l.{limit}&ln={lang}&partner=0&geo=1")
        return self._get(url)


    def parse_ranking(self, data):
        """Normalise la réponse de get_ranking en liste de joueurs."""
        if not data or not data.get("T"):
            return []
        t    = data["T"]
        # TM peut être une liste ou un dict selon la version de l'API
        tm   = t.get("TM", [])
        meta_list = tm if isinstance(tm, list) else list(tm.values()) if isinstance(tm, dict) else []
        rows = t.get("R", [])
        if rows and isinstance(rows[0], list):
            rows = rows[0]

        players = []
        for row in rows:
            cols = row.get("C", []) if isinstance(row, dict) else []
            if len(cols) < 2:
                continue
            rank      = cols[0].get("V", [None])[0] if cols[0].get("V") else cols[0].get("C")
            player_id = cols[1].get("C")
            points    = (cols[3].get("V", [None])[0] if len(cols) > 3 and cols[3].get("V")
                         else cols[3].get("C") if len(cols) > 3 else None)
            meta = next((m for m in meta_list if isinstance(m, dict) and m.get("I") == player_id), {})
            # Country: S est une liste de {T: country_name, ...}
            s_list = meta.get("S", [])
            country = s_list[0].get("T") if isinstance(s_list, list) and s_list else None
            players.append({
                "rank":     rank,
                "playerId": player_id,
                "name":     meta.get("T") or f"Player_{str(player_id)[:8]}",
                "country":  country,
                "image":    meta.get("IM"),
                "points":   points,
            })
        return players

    def get_player_details(self, player_id, lang="fr"):
        """
        Récupère le profil complet d'un joueur EventsStat.
        Retourne:
          F  → prochains matchs (liste de 1-3 matchs)
          G  → 10 derniers matchs avec score, tournoi, adversaire
          PS → statistiques (1er service, break points, etc.)
          TS → calendrier tournois (rounds atteints, prize money)
          PB → biographie / données personnelles
        """
        url = (f"{self.BASE}/en/services-api/SiteService/PlayerDetailed"
               f"?playerId={player_id}&ln={lang}&partner=0&geo=1")
        return self._get(url)

    def parse_player_matches(self, data):
        """Normalise G (historique matchs) et F (prochains matchs) de PlayerDetailed."""
        if not data:
            return {"upcoming": [], "recent": []}

        def parse_match_list(arr):
            result = []
            for m in (arr or []):
                d_ts = m.get("D", 0)
                a    = m.get("A", {})
                h    = m.get("H", {})
                s    = m.get("S", {})
                result.append({
                    "matchId":    m.get("I"),
                    "date":       datetime.datetime.fromtimestamp(d_ts).isoformat() if d_ts else None,
                    "tournament": s.get("N") if isinstance(s, dict) else None,
                    "playerA":    {"id": a.get("I"), "name": a.get("T")} if isinstance(a, dict) else None,
                    "playerH":    {"id": h.get("I"), "name": h.get("T")} if isinstance(h, dict) else None,
                    "scoreA":     m.get("S1"),
                    "scoreH":     m.get("S2"),
                    "winner":     m.get("W"),
                    "sets":       [{"A": p.get("S1"), "H": p.get("S2")} for p in m.get("P", []) if isinstance(p, dict)],
                    "status":     m.get("SSt"),
                })
            return result

        return {
            "upcoming": parse_match_list(data.get("F", [])),
            "recent":   parse_match_list(data.get("G", [])),
        }


class ScrapeAllManager:
    def __init__(self, config_path="allsport.json"):
        self.resolver  = XBetMirrorResolver()
        self.mirror    = self.resolver.resolve()
        self.client    = XBetClient(self.mirror)
        self.evstat    = EventsStatFetcher()
        self.config_path = config_path
        self.sports_config = []
        self.load_config()

    def load_config(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                self.sports_config = json.load(f)

    def get_feed_events(self, sport_id, feed_type, lang="fr"):
        url = (f"service-api/{feed_type}/Get1x2_VZip"
               f"?sports={sport_id}&count=100&lng={lang}&mode=4&country=158&getEmpty=true")
        data = self.client.request(url)
        if not data or not data.get("Value"):
            if lang == "fr":
                return self.get_feed_events(sport_id, feed_type, lang="en")
            return []
        return data.get("Value", [])

    def _results_timestamps(self, date_str=None):
        """
        Calcule dateFrom/dateTo pour le Results API.
        Règle validée : aligner sur 21h UTC de la veille → 21h UTC du jour cible.
        Fenêtre max rétrospective : ~18 mois (400 si > 18 mois).
        """
        if date_str:
            y, m, d = map(int, date_str.split("-"))
            ts_midnight = int(calendar.timegm((y, m, d, 0, 0, 0)))
        else:
            ts_midnight = int(datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        ts_from = ts_midnight - 3 * 3600   # 21h UTC veille
        ts_to   = ts_from + 86400          # 21h UTC jour cible
        return ts_from, ts_to

    def get_past_events(self, sport_id, date_str=None, lang="fr", max_champs=2):
        """
        Récupère les résultats passés pour un sport.
        date_str: 'YYYY-MM-DD' (défaut: hier). Fenêtre max ~18 mois.
        Endpoint validé sans cookie : sa.1xbet.com/service-api/result/web/api/v2/champs
        """
        ts_from, ts_to = self._results_timestamps(date_str)

        results_headers = {
            "Origin":           self.mirror,
            "Referer":          f"{self.mirror}/{lang}/results",
            "x-app-n":          "__RESULTS_FRONTEND__",
            "x-requested-with": "XMLHttpRequest",
            "x-svc-source":     "__RESULTS_FRONTEND__",
        }

        champs_url = (f"service-api/result/web/api/v2/champs"
                      f"?dateFrom={ts_from}&dateTo={ts_to}&lng={lang}&ref=1&sportIds={sport_id}")
        champs_data = self.client.request(champs_url, custom_headers=results_headers)

        if not champs_data or not champs_data.get("items"):
            if lang == "fr":
                return self.get_past_events(sport_id, date_str, lang="en", max_champs=max_champs)
            return []

        champs   = champs_data.get("items", [])
        all_games = []
        for champ in champs[:max_champs]:
            games_url = (f"service-api/result/web/api/v3/games"
                         f"?champId={champ.get('id')}&dateFrom={ts_from}&dateTo={ts_to}&lng={lang}&ref=1")
            games_data = self.client.request(games_url, custom_headers=results_headers)
            if games_data and games_data.get("items"):
                for game in games_data["items"]:
                    game["champName"] = champ.get("name")
                    all_games.append(game)
        return all_games

    def run_all(self):
        print(f"🚀 Starting Universal Scrape for all {len(self.sports_config)} sports...")
        print(f"ℹ️ Target Mirror: {self.mirror}\n")

        output_data = {}
        summary = []

        for idx, sport in enumerate(self.sports_config):
            sport_id = sport["sportId"]
            sport_name = sport["name"]
            
            print(f"[{idx+1}/{len(self.sports_config)}] Processing {sport_name} (ID: {sport_id})...")
            
            # Scrape live
            live_raw = self.get_feed_events(sport_id, "LiveFeed")
            live_parsed = [UniversalParser.normalize_event(ev, sport, "fr") for ev in live_raw]
            
            # Scrape upcoming
            up_raw = self.get_feed_events(sport_id, "LineFeed")
            up_parsed = [UniversalParser.normalize_event(ev, sport, "fr") for ev in up_raw]
            
            # Scrape past
            past_raw = self.get_past_events(sport_id)
            past_parsed = []
            for ev in past_raw:
                past_parsed.append({
                    "id": ev.get("id"),
                    "championship": ev.get("champName"),
                    "opponents": [ev.get("opp1"), ev.get("opp2")],
                    "score": ev.get("score"),
                    "date": ev.get("dateStart"),
                    "has_stats": ev.get("subGame") is not None
                })

            if live_parsed or up_parsed or past_parsed:
                output_data[sport_name] = {
                    "sportId": sport_id,
                    "live": live_parsed,
                    "upcoming": up_parsed,
                    "past": past_parsed
                }
                
                print(f"   ✅ Success: {len(live_parsed)} Live | {len(up_parsed)} Upcoming | {len(past_parsed)} Past")
                summary.append(f"- {sport_name}: {len(live_parsed)} Live, {len(up_parsed)} Upcoming, {len(past_parsed)} Past")
            else:
                print(f"   ℹ️ No active events found.")

        # Save to output file
        output_file = "all_sports_data.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
            
        print(f"\n🎉 Finished scanning! Results saved to: {output_file}")
        print("\n=== SUMMARY OF ACTIVE SPORTS ===")
        for line in summary:
            print(line)

if __name__ == "__main__":
    manager = ScrapeAllManager()
    manager.run_all()
