import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'IPO Intelligence & GMP Tracker | Real-Time Listing Gains Analysis',
    description: 'Track ongoing and upcoming IPOs with AI-powered listing gain predictions. Monitor Grey Market Premium (GMP), subscription status, and institutional interest.',
    keywords: ['upcoming ipo india', 'gmp tracker', 'ipo listing gain prediction', 'mainboard ipo', 'sme ipo analysis'],
    openGraph: {
        title: 'ShursunT AI | IPO Intelligence & GMP Tracker',
        description: 'Elite analysis of upcoming IPOs. Predict listing gains using quant models.',
    }
}

export default function IPOLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
