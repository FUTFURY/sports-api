#!/usr/bin/env python3
"""
probe_results_api.py
====================
Diagnostique le 400 sur le Results API 1xBet et trouve le bon format de timestamps.
"""

import urllib.request
import urllib.error
import json
import gzip
import time
import calendar
import datetime

BFF_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "x-app-n":          "__RESULTS_FRONTEND__",
    "x-requested-with": "XMLHttpRequest",
    "x-svc-source":     "__RESULTS_FRONTEND__",
    "Referer":          "https://sa.1xbet.com/en/results",
    "Accept":           "application/json, text/plain, */*",
    "Accept-Language":  "fr-FR,fr;q=0.9",
    "Accept-Encoding":  "gzip, deflate",
    "Origin":           "https://sa.1xbet.com",
}

BASES = [
    "https://sa.1xbet.com",
    "https://1xbet.com",
    "https://1x-bet.mobi",
]

def raw_get(url, headers):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            raw = r.read()
            if r.info().get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            body = raw.decode("utf-8", errors="ignore")
            return r.status, body, None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        return e.code, body, str(e)
    except Exception as e:
        return 0, "", str(e)

def section(t):
    print(f"\n{'='*60}\n  {t}\n{'='*60}")

# ─────────────────────────────────────────────────────────────
# Calcul des timestamps — plusieurs stratégies
# ─────────────────────────────────────────────────────────────
section("Calcul des variants de timestamps pour 2021-08-09")

target = datetime.date(2021, 8, 9)
midnight_utc = int(calendar.timegm(target.timetuple()))

variants = {
    "midnight→+24h":       (midnight_utc, midnight_utc + 86400),
    "21h_veille→21h_jour": (midnight_utc - 3*3600, midnight_utc - 3*3600 + 86400),
    "00h→23h59":           (midnight_utc, midnight_utc + 86399),
    "12h_veille→12h_jour": (midnight_utc - 12*3600, midnight_utc + 12*3600),
    "21h_jour→21h_lend":   (midnight_utc + 21*3600, midnight_utc + 21*3600 + 86400),
    # 1xbet serveur en UTC+3 (Moscou) → 21h UTC = 00h Moscow
    "Moscow_00h→00h":      (midnight_utc - 3*3600, midnight_utc - 3*3600 + 86400),
}

for label, (ts_from, ts_to) in variants.items():
    print(f"  {label}: from={ts_from} ({datetime.datetime.utcfromtimestamp(ts_from).isoformat()}Z)"
          f" to={ts_to} ({datetime.datetime.utcfromtimestamp(ts_to).isoformat()}Z)")

# ─────────────────────────────────────────────────────────────
# Test avec différents miroirs + timestamps
# ─────────────────────────────────────────────────────────────
section("Test Results API — différents miroirs")

# D'abord tester avec des timestamps récents (hier) pour valider le miroir
yesterday = datetime.date.today() - datetime.timedelta(days=1)
ts_y_from = int(calendar.timegm(yesterday.timetuple())) - 3*3600
ts_y_to   = ts_y_from + 86400

print(f"\nTest avec hier ({yesterday}) pour valider le miroir :")
for base in BASES:
    url = f"{base}/service-api/result/web/api/v2/champs?dateFrom={ts_y_from}&dateTo={ts_y_to}&lng=fr&ref=1&sportIds=4"
    status, body, err = raw_get(url, BFF_HEADERS)
    snippet = body[:150].replace('\n','') if body else (err or "")
    print(f"  [{status}] {base} → {snippet}")
    time.sleep(0.5)

# ─────────────────────────────────────────────────────────────
# Test endpoint v3 (games) et v1
# ─────────────────────────────────────────────────────────────
section("Test endpoints alternatifs Results")

# Trouver un champId valide pour le tennis
# On va chercher sur l'endpoint live pour récupérer un champId réel
live_url = "https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=4&count=10&lng=fr&mode=4&country=158&getEmpty=true"
status, body, err = raw_get(live_url, {
    "User-Agent": BFF_HEADERS["User-Agent"],
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sa.1xbet.com/en/live/tennis",
})
if status == 200 and body:
    try:
        data = json.loads(body)
        events = data.get("Value", [])[:3]
        print(f"\nLive tennis events: {len(data.get('Value', []))} trouvés")
        for e in events:
            print(f"  ChampId={e.get('CI')}  Champ={e.get('L')}  Match: {e.get('O1')} vs {e.get('O2')}")
    except:
        print(f"  [{status}] Parse error: {body[:100]}")
