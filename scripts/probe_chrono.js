
// using global fetch
async function probeChrono() {
    const url = "https://sa.1xbet.com/service-api/LiveFeed/GetChronoOfPlay?id=693774184&lng=fr";

    const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate",
        "accept-language": "fr,en-US;q=0.9,en;q=0.8",
        "content-type": "application/json",
        "origin": "https://sa.1xbet.com",
        "referer": "https://sa.1xbet.com/",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-app-n": "__BETTING_APP__",
        "x-hd": "7PBt96MHKtO8F2V9vu5S50cIr2Zezzrjv3XF3XvNp+7/Zql2QAG6FGkTNJWHp+Tm1a1Yi7LxnStHwme5UWOLldZaHgMb4d5cjqwZVnNmPmMXiOwMVjY7zfWjquBCra8M1Ao7ONQeApqyHoLUZWw3U3yvncBI4GrESiP+JnsBbuaEUDjslnTF3rE3Yen2v9HEp9iUuque7/bj0RFILbKtGmLOZt6pxIhx0BlKzW/qk6kqVuDLhZlkfghV4ghdV6+hy7/I+4JGOsKBwre+edWbUWuJ3kE6G2JdLXatbei8KAyOZYP6NseRH6bTu4ChCmi2Ru+msE9WImoO9i4C5AiOtjLSKs55p4rzEFQf8ftAfUJGANiHCOFWK+mNfPlFgDtmwTra6PKD0Y/y+r26s6pdSuBYMrfDEeP/ZHgfL4PsEno1wX9coWJo1eoz++H84iAcUImaGHnCD+ZmXL/HjbZzkYflcxGEBXGWuwivY8E+31UTupT+I163pdEuNBATTR8l19Rz1ZPHJp/biGThJKcJFNYrn6TlollBn3yqjGy6BJ48KCQgtBa1soQRqNQbLFcjmYC6eciM47adxt6rUXHcHzVy1OA+Pr0=",
        "x-requested-with": "XMLHttpRequest"
    };

    console.log(`Fetching ${url}...`);
    try {
        const resp = await fetch(url, { headers });
        if (resp.ok) {
            console.log("SUCCESS:", resp.status);
            const json = await resp.json();
            console.log(JSON.stringify(json, null, 2));
        } else {
            console.log("FAILED:", resp.status);
        }
    } catch (e) { console.error(e); }
}

probeChrono();
