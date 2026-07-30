#!/usr/bin/env python3
"""
probe_all_sports_history.py
============================
Teste TOUS les sports de allsport.json sur le Results API pour 3 dates :
  - Hier (récent)
  - 2026-01-01 (~6 mois)
  - 2025-01-01 (~18 mois)
  - 2024-06-01 (>18 mois, devrait être 400)

Sortie : tableau résumé par sport.
"""

import json
import urllib.request
import urllib.error
import calendar
import datetime
import time

# ─────────────────────────────────────────────────────────────
ALLSPORT_PATH = "allsport.json"
MIRROR        = "https://sa.1xbet.com"

RESULTS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "x-app-n":          "__RESULTS_FRONTEND__",
    "x-requested-with": "XMLHttpRequest",
    "x-svc-source":     "__RESULTS_FRONTEND__",
    "Origin":           MIRROR,
    "Referer":          f"{MIRROR}/fr/results",
    "Accept":           "application/json",
}

LINE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": f"{MIRROR}/fr/line",
}

# ─────────────────────────────────────────────────────────────

def ts_for_date(date_str):
    """'YYYY-MM-DD' → (ts_from, ts_to) alignés sur 21h UTC veille→jour."""
    y, m, d = map(int, date_str.split("-"))
    ts_mid = int(calendar.timegm((y, m, d, 0, 0, 0)))
    ts_from = ts_mid - 3 * 3600
    ts_to   = ts_from + 86400
    return ts_from, ts_to

def test_results(sport_id, ts_from, ts_to):
    """Retourne (ok: bool, champs_count: int)."""
    url = (f"{MIRROR}/service-api/result/web/api/v2/champs"
           f"?dateFrom={ts_from}&dateTo={ts_to}&lng=fr&ref=1&sportIds={sport_id}")
    req = urllib.request.Request(url, headers=RESULTS_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode("utf-8", errors="ignore"))
            return True, len(data.get("items", []))
    except urllib.error.HTTPError as e:
        return False, e.code
    except Exception:
        return False, 0

def test_line(sport_id):
    """Retourne nombre d'events upcoming."""
    url = (f"{MIRROR}/service-api/LineFeed/Get1x2_VZip"
           f"?sports={sport_id}&count=20&lng=fr&mode=4&country=158&getEmpty=true")
    req = urllib.request.Request(url, headers=LINE_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            data = json.loads(r.read().decode("utf-8", errors="ignore"))
            return len(data.get("Value", []))
    except:
        return -1

# ─────────────────────────────────────────────────────────────
# Chargement des sports
with open(ALLSPORT_PATH, encoding="utf-8") as f:
    sports = json.load(f)

print(f"{'='*80}")
print(f"Scan de {len(sports)} sports — {datetime.date.today()}")
print(f"{'='*80}")

# Dates à tester
yesterday   = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
six_months  = "2026-01-01"
eighteen_m  = "2025-01-01"
beyond_18m  = "2024-06-01"

dates = [
    ("Hier",    yesterday),
    ("6 mois",  six_months),
    ("18 mois", eighteen_m),
    (">18 mois",beyond_18m),
]

# Calcule timestamps une fois
ts_map = {label: ts_for_date(d) for label, d in dates}

# Header du tableau
header = f"{'Sport':<30} {'ID':>4}  {'Live':>5}  {'Hier':>6}  {'6mois':>6}  {'18mois':>7}  {'>18mois':>8}"
print(header)
print("-" * 80)

results_summary = []

for sport in sports:
    sid   = sport["sportId"]
    name  = sport["name"][:28]
    isCyber = sport.get("isCyber", False)
    
    # Skip cyber sports (pas de données réelles)
    if isCyber:
        continue

    # Test calendrier upcoming
    line_count = test_line(sid)
    time.sleep(0.1)

    # Test Results API pour chaque date
    res_counts = {}
    for label, date_str in dates:
        ts_from, ts_to = ts_map[label]
        ok, count = test_results(sid, ts_from, ts_to)
        res_counts[label] = (ok, count)
        time.sleep(0.12)

    # Format ligne
    def fmt(ok, count):
        if ok:
            return f"{count:>6}" if count > 0 else f"{'0':>6}"
        else:
            return f"{'ERR':>6}"

    line_str = f"{line_count:>5}" if line_count >= 0 else f"{'ERR':>5}"
    row = (f"{name:<30} {sid:>4}  {line_str}  "
           f"{fmt(*res_counts['Hier'])}  "
           f"{fmt(*res_counts['6 mois'])}  "
           f"{fmt(*res_counts['18 mois'])}  "
           f"{fmt(*res_counts['>18 mois'])}")
    print(row)

    # Résumé structuré
    results_summary.append({
        "sportId":   sid,
        "name":      sport["name"],
        "isCyber":   isCyber,
        "isTeamSport": sport.get("isTeamSport", False),
        "upcoming":  line_count,
        "results": {
            "hier":    {"ok": res_counts["Hier"][0],     "count": res_counts["Hier"][1]},
            "6mois":   {"ok": res_counts["6 mois"][0],   "count": res_counts["6 mois"][1]},
            "18mois":  {"ok": res_counts["18 mois"][0],  "count": res_counts["18 mois"][1]},
            ">18mois": {"ok": res_counts[">18 mois"][0], "count": res_counts[">18 mois"][1]},
        }
    })

print("-" * 80)
print(f"\nLégende : Live=events upcoming | colonnes=champs dispo dans Results API")

# Sauvegarde
with open("sports_history_matrix.json", "w", encoding="utf-8") as f:
    json.dump(results_summary, f, indent=2, ensure_ascii=False)
print(f"\n✅ Matrice complète sauvegardée dans sports_history_matrix.json")

# Stats finales
print(f"\n{'='*60}")
print("RÉSUMÉ")
print(f"{'='*60}")

has_upcoming = [s for s in results_summary if s["upcoming"] > 0]
has_hier     = [s for s in results_summary if s["results"]["hier"]["ok"] and s["results"]["hier"]["count"] > 0]
has_6mois    = [s for s in results_summary if s["results"]["6mois"]["ok"] and s["results"]["6mois"]["count"] > 0]
has_18mois   = [s for s in results_summary if s["results"]["18mois"]["ok"] and s["results"]["18mois"]["count"] > 0]
has_beyond   = [s for s in results_summary if s["results"][">18mois"]["ok"] and s["results"][">18mois"]["count"] > 0]

print(f"  Sports avec calendrier futur actif : {len(has_upcoming)}")
print(f"  Sports avec résultats hier         : {len(has_hier)}")
print(f"  Sports avec résultats à 6 mois     : {len(has_6mois)}")
print(f"  Sports avec résultats à 18 mois    : {len(has_18mois)}")
print(f"  Sports avec résultats >18 mois     : {len(has_beyond)}")

if has_beyond:
    print(f"\n  ⭐ Sports avec accès historique >18 mois :")
    for s in has_beyond:
        print(f"     - {s['name']} (ID={s['sportId']})")