else:
    print(f"  [{status}] {err or body[:100]}")

# ─────────────────────────────────────────────────────────────
# Test résultats avec paramètre "dateString" ou "day"
# ─────────────────────────────────────────────────────────────
section("Test résultats avec paramètre date string (pas timestamp)")

ts_from = int(calendar.timegm((2021, 8, 9, 0, 0, 0)))
ts_to   = int(calendar.timegm((2021, 8, 9, 23, 59, 59)))

alt_params = [
    f"dateFrom={ts_from}&dateTo={ts_to}&lng=fr&ref=1&sportIds=4",
    f"date=2021-08-09&lng=fr&ref=1&sportIds=4",
    f"dateFrom=2021-08-09&dateTo=2021-08-09&lng=fr&ref=1&sportIds=4",
    f"dateFrom=2021-08-09T00:00:00&dateTo=2021-08-09T23:59:59&lng=fr&ref=1&sportIds=4",
]

for params in alt_params:
    url = f"https://sa.1xbet.com/service-api/result/web/api/v2/champs?{params}"
    status, body, err = raw_get(url, BFF_HEADERS)
    try:
        data = json.loads(body) if body else {}
        items = data.get("items", [])
        print(f"  [{status}] {params[:70]} → {len(items)} items")
        if items:
            print(f"            ex: {items[0].get('name','?')}")
    except:
        print(f"  [{status}] {params[:70]} → {body[:80]}")
    time.sleep(0.3)

# ─────────────────────────────────────────────────────────────
# Test avec timestamp aligné sur 3600 (multiple exact d'une heure)
# ─────────────────────────────────────────────────────────────
section("Test timestamps exactement alignés sur 3600s")

def align(ts):
    return (ts // 3600) * 3600

base_ts = int(calendar.timegm((2021, 8, 9, 0, 0, 0)))
aligned_from = align(base_ts)
aligned_to   = align(base_ts + 86400)

print(f"  aligned_from={aligned_from} ({datetime.datetime.utcfromtimestamp(aligned_from).isoformat()}Z)")
print(f"  aligned_to  ={aligned_to}   ({datetime.datetime.utcfromtimestamp(aligned_to).isoformat()}Z)")

url = (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
       f"?dateFrom={aligned_from}&dateTo={aligned_to}&lng=fr&ref=1&sportIds=4")
status, body, err = raw_get(url, BFF_HEADERS)
try:
    data = json.loads(body) if body else {}
    items = data.get("items", [])
    print(f"  [{status}] aligned timestamps → {len(items)} champs")
    for it in items[:5]:
        print(f"      → {it.get('name','?')} (id={it.get('id','?')})")
except:
    print(f"  [{status}] {body[:150]}")

# Test aussi avec BFF_HEADERS + cookie
print("\n  Avec cookie SESSION :")
hdr_cookie = {**BFF_HEADERS, "Cookie": "SESSION=80016c4acd5f2d7df457a551ba7acd14"}
status, body, err = raw_get(url, hdr_cookie)
try:
    data = json.loads(body) if body else {}
    items = data.get("items", [])
    print(f"  [{status}] + cookie → {len(items)} champs")
    for it in items[:5]:
        print(f"      → {it.get('name','?')} (id={it.get('id','?')})")
except:
    print(f"  [{status}] {body[:150]}")

# ─────────────────────────────────────────────────────────────
# Test date récente (hier) pour valider que les timestamps alignés marchent
# ─────────────────────────────────────────────────────────────
section("Validation : hier avec timestamps alignés")

y_ts = int(calendar.timegm(yesterday.timetuple()))
y_from = align(y_ts)
y_to   = align(y_ts + 86400)

for sid, sname in [(4, "Tennis"), (1, "Football"), (3, "Basketball"), (40, "Rugby")]:
    url = (f"https://sa.1xbet.com/service-api/result/web/api/v2/champs"
           f"?dateFrom={y_from}&dateTo={y_to}&lng=fr&ref=1&sportIds={sid}")
    status, body, err = raw_get(url, hdr_cookie)
    try:
        data = json.loads(body) if body else {}
        items = data.get("items", [])
        print(f"  [{status}] {sname} hier → {len(items)} champs")
    except:
        print(f"  [{status}] {sname} → {body[:80]}")
    time.sleep(0.2)
