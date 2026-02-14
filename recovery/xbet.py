from typing import List, Dict, Any
from ..base import SiteAnalyzer

class XBetAnalyzer(SiteAnalyzer):
    def __init__(self):
        super().__init__("1xBet", "1xbet.com")

    def get_endpoints(self) -> List[Dict[str, str]]:
        return [
            {
                "description": "Live Feed (main target)",
                "url": "https://1xbet.com/LiveFeed/Get1x2?sport=[ID]&partner=123",
                "method": "GET",
                "notes": "Look for calls to /LiveFeed/ or /LineFeed/ in dev tools. Often returns huge JSONs."
            },
            {
                "description": "Line Feed (Pre-match)",
                "url": "https://1xbet.com/LineFeed/Get1x2?sport=[ID]&partner=123",
                "method": "GET",
                "notes": "Similar structure to LiveFeed but for upcoming events."
            }
        ]

    def analyze(self) -> Dict[str, Any]:
        return {
            "status": "Check Manual",
            "message": "Dynamic API. Requires active session or specific mirrors (e.g., 1xbet.xx). Check 'Fetch/XHR' for 'Get1x2'."
        }
