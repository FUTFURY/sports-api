#!/usr/bin/env python3
"""
probe_deep.py
==============
1. Extrait le vrai pattern NUXT 3 (__NUXT_DATA__) des pages /results
2. Explore complètement PlayerDetailed (upcoming matches)
3. Teste le calendrier étendu par sport
"""

import urllib.request
import urllib.error
import json
import gzip
import re
import time
import datetime
import calendar as cal

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
        try: body = e.read().decode("utf-8", errors="ignore")
        except: body = ""
        return e.code, body
    except Exception as e:
        return 0, str(e)

def jget(url, extra=None):
    s, b = get_raw(url, extra)
    try:
        return s, json.loads(b) if b else {}
    except:
        return s, {}

def section(t):
    print(f"\n{'='*65}\n  {t}\n{'='*65}")

# ─────────────────────────────────────────────────────────────
# 1. Analyse du HTML brut de /results?year=2021
# ─────────────────────────────────────────────────────────────
section("1 — Analyse HTML brut /results?year=2021")

url = f"{EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/results?year=2021"
status, html = get_raw(url)
print(f"  [{status}] size={len(html)}b")

# Cherche tous les patterns de data injection Nuxt
patterns = {
    "__NUXT__":             r'window\.__NUXT__\s*=\s*',
    "__NUXT_DATA__":        r'<script[^>]*id=["\']__NUXT_DATA__["\']',
    "nuxt-data inline":     r'data-nuxt-data',
    "useNuxtApp":           r'useNuxtApp',
    "window.__data__":      r'window\.__data__\s*=',
    "window.__state__":     r'window\.__state__\s*=',
    "script application":   r'<script\s+type=["\']application/json["\']',
    "script ld+json":       r'<script\s+type=["\']application/ld\+json["\']',
    "data-initial-state":   r'data-initial-state',
}

for name, pattern in patterns.items():
    found = bool(re.search(pattern, html, re.IGNORECASE))
    if found:
        # Extrait un snippet
        m = re.search(pattern, html, re.IGNORECASE)
        idx = m.start()
        print(f"  ✅ {name:30s} → {html[idx:idx+150].replace(chr(10), ' ')[:120]}")
    else:
        print(f"  ❌ {name}")

# Cherche spécifiquement __NUXT_DATA__ script tag
m = re.search(r'<script[^>]*id=["\']__NUXT_DATA__["\'][^>]*>(.*?)</script>', html, re.DOTALL)
if m:
    content = m.group(1)
    print(f"\n  __NUXT_DATA__ content ({len(content)}b):")
    print(f"  {content[:500]}")

# Cherche les noms de joueurs dans le HTML
for name in ["Djokovic", "Federer", "Nadal", "Alcaraz"]:
    idx = html.lower().find(name.lower())
    if idx >= 0:
        print(f"\n  {name} dans HTML: ...{html[max(0,idx-30):idx+80]}...")

# ─────────────────────────────────────────────────────────────
# 2. PlayerDetailed — exploration complète du tableau F (matchs)
# ─────────────────────────────────────────────────────────────
section("2 — PlayerDetailed : exploration de F (matchs)")

url = (f"{EVSTAT}/en/services-api/SiteService/PlayerDetailed"
       f"?playerId={DJOKOVIC_ID}&ln=fr&partner=0&geo=1")
status, data = jget(url)

if data:
    print(f"  [{status}] PlayerDetailed keys={list(data.keys())}")
    print(f"  Age (A)        = {data.get('A')}")
    if data.get('B'):
        bday = datetime.datetime.fromtimestamp(data['B'])
        print(f"  Naissance (B)  = {bday.strftime('%Y-%m-%d')}")
    
    # Tableau F = matches/events
    f_array = data.get('F', [])
    print(f"\n  F (matchs) = {len(f_array)} entrées")
    for i, match in enumerate(f_array[:5]):
        print(f"\n  --- Match {i+1} ---")
        # Date
        d_ts = match.get('D', 0)
        if d_ts:
            match_dt = datetime.datetime.fromtimestamp(d_ts)
            print(f"    Date: {match_dt.strftime('%Y-%m-%d %H:%M')}")
        # Joueur A (home)
        a_data = match.get('A', {})
        h_data = match.get('H', {})
        if isinstance(a_data, dict):
            print(f"    Joueur A: {a_data.get('T', '?')} (id={a_data.get('I','?')[:15]})")
        if isinstance(h_data, dict):
            print(f"    Joueur H: {h_data.get('T', '?')} (id={h_data.get('I','?')[:15]})")
        # Score
        score_keys = {k: v for k, v in match.items() if k not in ['A', 'H', 'D', 'CI', 'GI']}
        print(f"    Autres clés: {score_keys}")
    
    # Autres clés de data
    other_keys = {k: v for k, v in data.items() if k not in ['F', 'A', 'B']}
    print(f"\n  Autres données: {json.dumps(other_keys, ensure_ascii=False)[:300]}")

