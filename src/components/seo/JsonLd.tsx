export default function JsonLd() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shursunt.com'

    const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'ShursunT AI',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        description: 'Advanced AI-powered crypto analytics, stock insights, and real-time price prediction platform.',
        softwareVersion: '1.2',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '254',
        },
    }

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ShursunT AI',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        sameAs: [
            'https://twitter.com/shursunt_ai',
            'https://linkedin.com/company/shursunt'
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@shursunt.com'
        }
    }

    const serviceSchema = {
        '@context': 'https://schema.org',
        '@type': 'FinancialService',
        name: 'ShursunT AI Quant Services',
        description: 'Institutional-grade AI trading signals and market analytics for retail and professional traders.',
        url: baseUrl,
        feesAndCommissionsSpecification: 'Free and Premium tiers available',
        serviceType: 'Trading Signals and Price Prediction'
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
            />
        </>
    )
}
