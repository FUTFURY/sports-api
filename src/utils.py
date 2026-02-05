import requests
from typing import Optional, Dict

def make_request(url: str, method: str = "GET", headers: Optional[Dict] = None, timeout: int = 10) -> Optional[requests.Response]:
    """
    Safely makes an HTTP request and returns the response or None on failure.
    """
    try:
        response = requests.request(method, url, headers=headers, timeout=timeout)
        return response
    except requests.RequestException as e:
        print(f"Request failed for {url}: {e}")
        return None

def check_cors(url: str) -> bool:
    """
    Checks if an endpoint has Access-Control-Allow-Origin: *
    """
    response = make_request(url, method="OPTIONS")
    if not response:
        # Fallback to simple GET as some APIs don't handle OPTIONS well for this check
        response = make_request(url, method="GET")
    
    if response:
        allow_origin = response.headers.get("Access-Control-Allow-Origin", "")
        return allow_origin == "*" or allow_origin == "*"
    return False
