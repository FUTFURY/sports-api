from abc import ABC, abstractmethod
from typing import List, Dict, Any

class SiteAnalyzer(ABC):
    """
    Abstract base class for a betting site API analyzer.
    """
    
    def __init__(self, name: str, domain: str):
        self.name = name
        self.domain = domain
    
    @abstractmethod
    def get_endpoints(self) -> List[Dict[str, str]]:
        """
        Returns a list of potential API endpoints to investigate.
        Each item should be a dict with keys: 'description', 'url', 'method', 'notes'.
        """
        pass
    
    @abstractmethod
    def analyze(self) -> Dict[str, Any]:
        """
        Performs a basic analysis or check of the site's API status/accessibility.
        Returns a dictionary with status information.
        """
        pass
