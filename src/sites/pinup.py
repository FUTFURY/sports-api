from typing import List, Dict, Any
from ..base import SiteAnalyzer

class PinUpAnalyzer(SiteAnalyzer):
    def __init__(self):
        super().__init__("Pin-Up", "pin-up.bet")

    def get_endpoints(self) -> List[Dict[str, str]]:
        return [
            {
                "description": "Live Events",
                "url": "https://pin-up.bet/api/v1/events/live",
                "method": "GET",
                "notes": "Data often compressed or simple ID structure (1=Football). Common in India/CIS."
            }
        ]

    def analyze(self) -> Dict[str, Any]:
        return {
            "status": "Check Manual",
            "message": "Look for 'api/v1/events'. Simple sport IDs used (1, 2, etc.)."
        }
