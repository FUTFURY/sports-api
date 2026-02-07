
// using global fetch
// Script to fetch specific game data using user provided headers and URL

async function analyzeUserRequest() {
    const url = "https://sa.1xbet.com/service-api/LiveFeed/GetGameZip?id=693774184&lng=fr&isSubGames=true&GroupEvents=true&countevents=250&topGroups=&country=158&marketType=1&isNewBuilder=true";

    // Headers provided by user
    const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate", // Removed br, zstd to avoid decompression issues
        "accept-language": "fr,en-US;q=0.9,en;q=0.8,sv;q=0.7",
        "content-type": "application/json",
        "origin": "https://sa.1xbet.com",
        "referer": "https://sa.1xbet.com/fr/live/football/12821-france-ligue-1/693774184-stade-brestois-29-lorient",
        "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-app-n": "__BETTING_APP__",
        "x-hd": "7PBt96MHKtO8F2V9vu5S50cIr2Zezzrjv3XF3XvNp+7/Zql2QAG6FGkTNJWHp+Tm1a1Yi7LxnStHwme5UWOLldZaHgMb4d5cjqwZVnNmPmMXiOwMVjY7zfWjquBCra8M1Ao7ONQeApqyHoLUZWw3U3yvncBI4GrESiP+JnsBbuaEUDjslnTF3rE3Yen2v9HEp9iUuque7/bj0RFILbKtGmLOZt6pxIhx0BlKzW/qk6kqVuDLhZlkfghV4ghdV6+hy7/I+4JGOsKBwre+edWbUWuJ3kE6G2JdLXatbei8KAyOZYP6NseRH6bTu4ChCmi2Ru+msE9WImoO9i4C5AiOtjLSKs55p4rzEFQf8ftAfUJGANiHCOFWK+mNfPlFgDtmwTra6PKD0Y/y+r26s6pdSuBYMrfDEeP/ZHgfL4PsEno1wX9coWJo1eoz++H84iAcUImaGHnCD+ZmXL/HjbZzkYflcxGEBXGWuwivY8E+31UTupT+I163pdEuNBATTR8l19Rz1ZPHJp/biGThJKcJFNYrn6TlollBn3yqjGy6BJ48KCQgtBa1soQRqNQbLFcjmYC6eciM47adxt6rUXHcHzVy1OA+Pr0=",
        "x-mobile-project-id": "0",
        "x-requested-with": "XMLHttpRequest",
        "x-svc-source": "__BETTING_APP__",
        "cookie": "_gcl_au=1.1.1922047120.1770217504; _ga=GA1.1.763110984.1770217504; _ym_uid=1770217505643263726; _ym_d=1770217505; tzo=3; auid=wjuO02mDYDNQ+RkqA1olAg==; fatman_uuid=14b3c7b9-b248-4259-8e12-d6639b9236fc; che_g=da189578-5335-4c1d-b643-59cd4173c2c1; sh.session.id=2293eb5b-c12a-4437-af46-6c65ad900e61; SESSION=0926f7f07fb5c63a3d9e0d5ea387573c; coefview=0; fast_coupon=true; modeZoneSport4=2; cookies_agree_type=3; app_view_type=0; is12h=0; isChampsGroupedByCountry=1; typeBetNames=short; platform_type=desktop; _ga_0NQW4X2MPH=GS2.1.s1770419538$o1$g1$t1770419803$j59$l0$h1627299831; PAY_SESSION=6a64727a5b47387b246b6dd7e16c00f0; v3fr=1; lng=fr; application_locale=fr; window_width=1326; _ga_7JGWL9SV66=GS2.1.s1770493289$o11$g1$t1770493720$j60$l0$h1496670426"
    };

    console.log("Fetching data with user headers...");
    try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            console.log("Error:", resp.status);
            return;
        }

        const data = await resp.json();
        const value = data.Value;

        if (!value) {
            console.log("No Value object found.");
            console.log("Full data keys:", Object.keys(data));
            return;
        }

        console.log("Keys in Value:", Object.keys(value));

        // Define the structure looking like the user's snippet
        // The user showed an array where elements have "E" and "G"
        // This is typically the 'GE' (Game Events) or 'SG' (Sub Games?) or just the Value itself if it's a list?
        // Actually, normally 'Value' is an object for GetGameZip, but let's check 'GE'.

        if (value.GE) {
            console.log("\n--- Inspecting GE (Game Events / Markets) ---");
            // Iterate directly to see if we find G=154 or G=275
            const groups = value.GE;
            const targetGroups = groups.filter(g => g.G === 154 || g.G === 275 || g.G === 852);

            if (targetGroups.length > 0) {
                console.log("Found matching groups from user snippet!");
                console.log(JSON.stringify(targetGroups, null, 2));
                console.log("\nANALYSIS: 'C' field is typically 'Coefficient' (Odds). 'CV' is 'Coefficient Value'.");
            } else {
                console.log("Did not find exact Group IDs (154, 275, 852). They might be transient.");
                console.log("First 2 groups:", JSON.stringify(groups.slice(0, 2), null, 2));
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

analyzeUserRequest();
