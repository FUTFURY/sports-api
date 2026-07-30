#!/usr/bin/env python3
"""
probe_nuxt_results.py
======================
Extrait les données historiques depuis :
  1. /results?year=YYYY   → résultats tournoi par année
  2. HeadToHead            → confrontations directes
  3. PlayerDetailed        → stats joueur
  4. TournSeasonInfo       → info saison
"""

import urllib.request
import urllib.error
import json
import gzip
import re
import time

EVSTAT       = "https://eventsstat.com"
ATP_TOURN_ID = "5b19067ef87e5825813fb409"
DJOKOVIC_ID  = "5ab2f3a0494765f3ca3ab85a"

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"),
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
        body = ""
        try: body = e.read().decode("utf-8", errors="ignore")
        except: pass
        return e.code, body
    except Exception as e:
        return 0, str(e)

def jget(url, extra=None):
    s, b = get_raw(url, extra)
    try:
        return s, json.loads(b) if b else {}
    except:
        return s, {}

def extract_nuxt(html):
    """Extrait window.__NUXT__ du HTML SSR Nuxt."""
    # Cherche le pattern __NUXT__ = {...}
    m = re.search(r'window\.__NUXT__\s*=\s*(\{.*\})\s*(?:</script>|;?\s*$)', html, re.DOTALL)
    if m:
        raw = m.group(1).strip().rstrip(';')
        try:
            return json.loads(raw)
        except Exception as e:
            # Essaie de corriger les JSON JS-style (undefined, etc.)
            fixed = re.sub(r'\bundefined\b', 'null', raw)
            fixed = re.sub(r'\bNaN\b', 'null', fixed)
            try:
                return json.loads(fixed)
            except:
                return {"parse_error": str(e), "raw_len": len(raw)}
    return None

def section(t):
    print(f"\n{'='*65}\n  {t}\n{'='*65}")

# ─────────────────────────────────────────────────────────────
# SECTION 1: /results?year=YYYY — résultats annuels tournoi
# ─────────────────────────────────────────────────────────────
section("1 — /results?year=YYYY (résultats annuels)")

for year in [2024, 2021, 2019, 2016]:
    url = f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/results?year={year}"
    status, html = get_raw(url)
    if status != 200:
        print(f"  [{status}] year={year}")
        continue

    nuxt = extract_nuxt(html)
    if not nuxt:
        print(f"  [{status}] year={year} → Pas de __NUXT__")
        continue

    dump = json.dumps(nuxt, ensure_ascii=False)
    # Cherche des noms de joueurs connus
    players_found = []
    for name in ["Djokovic", "Federer", "Nadal", "Alcaraz", "Sinner", "Murray"]:
        if name.lower() in dump.lower():
            players_found.append(name)

    print(f"  [{status}] year={year} → size={len(dump)}b  joueurs={players_found}")

    # Affiche la structure de nuxt
    if isinstance(nuxt, dict):
        print(f"           keys={list(nuxt.keys())}")
        # Cherche la clé avec les données (souvent 'data' ou 'state')
        for k in ["data", "state", "fetch", "asyncData"]:
            if k in nuxt and nuxt[k]:
                val = nuxt[k]
                print(f"           {k}={str(val)[:200]}")
    time.sleep(0.5)

# ─────────────────────────────────────────────────────────────
# SECTION 2: HeadToHead endpoint
# ─────────────────────────────────────────────────────────────
section("2 — HeadToHead endpoint")

# D'abord voir ce que retourne HeadToHead sans params
base_url = f"{EVSTAT}/en/services-api/SiteService/HeadToHead"
for params in [
    "",
    f"?player1Id={DJOKOVIC_ID}&ln=en&partner=0&geo=1",
    f"?p1={DJOKOVIC_ID}&ln=en&partner=0&geo=1",
    f"?sId=4&tournId={ATP_TOURN_ID}&ln=en&partner=0&geo=1",
    f"?gameId=12345&ln=en&partner=0&geo=1",
]:
    url = base_url + params
    status, data = jget(url)
    if isinstance(data, dict) and data:
        print(f"  [{status}] HeadToHead{params[:60]} → keys={list(data.keys())} size={len(json.dumps(data))}b")
    else:
        print(f"  [{status}] HeadToHead{params[:60]} → vide")
    time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# SECTION 3: PlayerDetailed — analyse complète
# ─────────────────────────────────────────────────────────────
section("3 — PlayerDetailed complet pour Djokovic")