# ─────────────────────────────────────────────────────────────
# 3. Test PlayerDetailed avec stats historiques (year param)
# ─────────────────────────────────────────────────────────────
section("3 — PlayerDetailed avec year/season param")

for param in [f"year=2021", f"season=2021", f"y=2021", f"from=2021-01-01"]:
    url = (f"{EVSTAT}/en/services-api/SiteService/PlayerDetailed"
           f"?playerId={DJOKOVIC_ID}&ln=fr&partner=0&geo=1&{param}")
    status, data = jget(url)
    f_arr = data.get("F", []) if isinstance(data, dict) else []
    if f_arr:
        dates = []
        for m in f_arr:
            if m.get("D"):
                dates.append(datetime.datetime.fromtimestamp(m["D"]).strftime("%Y-%m-%d"))
        print(f"  [{status}] {param:25s} → {len(f_arr)} matchs  dates={dates[:3]}")
    else:
        print(f"  [{status}] {param:25s} → 0 matchs")
    time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# 4. Calendrier 1xBet étendu (count=5000 + tsTo loin)
# ─────────────────────────────────────────────────────────────
section("4 — Calendrier 1xBet étendu par sport")

today_ts = int(datetime.datetime.now().timestamp())
far_ts   = today_ts + 365 * 86400  # 1 an dans le futur

line_headers = {
    "User-Agent": HEADERS["User-Agent"],
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sa.1xbet.com/fr/line",
}

# Test avec count élevé et tsTo dans le futur
for sid, sname in [(1, "Football"), (4, "Tennis"), (40, "Rugby"), (109, "Golf"), (2, "Hockey"), (66, "Cyclisme")]:
    url = (f"https://sa.1xbet.com/service-api/LineFeed/Get1x2_VZip"
           f"?sports={sid}&count=500&lng=fr&mode=4&country=158&getEmpty=true"
           f"&tsFrom={today_ts}&tsTo={far_ts}")
    req = urllib.request.Request(url, headers=line_headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            raw = r.read()
            data = json.loads(raw.decode("utf-8", errors="ignore"))
            events = data.get("Value", [])
            dates = sorted([e.get("S", 0) for e in events if isinstance(e, dict) and e.get("S")])
            if dates:
                min_dt = datetime.datetime.fromtimestamp(dates[0]).strftime("%Y-%m-%d")
                max_dt = datetime.datetime.fromtimestamp(dates[-1]).strftime("%Y-%m-%d")
                print(f"  [200] {sname:12s} → {len(events):4d} events  {min_dt} → {max_dt}")
            else:
                print(f"  [200] {sname:12s} → {len(events):4d} events")
    except Exception as e:
        print(f"  [ERR] {sname:12s} → {e}")
    time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# 5. Results API — quelle est la fenêtre max rétrospective ?
# ─────────────────────────────────────────────────────────────
section("5 — Results API : fenêtre max rétrospective (binary search)")

bff_headers = {
    "User-Agent": HEADERS["User-Agent"],
    "x-app-n":          "__RESULTS_FRONTEND__",
    "x-requested-with": "XMLHttpRequest",
    "x-svc-source":     "__RESULTS_FRONTEND__",
    "Referer":          "https://sa.1xbet.com/en/results",
    "Accept":           "application/json",
    "Cookie":           "SESSION=80016c4acd5f2d7df457a551ba7acd14",
}

def test_results_date(dt):
    ts_from = int(cal.timegm(dt.timetuple()))
    ts_to   = ts_from + 86400
    url = (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
           f"?dateFrom={ts_from}&dateTo={ts_to}&lng=fr&ref=1&sportIds=4")
    req = urllib.request.Request(url, headers=bff_headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode("utf-8", errors="ignore"))
            items = data.get("items", [])
            return True, len(items)
    except urllib.error.HTTPError as e:
        return False, e.code
    except Exception as e:
        return False, str(e)

# Test plusieurs dates pour trouver la limite
test_dates = [
    datetime.date(2026, 7, 7),   # hier
    datetime.date(2026, 6, 1),   # 1 mois
    datetime.date(2026, 1, 1),   # 6 mois
    datetime.date(2025, 7, 1),   # 1 an
    datetime.date(2025, 1, 1),   # 1.5 ans
    datetime.date(2024, 1, 1),   # 2.5 ans
    datetime.date(2023, 1, 1),   # 3.5 ans
    datetime.date(2022, 1, 1),   # 4.5 ans
]

for dt in test_dates:
    ok, result = test_results_date(dt)
    status_str = f"✅ {result} champs" if ok else f"❌ HTTP {result}"
    print(f"  {dt}  →  {status_str}")
    time.sleep(0.3)
