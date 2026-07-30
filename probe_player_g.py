#!/usr/bin/env python3
"""
probe_player_g.py
==================
Explore le tableau G (matchs passés) de PlayerDetailed
et cherche la fenêtre exacte du Results API.
"""

import urllib.request
import urllib.error
import json
import gzip
import re
import time
import datetime
import calendar as cal

EVSTAT      = "https://eventsstat.com"
DJOKOVIC_ID = "5ab2f3a0494765f3ca3ab85a"

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"),
    "Accept":          "application/json, text/html, */*",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Referer":         "https://eventsstat.com/",
}

BFF = {
    **HEADERS,
    "x-app-n":          "__RESULTS_FRONTEND__",
    "x-requested-with": "XMLHttpRequest",
    "x-svc-source":     "__RESULTS_FRONTEND__",
    "Referer":          "https://sa.1xbet.com/en/results",
    "Cookie":           "SESSION=80016c4acd5f2d7df457a551ba7acd14",
}

def get_raw(url, h=None):
    req = urllib.request.Request(url, headers={**HEADERS, **(h or {})})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            raw = r.read()
            if r.info().get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            return r.status, raw.decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        try: body = e.read().decode("utf-8", errors="ignore")
        except: body = ""
        return e.code, body
    except Exception as e:
        return 0, str(e)

def jget(url, h=None):
    s, b = get_raw(url, h)
    try:
        return s, json.loads(b) if b else {}
    except:
        return s, {}

def section(t):
    print(f"\n{'='*65}\n  {t}\n{'='*65}")

# ─────────────────────────────────────────────────────────────
# 1. PlayerDetailed — dump complet du tableau G
# ─────────────────────────────────────────────────────────────
section("1 — PlayerDetailed G (historique de matchs)")

url = (f"{EVSTAT}/en/services-api/SiteService/PlayerDetailed"
       f"?playerId={DJOKOVIC_ID}&ln=fr&partner=0&geo=1")
status, data = jget(url)

if isinstance(data, dict):
    g_array = data.get("G", [])
    print(f"  G = {len(g_array)} matchs passés")

    if g_array:
        # Dates de tous les matchs
        dates = []
        for m in g_array:
            d = m.get("D", 0)
            if d:
                dates.append(datetime.datetime.fromtimestamp(d))
        
        if dates:
            print(f"  Période : {min(dates).strftime('%Y-%m-%d')} → {max(dates).strftime('%Y-%m-%d')}")

        # Détail des 5 premiers
        for i, match in enumerate(g_array[:5]):
            d_ts = match.get("D", 0)
            dt_str = datetime.datetime.fromtimestamp(d_ts).strftime("%Y-%m-%d") if d_ts else "?"
            a = match.get("A", {})
            h = match.get("H", {})
            s1, s2 = match.get("S1", "?"), match.get("S2", "?")
            w = match.get("W", "?")
            tourn = match.get("S", {}).get("N", "?") if isinstance(match.get("S"), dict) else "?"
            a_name = a.get("T", "?") if isinstance(a, dict) else "?"
            h_name = h.get("T", "?") if isinstance(h, dict) else "?"
            print(f"\n  [{i+1}] {dt_str} — {tourn}")
            print(f"       {a_name} {s1} - {s2} {h_name}  (W={w})")
            # Sets
            p = match.get("P", [])
            if p:
                sets_str = " | ".join([f"{s.get('S1','?')}-{s.get('S2','?')}" for s in p[:5] if isinstance(s, dict)])
                print(f"       Sets: {sets_str}")

    # Autres clés intéressantes
    print(f"\n  Toutes les clés: {list(data.keys())}")
    for k in ["HM", "KS", "PB", "PM", "PS", "TA", "TS", "WK"]:
        if k in data:
            print(f"  {k} = {str(data[k])[:200]}")

# ─────────────────────────────────────────────────────────────
# 2. Results API — binary search précis de la limite
# ─────────────────────────────────────────────────────────────
section("2 — Results API : limite exacte (binary search)")

def test_results(dt):
    ts_from = int(cal.timegm(dt.timetuple()))
    ts_to   = ts_from + 86400
    url = (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
           f"?dateFrom={ts_from}&dateTo={ts_to}&lng=fr&ref=1&sportIds=4")
    req = urllib.request.Request(url, headers=BFF)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            d = json.loads(r.read().decode("utf-8", errors="ignore"))
            return True, len(d.get("items", []))
    except urllib.error.HTTPError as e:
        return False, e.code
    except Exception as e:
        return False, str(e)

