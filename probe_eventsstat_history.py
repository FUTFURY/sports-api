#!/usr/bin/env python3
"""
probe_eventsstat_history.py
============================
Cherche les endpoints EventsStat pour l'historique de matchs par tournoi/joueur.
"""

import urllib.request
import urllib.error
import json
import gzip
import time
import re

EVSTAT = "https://eventsstat.com"
ATP_TOURN_ID = "5b19067ef87e5825813fb409"

# Joueur connu: Djokovic (chercher son ID dans les rankings 2021)
DJOKOVIC_SEARCH = "Djokovic"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept":          "application/json, text/html, */*",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Referer":         "https://eventsstat.com/",
}

def get_raw(url, extra=None):
    req = urllib.request.Request(url, headers={**HEADERS, **(extra or {})})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            raw = r.read()
            if r.info().get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            return r.status, raw.decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)

def jget(url, extra=None):
    s, b = get_raw(url, extra)
    try:
        return s, json.loads(b) if b else {}
    except:
        return s, {}

def section(t):
    print(f"\n{'='*60}\n  {t}\n{'='*60}")

# ─────────────────────────────────────────────────────────────
# STEP 1: Récupère l'ID de Djokovic depuis le ranking 2021
# ─────────────────────────────────────────────────────────────
section("STEP 1 — Récupère l'ID de Djokovic depuis le ranking 2021")

url = (f"{EVSTAT}/en/services-api/SiteService/RatingDetailedNewBySelectors"
       f"?tournId={ATP_TOURN_ID}&recLimit=l.100&ln=en&partner=0&geo=1"
       f"&ratingDate=2021.08.09")
status, data = jget(url)

djokovic_id = None
if isinstance(data, dict) and data.get("T"):
    t = data["T"]
    tm = t.get("TM", {})
    # Cherche Djokovic dans TM
    for pid, pdata in tm.items() if isinstance(tm, dict) else []:
        name = pdata.get("T", "") if isinstance(pdata, dict) else str(pdata)
        if "djokovic" in name.lower():
            djokovic_id = pdata.get("I") or pid
            print(f"  ✅ Djokovic trouvé: id={djokovic_id}  data={pdata}")
            break
    
    # Cherche aussi dans les rows
    r_data = t.get("R", [])
    if not djokovic_id and r_data:
        for row in (r_data[0] if isinstance(r_data[0], list) else r_data):
            cols = row.get("C", []) if isinstance(row, dict) else []
            for col in cols:
                if isinstance(col, dict):
                    val = str(col.get("V", col.get("C", "")))
                    if "djokovic" in val.lower():
                        djokovic_id = cols[1].get("C") if len(cols) > 1 else None
                        print(f"  ✅ Djokovic dans rows: id={djokovic_id}")
                        break

    if not djokovic_id:
        # Dump les 3 premiers TM entries
        print(f"  TM sample: {str(list(tm.items())[:3] if isinstance(tm, dict) else tm[:3])[:300]}")
        # Cherche brute force dans le JSON
        dump = json.dumps(data)
        m = re.search(r'"I"\s*:\s*"([^"]+)"[^}]*"T"\s*:\s*"[^"]*[Dd]jokovic[^"]*"', dump)
        if m:
            djokovic_id = m.group(1)
            print(f"  ✅ Djokovic id (regex): {djokovic_id}")
        else:
            idx = dump.lower().find("djokovic")
            print(f"  Context autour de djokovic: {dump[max(0,idx-50):idx+100]}")

if not djokovic_id:
    # Fallback: ID connu de Djokovic sur EventsStat
    djokovic_id = "novak-djokovic"
    print(f"  Fallback id: {djokovic_id}")

# ─────────────────────────────────────────────────────────────
# STEP 2: Endpoints historique de matchs pour un joueur
# ─────────────────────────────────────────────────────────────
section("STEP 2 — Endpoints historique matchs par joueur")

player_endpoints = [
    f"{EVSTAT}/en/services-api/SiteService/PlayerDetailed?playerId={djokovic_id}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/PlayerMatches?playerId={djokovic_id}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/PlayerHistory?playerId={djokovic_id}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/PlayerMatchHistory?playerId={djokovic_id}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/PlayerResults?playerId={djokovic_id}&ln=en&partner=0&geo=1&year=2021",
    f"{EVSTAT}/en/services-api/SiteService/PlayerStatistics?playerId={djokovic_id}&ln=en&partner=0&geo=1",
]

for url in player_endpoints:
    status, data = jget(url)
    ep = url.split("SiteService/")[1].split("?")[0]
    if isinstance(data, dict) and data:
        keys = list(data.keys())
        print(f"  [{status}] {ep} → keys={keys} size={len(json.dumps(data))}b")
        # Cherche des matchs ou résultats
        dump = json.dumps(data)
        if "match" in dump.lower() or "score" in dump.lower() or "result" in dump.lower():
            print(f"         🎾 Contient des données de matchs!")
    else:
        print(f"  [{status}] {ep} → vide/erreur")
    time.sleep(0.4)

# ─────────────────────────────────────────────────────────────
# STEP 3: Endpoints historique de matchs pour un tournoi
# ─────────────────────────────────────────────────────────────
section("STEP 3 — Endpoints historique matchs par tournoi")

tourn_endpoints = [
    f"{EVSTAT}/en/services-api/SiteService/TournResults?tournId={ATP_TOURN_ID}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/TournHistory?tournId={ATP_TOURN_ID}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/TournMatches?tournId={ATP_TOURN_ID}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/TournMatchHistory?tournId={ATP_TOURN_ID}&ln=en&partner=0&geo=1",
    f"{EVSTAT}/en/services-api/SiteService/TournSeasonInfo?tournamentId={ATP_TOURN_ID}&sId=4&ln=en&partner=0&geo=1",
    # Avec saison spécifique
    f"{EVSTAT}/en/services-api/SiteService/TournSeasonInfo?tournamentId={ATP_TOURN_ID}&sId=4&ln=en&partner=0&geo=1&year=2021",
    f"{EVSTAT}/en/services-api/SiteService/TournSeasonResults?tournId={ATP_TOURN_ID}&year=2021&ln=en&partner=0&geo=1",
]

for url in tourn_endpoints:
    status, data = jget(url)
    ep = url.split("SiteService/")[1].split("?")[0]
    if isinstance(data, dict) and data:
        keys = list(data.keys())
        sz = len(json.dumps(data))
        print(f"  [{status}] {ep} → keys={keys} size={sz}b")
    else:
        print(f"  [{status}] {ep} → vide/erreur")
    time.sleep(0.4)

# ─────────────────────────────────────────────────────────────
# STEP 4: Cherche dans le HTML de la page "results" de tournoi
# ─────────────────────────────────────────────────────────────
section("STEP 4 — Page résultats tournoi EventsStat (HTML/SSR)")

html_urls = [
    f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/results",
    f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/results/d.2021.08.09",
    f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/results?year=2021",
    f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/schedule",
    f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/schedule/d.2021.08.09",
]

for url in html_urls:
    status, html = get_raw(url)
    path = url.replace(EVSTAT, "")
    if status == 200 and html:
        # Check for NUXT data or match data
        has_nuxt = "__NUXT__" in html or "__NUXT_DATA__" in html
        has_match = bool(re.search(r'djokovic|federer|nadal|score|result', html.lower()))
        sz = len(html)
        print(f"  [{status}] {path} → size={sz}b nuxt={has_nuxt} matchData={has_match}")
    else:
        print(f"  [{status}] {path}")
    time.sleep(0.4)

# ─────────────────────────────────────────────────────────────
# STEP 5: API patterns alternatifs (guesses)
# ─────────────────────────────────────────────────────────────
section("STEP 5 — Autres endpoints SiteService")

misc_endpoints = [
    "MatchInfo", "MatchList", "GameList", "GameResults",
    "SportEvents", "TournamentEvents", "MatchStats",
    "H2H", "HeadToHead", "MatchesH2H",
]

for ep in misc_endpoints:
    url = f"{EVSTAT}/en/services-api/SiteService/{ep}?sId=4&ln=en&partner=0&geo=1"
    status, _ = jget(url)
    print(f"  [{status}] {ep}")
    time.sleep(0.2)
