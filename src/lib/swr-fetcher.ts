/**
 * Universal SWR Fetcher
 * Handles standard fetch and IndianAPI headers.
 */

export const swrFetcher = async (url: string) => {
    const isIndianApi = url.includes("stock.indianapi.in");

    // Auto-proxy IndianAPI to bypass CORS
    const finalUrl = isIndianApi ? `/api/proxy?url=${encodeURIComponent(url)}` : url;
    const headers: HeadersInit = {};

    // Only add headers if NOT proxied (direct coingecko etc)
    if (isIndianApi && !url.startsWith('/api')) {
        // This part is actually redundant if we use the proxy correctly, 
        // but keeping logic safe for direct calls if CORS allows.
        headers["X-Api-Key"] = process.env.NEXT_PUBLIC_INDIAN_API_KEY || "";
    }

    const res = await fetch(finalUrl, { headers });

    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        // @ts-ignore
        error.info = await res.json();
        // @ts-ignore
        error.status = res.status;
        throw error;
    }

    return res.json();
};
