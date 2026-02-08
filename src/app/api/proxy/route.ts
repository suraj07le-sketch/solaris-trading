import { NextResponse } from "next/server";

const BASE_URL = "https://stock.indianapi.in";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    // Support both 'url' (full URL) and 'endpoint' (path-only) parameters
    let targetUrl = searchParams.get("url");
    const endpoint = searchParams.get("endpoint");

    if (endpoint) {
        // Build URL from endpoint + remaining params
        const extraParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
            if (key !== "endpoint") extraParams.append(key, value);
        });
        const queryString = extraParams.toString();
        targetUrl = `${BASE_URL}/${endpoint}${queryString ? `?${queryString}` : ""}`;
    }

    if (!targetUrl) {
        return NextResponse.json({ error: "Missing url or endpoint parameter" }, { status: 400 });
    }

    // Security: Only allow proxying to stock.indianapi.in
    if (!targetUrl.includes("stock.indianapi.in")) {
        return NextResponse.json({ error: "Forbidden target domain" }, { status: 403 });
    }

    const API_KEY = process.env.NEXT_PUBLIC_INDIAN_API_KEY || "sk-live-ASP6f2VKjpJhs4yUrBjmRXw5kUI6gUVRlLrhmrYv";

    try {
        const res = await fetch(targetUrl, {
            headers: {
                "X-Api-Key": API_KEY,
                "Content-Type": "application/json"
            },
            next: { revalidate: 300 } // Cache for 5 minutes (300s) to avoid 429 Rate Limits
        });

        if (!res.ok) {
            return NextResponse.json({ error: `Target API returned ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error(`[Proxy Error] ${targetUrl}:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

