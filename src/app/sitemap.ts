import { MetadataRoute } from 'next'
import { getTopCoins } from '@/lib/coingecko'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shursunt.com'

    // Static Routes
    const staticRoutes: string[] = [
        '',
        '/login',
        '/signup',
        '/stocks',
        '/crypto',
        '/ipo',
        '/mutual-funds',
        '/predictions',
    ]

    const routes: MetadataRoute.Sitemap = staticRoutes.map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
    }))

    // Dynamic Coin Routes
    try {
        const topCoins = await getTopCoins(100);
        const coinRoutes: MetadataRoute.Sitemap = topCoins.map((coin) => ({
            url: `${baseUrl}/price-prediction/${coin.id}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        }));

        // Programmatic Comparison Routes (BTC vs Top 10)
        const principalCoins = topCoins.slice(0, 10);
        const comparisonRoutes: MetadataRoute.Sitemap = [];

        principalCoins.forEach((c1, i) => {
            principalCoins.slice(i + 1, i + 4).forEach((c2) => {
                comparisonRoutes.push({
                    url: `${baseUrl}/compare/${c1.id}-vs-${c2.id}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.6,
                });
            });
        });

        return [...routes, ...coinRoutes, ...comparisonRoutes];
    } catch (error) {
        console.error("Sitemap Coin Fetch Error:", error);
        return routes;
    }
}
