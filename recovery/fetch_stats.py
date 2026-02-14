import requests
import json
import os
import sys
from urllib.parse import urlparse
from bs4 import BeautifulSoup

def load_headers():
    try:
        with open('headers.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: headers.json not found.")
        sys.exit(1)

def fetch_stats(uuid):
    print(f"=== FETCHING STATISTICS {uuid} ===\n")
    headers = load_headers()
    
    # Try Alternative Endpoints
    # 1. Seeings (often used for visualizations/stats)
    # 2. Checker endpoint (User provided)
    # 3. BFF API (User provided - likely config)
    urls = [
        f"https://eventsstat.com/fr/statisticpopup/game/football/{uuid}/main?hs=1&ln=fr&gti=G-7JGWL9SV66&rtl=0&fh=1&r=1&g=1208&p=1208&tz=3&geo=158",
        f"https://eventsstat.com/fr/statisticpopup/game/football/{uuid}/Game?gameId={uuid}&timestamp=1738707000",
        f"https://sa.1xbet.com/fr/statisticpopup/game/football/{uuid}/main", 
        "https://sa.1xbet.com/Sports?lng=fr&nameEng=true", 
    ]

    success = False
    
    # Testing UUID only for now
    test_ids = [uuid]
    
    for test_id in test_ids:
        print(f"\n--- Testing with ID: {test_id} ---")
        for url in urls:
            # Handle dynamic UUID in URL if formatted
            current_url = url
            if "{uuid}" in url: # Should not happen with f-string above but good practice
                 current_url = url.replace("{uuid}", test_id)
            
            print(f"Requesting: {current_url}")
            params = {"gameId": test_id, "lng": "fr"}
            
            # BFF API doesn't use gameId param, it uses query string already in URL
            if "bff-api" in current_url or "event.json" in current_url:
                params = {} 

            # Sometimes 'Seeings' uses 'id' instead of 'gameId'
            if "Seeings" in current_url:
                 params = {"id": test_id, "lng": "fr"}
            
            # Standard Headers
            current_headers = headers.copy()
            
            try:
                response = requests.get(current_url, params=params, headers=current_headers, timeout=10)
                print(f"Status: {response.status_code}")
                print(f"Content-Type: {response.headers.get('Content-Type', '')}")
                
                if response.status_code in [200, 203]:
                    # Generate a unique filename based on domain and params
                    domain = urlparse(url).netloc.replace(".", "_")
                    if "eventsstat" in domain:
                        suffix = "_eventsstat.html"
                    elif "Sports" in url:
                        suffix = "_sports.html"
                    else:
                        suffix = f"_{domain}.html"
                        
                    filename = f"stats_{uuid}{suffix}"
                    
                    # Determine extension and write content
                    content_type = response.headers.get('Content-Type', '')
                    ext = "html" # Default to html as per new suffix logic
                    mode = "wb" # Binary write for response.content
                    
                    # If content type is JSON, try to parse and save as JSON
                    if "application/json" in content_type or "text/json" in content_type:
                        ext = "json"
                        mode = "w" # Text write for json.dump
                        try:
                            data = response.json()
                            filename = filename.replace(".html", ".json") # Adjust filename extension
                            with open(filename, mode) as f:
                                json.dump(data, f, indent=4)
                        except json.JSONDecodeError:
                            print("Failed to decode JSON even with 200/203.")
                            continue
                    else:
                        with open(filename, "w", encoding="utf-8") as f:
                            f.write(response.text)
                            
                    print(f"\nSUCCESS! Saved to '{filename}'")
                    success = True
                    
                    # --- PARSING STEP ---
                    if ext == "html" and "eventsstat" in filename:
                        print("Parsing HTML stats...")
                        try:
                            soup = BeautifulSoup(response.content, "html.parser")
                            
                            stats = {
                                "teams": [],
                                "match_stats": {},
                                "lineups": {},
                                "metadata": {
                                    "uuid": uuid,
                                    "url": url
                                }
                            }

                            # 1. Team Names
                            team_elements = soup.select(".match-stat__member .old-member-info__name")
                            headers = [t.get_text(strip=True) for t in team_elements]
                            if len(headers) >= 2:
                                stats["teams"] = [headers[0], headers[1]]

                            # 2. Match Statistics
                            rows = soup.select(".match-stat-table__row")
                            for row in rows:
                                cells = row.select(".match-stat-table__cell")
                                if len(cells) == 3:
                                    val_home = cells[0].get_text(strip=True)
                                    label = cells[1].get_text(strip=True)
                                    val_away = cells[2].get_text(strip=True)
                                    stats["match_stats"][label] = {
                                        "home": val_home,
                                        "away": val_away
                                    }

                            # 3. Lineups
                            player_lists = soup.select(".stat-composition__list .stat-players-list")
                            for i, p_list in enumerate(player_lists):
                                # Safety check for indices
                                team_name = stats["teams"][i] if i < len(stats["teams"]) else f"Team {i+1}"
                                players = []
                                
                                items = p_list.select(".stat-players-list__item")
                                current_section = "Starting"
                                
                                for item in items:
                                    title = item.select_one(".stat-players-list__title")
                                    if title:
                                        current_section = title.get_text(strip=True)
                                        continue
                                    
                                    name_el = item.select_one(".new-member-name")
                                    if name_el:
                                        name = name_el.get_text(strip=True)
                                        role_el = item.select_one(".stat-players-list__roles span")
                                        role = role_el.get_text(strip=True) if role_el else None
                                        
                                        events = []
                                        event_icons = item.select(".old-svg-ico")
                                        for icon in event_icons:
                                            classes = icon.get("class", [])
                                            if "old-svg-ico--card" in str(classes):
                                                events.append("Card")
                                            if "old-svg-ico--soccer-ball" in str(classes):
                                                events.append("Goal")
                                            if "substitution" in str(classes):
                                                events.append("Sub")

                                        players.append({
                                            "name": name,
                                            "section": current_section,
                                            "role": role,
                                            "events": events
                                        })
                                
                                stats["lineups"][team_name] = players
                                
                            # Save Parsed JSON
                            json_filename = filename.replace(".html", "_parsed.json")
                            with open(json_filename, "w", encoding="utf-8") as f:
                                json.dump(stats, f, indent=4, ensure_ascii=False)
                            print(f"PARSED DATA SAVED to '{json_filename}'")
                            
                            # STOP after successful parse
                            break 
                            
                        except Exception as e:
                            print(f"Parsing failed: {e}")

                    # Analyze if JSON
                    if ext == "json" and isinstance(data, dict):
                         print("\n--- ROOT KEYS ---")
                         print(list(data.keys()))
                    
                    # break # Keep trying others
                else:
                    print(f"Failed. Reason: {response.reason}")
            except Exception as e:
                print(f"Error checking {url}: {e}")
            print("-" * 20)
        # if success:
        #    break
    
    if not success:
        print("Could not fetch statistics from any known endpoint.")

if __name__ == "__main__":
    # New UUID from user (Live match on eventsstat.com)
    uuid = "6945785d6d807ed026d2c2a5" 
    
    fetch_stats(uuid)
