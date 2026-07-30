#!/usr/bin/env python3
"""
test_eventsstat_fetcher.py
===========================
Valide le nouveau EventsStatFetcher intégré dans scrape_all.py.
"""
from scrape_all import EventsStatFetcher
import json

fetcher = EventsStatFetcher()

# --- TEST 1: Ranking actuel ATP ---
print("=== Ranking ATP actuel ===")
data = fetcher.get_ranking("5b19067ef87e5825813fb409")
players = fetcher.parse_ranking(data)
print(f"  {len(players)} joueurs")
for p in players[:3]:
    print(f"  #{p['rank']:>3}  {p['name']:30s} {p['country'] or '?':15s} Pts={p['points']}")

# --- TEST 2: Ranking ATP historique 2021 ---
print("\n=== Ranking ATP 2021-08-09 ===")
data_hist = fetcher.get_ranking("5b19067ef87e5825813fb409", date_str="2021.08.09")
players_hist = fetcher.parse_ranking(data_hist)
print(f"  {len(players_hist)} joueurs")
for p in players_hist[:3]:
    print(f"  #{p['rank']:>3}  {p['name']:30s} {p['country'] or '?':15s} Pts={p['points']}")

# --- TEST 3: PlayerDetailed Djokovic ---
print("\n=== PlayerDetailed Djokovic ===")
DJOKOVIC_ID = "5ab2f3a0494765f3ca3ab85a"
pdata = fetcher.get_player_details(DJOKOVIC_ID)
parsed = fetcher.parse_player_matches(pdata)
print(f"  Upcoming: {len(parsed['upcoming'])} matchs")
for m in parsed['upcoming']:
    print(f"    {m['date'][:10]} — {m['tournament']} — {m['playerA']['name']} vs {m['playerH']['name']}")
print(f"  Recent: {len(parsed['recent'])} matchs")
for m in parsed['recent'][:3]:
    print(f"    {m['date'][:10]} — {m['tournament']} — {m['playerA']['name']} {m['scoreA']}-{m['scoreH']} {m['playerH']['name']}")