url = (f"{EVSTAT}/en/services-api/SiteService/PlayerDetailed"
       f"?playerId={DJOKOVIC_ID}&ln=fr&partner=0&geo=1")
status, data = jget(url)
print(f"  [{status}] PlayerDetailed → {json.dumps(data, ensure_ascii=False)[:500]}")
time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# SECTION 4: TournSeasonInfo — analyse des clés G, LG, FG
# ─────────────────────────────────────────────────────────────
section("4 — TournSeasonInfo analyse complète")

url = (f"{EVSTAT}/en/services-api/SiteService/TournSeasonInfo"
       f"?tournamentId={ATP_TOURN_ID}&sId=4&ln=fr&partner=0&geo=1")
status, data = jget(url)
print(f"  [{status}] TournSeasonInfo → {json.dumps(data, ensure_ascii=False, indent=2)}")
time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# SECTION 5: Cherche les matchs via la page "schedule"
# ─────────────────────────────────────────────────────────────
section("5 — /schedule (calendrier prochain) — NUXT extraction")

url = f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/schedule"
status, html = get_raw(url)
nuxt = extract_nuxt(html) if html else None
if nuxt:
    dump = json.dumps(nuxt, ensure_ascii=False)
    print(f"  [{status}] schedule → size={len(dump)}b")
    # Affiche les 2 premiers niveaux de structure
    if isinstance(nuxt, dict):
        for k, v in list(nuxt.items())[:6]:
            print(f"    {k}: {str(v)[:120]}")
else:
    print(f"  [{status}] schedule → pas de __NUXT__")
time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# SECTION 6: Cherche via la page principale d'un joueur sur EvtsStat
# ─────────────────────────────────────────────────────────────
section("6 — Page HTML joueur (Player profile)")

player_html_urls = [
    f"{EVSTAT}/en/statisticpopup/player/{DJOKOVIC_ID}",
    f"{EVSTAT}/en/statisticpopup/player/tennis/{DJOKOVIC_ID}",
    f"{EVSTAT}/en/statisticpopup/player/{DJOKOVIC_ID}/matches",
    f"{EVSTAT}/en/statisticpopup/player/{DJOKOVIC_ID}/history",
]

for url in player_html_urls:
    status, html = get_raw(url)
    nuxt = extract_nuxt(html) if html else None
    path = url.replace(EVSTAT, "")
    if nuxt:
        dump = json.dumps(nuxt, ensure_ascii=False)
        players = [n for n in ["Djokovic", "Federer", "Nadal", "Sinner"] if n.lower() in dump.lower()]
        print(f"  [{status}] {path} → NUXT size={len(dump)}b  names={players}")
    else:
        print(f"  [{status}] {path} → {'pas de NUXT' if html else 'pas de body'}")
    time.sleep(0.4)

# ─────────────────────────────────────────────────────────────
# SECTION 7: API calendrier 1xBet (matchs futurs)
# ─────────────────────────────────────────────────────────────
section("7 — API calendrier 1xBet (saisons/calendriers futurs)")

import calendar as cal
import datetime

# Calendrier saison actuelle et à venir
today = datetime.date.today()
ts_from = int(cal.timegm(today.timetuple()))
ts_to   = ts_from + 30 * 86400  # 30 jours dans le futur

for sid, sname in [(4, "Tennis"), (1, "Football"), (40, "Rugby"), (109, "Golf")]:
    url = (f"https://sa.1xbet.com/service-api/LineFeed/Get1x2_VZip"
           f"?sports={sid}&count=500&lng=fr&mode=4&country=158&getEmpty=true")
    req = urllib.request.Request(url, headers={
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://sa.1xbet.com/fr/line",
    })
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            raw = r.read()
            data = json.loads(raw.decode("utf-8", errors="ignore"))
            events = data.get("Value", [])
            print(f"  [200] {sname} → {len(events)} events dans le calendrier")
            # Affiche les dates min/max
            dates = [e.get("S", 0) for e in events if isinstance(e, dict) and e.get("S")]
            if dates:
                min_ts = min(dates)
                max_ts = max(dates)
                min_dt = datetime.datetime.fromtimestamp(min_ts).strftime("%Y-%m-%d")
                max_dt = datetime.datetime.fromtimestamp(max_ts).strftime("%Y-%m-%d")
                print(f"           dates: {min_dt} → {max_dt}")
    except Exception as e:
        print(f"  [ERR] {sname} → {e}")
    time.sleep(0.3)
