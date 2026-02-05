import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Mutual Fund Explorer & AI Conviction Scoring | ShursunT AI',
    description: 'Analyze high-performing Indian mutual funds with AI-driven risk conviction scoring. Track direct plans, SIP performance, and institutional-grade analytics.',
    keywords: ['mutual fund analytics', 'best mutual funds india', 'mutual fund risk score', 'sip analyzer', 'large cap small cap funds'],
    openGraph: {
        title: 'ShursunT AI | Mutual Fund Explorer & AI Scoring',
        description: 'Institutional-grade analysis for retail mutual fund investors. Find high-conviction funds.',
    }
}

export default function FundLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
