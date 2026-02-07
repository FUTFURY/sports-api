
// using global fetch

async function testApi() {
    const url = "https://sa.1xbet.com/service-api/LiveFeed/Web_SearchZip";
    const text = "tennis"; // generic search

    const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate",
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
    };

    const params = new URLSearchParams({
        text: text,
        limit: "5",
        gr: "1208",
        lng: "fr",
        country: "158",
        mode: "4"
    });

    try {
        console.log(`Fetching: ${url}?${params.toString()}`);
        const response = await fetch(`${url}?${params.toString()}`, { headers });

        if (!response.ok) {
            console.log("Error:", response.status, await response.text());
            return;
        }

        const data = await response.json();
        const items = data.Value || [];

        console.log(`Found ${items.length} items.`);
        if (items.length > 0) {
            console.log("First item keys: ", Object.keys(items[0]));
            // Dump the first item completely to inspect
            console.log("First item full: ", JSON.stringify(items[0], null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

testApi();
