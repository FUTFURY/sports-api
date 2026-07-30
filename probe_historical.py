#!/usr/bin/env python3
"""
probe_historical.py
====================
Teste tous les patterns possibles pour récupérer des données historiques sur
EventsStat et 1xBet (rankings passés, matchs passés, résultats par date).

Usage: python3 probe_historical.py
"""

import urllib.request
import urllib.parse
import json
import re
import gzip
import time
import sys

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
ATP_TOURN_ID   = "5b19067ef87e5825813fb409"
WTA_TOURN_ID   = "5b19057ef87e5825813dc074"
TEST_DATE_DOTS = "2021.08.09"           # format d.YYYY.MM.DD dans les URL 1xbet
TEST_DATE_DASH = "2021-08-09"
TEST_DATE_OLD  = "2016.01.04"           # très ancienne date

BASE_1XBET  = "https://1x-bet.mobi"    # miroir stable hors géo-blocage
BASE_EVSTAT = "https://eventsstat.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0.0.0 Safari/537.36",
    "Accept":          "application/json, text/html, */*",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Referer":         "https://eventsstat.com/",
}

TIMEOUT = 12

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def get(url, extra_headers=None):
    """HTTP GET → (status_code, body_str)"""
    h = {**HEADERS, **(extra_headers or {})}
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            raw = r.read()
            if r.info().get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            return r.status, raw.decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)

def jget(url, extra_headers=None):
    """HTTP GET → dict (JSON parse)"""
    status, body = get(url, extra_headers)
    if status == 200 and body:
        try:
            return status, json.loads(body)
        except Exception:
            return status, {}
    return status, {}