# Narrow down entre 2024-01 et 2025-07
narrow_dates = [
    datetime.date(2025, 7, 1),
    datetime.date(2025, 4, 1),
    datetime.date(2025, 1, 1),
    datetime.date(2024, 10, 1),
    datetime.date(2024, 7, 1),
    datetime.date(2024, 6, 1),
    datetime.date(2024, 5, 1),
    datetime.date(2024, 4, 1),
    datetime.date(2024, 3, 1),
    datetime.date(2024, 2, 1),
    datetime.date(2024, 1, 1),
]

limit_date = None
for dt in narrow_dates:
    ok, res = test_results(dt)
    sym = "✅" if ok else "❌"
    print(f"  {sym} {dt} → {res}")
    if ok and limit_date is None:
        pass
    if not ok and limit_date is None:
        limit_date = narrow_dates[narrow_dates.index(dt) - 1] if narrow_dates.index(dt) > 0 else dt
    time.sleep(0.3)

if limit_date:
    print(f"\n  📌 Limite approximative : >= {limit_date}")

# ─────────────────────────────────────────────────────────────
# 3. window.__NUXT__ IIFE — extraire via node.js
# ─────────────────────────────────────────────────────────────
section("3 — Extraction __NUXT__ IIFE via regex avancé")

url = (f"{EVSTAT}/en/statisticpopup/tournament/tennis/"
       f"5b19067ef87e5825813fb409/results?year=2021")
status, html = get_raw(url)

# Trouve le bloc __NUXT__ IIFE complet
# Pattern: window.__NUXT__=(function(args){return JSON}(vals))
m = re.search(r'window\.__NUXT__\s*=\s*(function\([^)]*\)\s*\{.*?\}\s*\([^)]*\))', html, re.DOTALL)
if m:
    iife = m.group(1)
    print(f"  IIFE trouvé: {len(iife)}b")
    # Extraire les arguments et valeurs
    # Pattern: function(a,b,c,...){return {...}} (val1, val2, ...)
    fn_match = re.match(r'function\(([^)]*)\)\s*\{return\s+(\{.*\})\}\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)', iife, re.DOTALL)
    if fn_match:
        params = fn_match.group(1).split(',')
        body   = fn_match.group(2)
        vals_str = fn_match.group(3)
        print(f"  Params: {len(params)}  Body: {len(body)}b")
        
        # Parse les valeurs (c'est souvent des primitives séparées par des virgules)
        # Cherche les occurrences de noms de joueurs dans le body
        for name in ["Djokovic", "Federer", "Nadal", "Alcaraz", "Wimbledon", "Roland"]:
            if name in body:
                idx = body.find(name)
                print(f"  ✅ {name}: ...{body[max(0,idx-20):idx+40]}...")
    else:
        # Cherche directement les noms dans le bloc IIFE
        print(f"  IIFE sample: {iife[:300]}")
        for name in ["Djokovic", "Federer", "Wimbledon", "Roland"]:
            if name in iife:
                idx = iife.find(name)
                print(f"  ✅ {name} dans IIFE: ...{iife[max(0,idx-20):idx+50]}...")
else:
    # Cherche juste les noms dans le HTML brut
    print(f"  Pas d'IIFE regex match. Cherche joueurs dans HTML:")
    for name in ["Djokovic", "Federer", "Nadal", "Alcaraz", "Wimbledon", "Roland"]:
        idx = html.lower().find(name.lower())
        if idx >= 0:
            print(f"  ✅ {name}: ...{html[max(0,idx-20):idx+60]}...")
        else:
            print(f"  ❌ {name}")

# ─────────────────────────────────────────────────────────────
# 4. Calendrier via GetChamps (sans filtre date)
# ─────────────────────────────────────────────────────────────
section("4 — GetChamps et GetSports (calendrier complet)")

champs_urls = [
    "https://sa.1xbet.com/service-api/LineFeed/GetChampsZip?sports=4&lng=fr&country=158&partner=0",
    "https://sa.1xbet.com/service-api/LineFeed/GetSportsShortZip?sports=4&lng=fr&country=158",
    "https://sa.1xbet.com/service-api/LiveFeed/GetChampsZip?sports=4&lng=fr&country=158&partner=0",
]

line_headers_simple = {
    "User-Agent": HEADERS["User-Agent"],
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sa.1xbet.com/fr/line",
}

for url in champs_urls:
    req = urllib.request.Request(url, headers=line_headers_simple)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode("utf-8", errors="ignore"))
            val = data.get("Value", data.get("Sports", []))
            print(f"  [200] {url.split('?')[0].split('/')[-1]} → {len(val) if isinstance(val, list) else type(val)} items")
            if isinstance(val, list) and val:
                print(f"         ex: {str(val[0])[:100]}")
    except urllib.error.HTTPError as e:
        print(f"  [{e.code}] {url.split('/')[-1].split('?')[0]}")
    except Exception as e:
        print(f"  [ERR] {str(e)[:60]}")
    time.sleep(0.3)
