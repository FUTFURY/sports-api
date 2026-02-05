from typing import List, Dict, Any
from ..base import SiteAnalyzer

class BeInSportsAnalyzer(SiteAnalyzer):
    def __init__(self):
        super().__init__("BeIn Sports", "beinsports.com")

    def get_endpoints(self) -> List[Dict[str, str]]:
        return [
            {
                "description": "Score API",
                "url": "Connect API (various)",
                "method": "GET",
                "notes": "Filter for 'score-api' in Network tab. Used for result banners."
            }
        ]

    def analyze(self) -> Dict[str, Any]:
        return {
            "status": "Check Manual",
            "message": "Not a betting site, but good for scores. Look for public 'score-api' endpoints."
        }
