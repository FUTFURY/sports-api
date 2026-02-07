import requests
import json
import zlib

def replay_intercepted():
    url = "https://sa.1xbet.com/service-api/LiveFeed/Web_SearchZip"
    
    # Headers directly from the user's interception
    headers = {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "origin": "https://sa.1xbet.com",
        "referer": "https://sa.1xbet.com/fr/line/golf?platform_type=desktop",
        "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-app-n": "__BETTING_APP__",
        "x-hd": "Y6mGTs6B1g4AtkRvJ5Be2k3WHr/XZR3DVr7qjTCmnDyUOmmpamuvSt8iQX6u1p/p04KBwwlrk1mLq56gddtcOoktLfKXiTlS9rzc6Gh+7+daHhi2XZbqotG1rx4HaPaGJyGjJRWqc9HIQ+0xWMzShECiZR4PjWG1IqzyuSvJSF486tY0Vthq/p9WQvRWFAb4rdZs8b06bYbg1WEoyKRXbD+pc2fXvc9aQE4yRLQqYiIMupvscZw8TZIh6rOcNiHPG7UBx3HqBsNVMQOx8SkSR0cA4ZUpWadvVV1pN2BArvISx+MxwvQhXG1pwiH5JJemrNOUr0ph06RDFrFj/1FycC/TVsTGAycmg2+MO0KtD2rmQkzzW9st0QvfEuTM+VtOjOh2eKnVPYTs5CAyRSMVBaAAAUkYgREcTFnEmtjy8qLQ74az1se2VeUG3m+ZBWfu89gU93VMSSsnLFJtww8pawycozVlSqTdDIo2WdaOJ9G/MoisBEETn+MT1Vq2FR1lXoJ7RniE4YcxG2jcZU8olTwOf1XNokEwKQLtEnnHQN2zx9K77oIiMZUmWMZoKpStjT9PsqFPr5EF5tE+pmVeG2sG/MMTHbw=",
        "x-mobile-project-id": "0",
        "x-requested-with": "XMLHttpRequest",
        "x-svc-source": "__BETTING_APP__"
    }

    params = {
        "text": "psg",
        "limit": "50",
        "gr": "1208",
        "lng": "fr",
        "country": "158",
        "mode": "4",
        "userId": "0"
    }

    print(f"Replaying request to {url}...")
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10, stream=True)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            print("SUCCESS! We bypassed the security!")
            
            # Decompress ZSTD
            try:
                import zstandard as zstd
                dctx = zstd.ZstdDecompressor()
                with dctx.stream_reader(resp.raw) as reader:
                    decompressed = reader.read()
                
                json_str = decompressed.decode('utf-8')
                
                data = json.loads(json_str)
                print("--- DECOMPRESSED JSON ---")
                print(json.dumps(data, indent=2))
                return
            except ImportError:
                print("ERROR: 'zstandard' library not found.")
            except Exception as e:
                print(f"Decompression error: {e}")
                # Fallback print
                print("Raw snippet:", resp.content[:100])
        else:
            print("Failed. Security blocked it again.")
            print(resp.text[:500])
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    replay_intercepted()