def extract_nuxt(html):
    """Extrait window.__NUXT__ du HTML d'une page EventsStat (SSR Nuxt)."""
    m = re.search(r'window\.__NUXT__\s*=\s*(\{.*?\});\s*</script>', html, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    # Essai alternative: JSON dans ssrContext
    m2 = re.search(r'__NUXT_DATA__\s*=\s*(\[.*?\])\s*;', html, re.DOTALL)
    if m2:
        try:
            return json.loads(m2.group(1))
        except Exception:
            pass
    return None

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def show(label, status, data):
    if isinstance(data, dict):
        keys = list(data.keys())
        size = len(json.dumps(data))
        print(f"  [{status}] {label}")
        print(f"         → keys={keys}  size={size}b")
        # Cherche un changement de joueur (ex: Sinner vs Djokovic)
        dump = json.dumps(data)
        if "Djokovic" in dump or "djokovic" in dump.lower():
            print("         ✅ DJOKOVIC TROUVÉ → données historiques correctes!")
        elif "Sinner" in dump or "sinner" in dump.lower():
            print("         ⚠️  Sinner trouvé → données actuelles (pas historiques)")
        return size
    else:
        print(f"  [{status}] {label}")
        print(f"         → {str(data)[:120]}")
        return 0

# ─────────────────────────────────────────────────────────────
# TEST 1 : RatingDetailedNewBySelectors avec différents params date
# ─────────────────────────────────────────────────────────────
section("TEST 1 — RatingDetailedNewBySelectors (formats date)")

RATING_BASE = f"{BASE_EVSTAT}/en/services-api/SiteService/RatingDetailedNewBySelectors"

date_params = [
    ("ratingDate",  TEST_DATE_DOTS),
    ("ratingDate",  TEST_DATE_DASH),
    ("ratingDate",  TEST_DATE_DOTS.replace(".", "-")),
    ("date",        TEST_DATE_DOTS),
    ("date",        TEST_DATE_DASH),
    ("d",           TEST_DATE_DOTS),
    ("d",           TEST_DATE_DASH),
    ("periodDate",  TEST_DATE_DOTS),
    ("weekDate",    TEST_DATE_DOTS),
    ("ratingDate",  TEST_DATE_OLD),
]

best_size = 0
best_url  = None
for param, val in date_params:
    url = (f"{RATING_BASE}?tournId={ATP_TOURN_ID}"
           f"&recLimit=l.100&ln=fr&partner=0&geo=1"
           f"&{param}={urllib.parse.quote(val)}")
    status, data = jget(url)
    sz = show(f"{param}={val}", status, data)
    if sz > best_size:
        best_size = sz
        best_url  = url
    time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# TEST 2 : RatingDetailedNew (sans Selectors)
# ─────────────────────────────────────────────────────────────
section("TEST 2 — RatingDetailedNew (endpoint alternatif)")

RATING_BASE2 = f"{BASE_EVSTAT}/en/services-api/SiteService/RatingDetailedNew"
for param, val in [("ratingDate", TEST_DATE_DOTS), ("date", TEST_DATE_DOTS)]:
    url = (f"{RATING_BASE2}?tournId={ATP_TOURN_ID}"
           f"&recLimit=l.100&ln=fr&partner=0&geo=1"
           f"&{param}={urllib.parse.quote(val)}")
    status, data = jget(url)
    show(f"RatingDetailedNew?{param}={val}", status, data)
    time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# TEST 3 : Page SSR Nuxt EventsStat avec date dans le PATH
# ─────────────────────────────────────────────────────────────
section("TEST 3 — Page SSR Nuxt (date dans le path)")

nuxt_urls = [
    f"{BASE_EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/ratings",
    f"{BASE_EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/ratings/d.{TEST_DATE_DOTS}",
    f"{BASE_EVSTAT}/en/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/d.{TEST_DATE_DOTS}/ratings",
    f"{BASE_EVSTAT}/fr/statisticpopup/tournament/tennis/{ATP_TOURN_ID}/ratings/d.{TEST_DATE_DOTS}",
]

for url in nuxt_urls:
    status, html = get(url)
    nuxt = extract_nuxt(html) if html else None
    if nuxt:
        dump = json.dumps(nuxt)
        has_djok = "Djokovic" in dump or "djokovic" in dump.lower()
        has_sinner = "Sinner" in dump
        print(f"  [{status}] {url.split(BASE_EVSTAT)[1]}")
        print(f"         → __NUXT__ trouvé  size={len(dump)}b  "
              f"Djokovic={'✅' if has_djok else '❌'}  Sinner={'⚠️' if has_sinner else '❌'}")
    else:
        snippet = html[:200].replace('\n','') if html else "NO BODY"
        print(f"  [{status}] {url.split(BASE_EVSTAT)[1]}")
        print(f"         → Pas de __NUXT__  snippet={snippet[:100]}")
    time.sleep(0.5)

# ─────────────────────────────────────────────────────────────
# TEST 4 : GetResults / matchs historiques par date via 1xBet
# ─────────────────────────────────────────────────────────────
section("TEST 4 — 1xBet Results API (matchs historiques par date)")

# Convert date to timestamps
import calendar
y, m, d = 2021, 8, 9
ts_from = int(calendar.timegm((y, m, d, 21, 0, 0))) - 86400  # 21h UTC veille
ts_to   = ts_from + 86400

BFF_HEADERS = {
    "x-app-n":        "__RESULTS_FRONTEND__",
    "x-requested-with": "XMLHttpRequest",
    "x-svc-source":   "__RESULTS_FRONTEND__",
    "Referer":        "https://1xbet.com/en/results",
    "Accept":         "application/json",
}

result_urls = [
    # Résultats foot (sportId=1) ce jour-là
    (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
     f"?dateFrom={ts_from}&dateTo={ts_to}&lng=fr&ref=1&sportIds=1",
     "champs football 2021-08-09"),
    # Résultats tennis (sportId=4)
    (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
     f"?dateFrom={ts_from}&dateTo={ts_to}&lng=fr&ref=1&sportIds=4",
     "champs tennis 2021-08-09"),
    # Vieux — 2016
    (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
     f"?dateFrom={int(calendar.timegm((2016,1,3,21,0,0)))}"
     f"&dateTo={int(calendar.timegm((2016,1,4,21,0,0)))}"
     f"&lng=fr&ref=1&sportIds=4",
     "champs tennis 2016-01-04"),
]

for url, label in result_urls:
    status, data = jget(url, BFF_HEADERS)
    items = data.get("items", []) if isinstance(data, dict) else []
    print(f"  [{status}] {label}")
    print(f"         → {len(items)} championnats trouvés")
    if items:
        print(f"         → ex: {items[0].get('name','?')} (id={items[0].get('id','?')})")
    time.sleep(0.4)

# ─────────────────────────────────────────────────────────────
# TEST 5 : GetPastMatches 10 ans en arrière (calendrier Rugby, Golf…)
# ─────────────────────────────────────────────────────────────
section("TEST 5 — LineFeed résultats sport 10 ans (rugby=40, golf=109)")

old_year_pairs = [
    (2016, 3, 15),  # rugby six nations probablement
    (2019, 4, 7),   # masters golf Augusta
    (2014, 7, 5),   # tour de france
]

sport_ids = {
    40:  "Rugby",
    109: "Golf",
    2:   "Hockey",
    3:   "Basketball",
    5:   "Football US",
}

for yr, mo, dy in old_year_pairs[:1]:   # 1 date suffit pour tester
    ts_f = int(calendar.timegm((yr, mo, dy, 21, 0, 0))) - 86400
    ts_t = ts_f + 86400
    for sid, sname in sport_ids.items():
        url = (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
               f"?dateFrom={ts_f}&dateTo={ts_t}&lng=fr&ref=1&sportIds={sid}")
        status, data = jget(url, BFF_HEADERS)
        items = data.get("items", []) if isinstance(data, dict) else []
        print(f"  [{status}] {sname} {yr}-{mo:02d}-{dy:02d} → {len(items)} champs")
        time.sleep(0.2)

# ─────────────────────────────────────────────────────────────
# TEST 6 : TournSeasonInfo avec paramètre date
# ─────────────────────────────────────────────────────────────
section("TEST 6 — TournSeasonInfo (historique saison)")

tourn_urls = [
    (f"{BASE_EVSTAT}/en/services-api/SiteService/TournSeasonInfo"
     f"?tournamentId={ATP_TOURN_ID}&sId=4&ln=fr&partner=0&geo=1"
     f"&year=2021",
     "year=2021"),
    (f"{BASE_EVSTAT}/en/services-api/SiteService/TournSeasonInfo"
     f"?tournamentId={ATP_TOURN_ID}&sId=4&ln=fr&partner=0&geo=1"
     f"&season=2021",
     "season=2021"),
]

for url, label in tourn_urls:
    status, data = jget(url)
    show(label, status, data)
    time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# TEST 7 : EventsStat TournamentsList pour avoir les saisons dispo
# ─────────────────────────────────────────────────────────────
section("TEST 7 — TournamentsList (liste des saisons disponibles)")

url = (f"{BASE_EVSTAT}/en/services-api/SiteService/TournamentsList"
       f"?sId=4&ln=fr&partner=0&geo=1")
status, data = jget(url)
if isinstance(data, dict) and data:
    dump = json.dumps(data)
    print(f"  [{status}] TournamentsList → size={len(dump)}b")
    # Cherche l'ATP dans la liste
    if ATP_TOURN_ID in dump:
        print(f"         ✅ ATP tournId trouvé dans la liste")
    # Affiche un sample
    t = data.get("T", {})
    if t:
        sample = list(t.items())[:3]
        for k, v in sample:
            print(f"         → T[{k}] = {str(v)[:80]}")
else:
    print(f"  [{status}] Vide ou erreur")

# ─────────────────────────────────────────────────────────────
# RÉSUMÉ
# ─────────────────────────────────────────────────────────────
section("RÉSUMÉ")
print("""
Critères de succès :
  ✅ Djokovic dans rankings → endpoint historique fonctionnel
  ✅ len(items) > 0        → résultats passés trouvés
  
Next steps selon résultats :
  → Si TEST 1 renvoit Djokovic : on a le bon param, on l'intègre dans scrape_all.py
  → Si TEST 3 renvoit Nuxt avec Djokovic : on parse le SSR HTML
  → Si TEST 4/5 marchent : on a matchs historiques sur N années
""")
