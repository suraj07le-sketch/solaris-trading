import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import '@/app/globals.css' // Adjusted import path
import "crypto-icons/font.css"
import "crypto-icons/styles.css"
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Toaster } from 'sonner'
import NextTopLoader from 'nextjs-toploader';
import { StarsBackground } from "@/components/ui/stars-background";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { GlobalErrorSuppressor } from "@/components/ui/GlobalErrorSuppressor";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import JsonLd from '@/components/seo/JsonLd';

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shursunt.com';

export const metadata: Metadata = {
    title: {
        default: 'ShursunT AI | Advanced Crypto Analytics & 90% Accurate Trading Signals',
        template: '%s | ShursunT AI'
    },
    description: 'Maximize your ROI with ShursunT AI. Institutional-grade price predictions, real-time crypto signals, and advanced market sentiment for Bitcoin, Ethereum, and Nifty 50. Quantitative trading for everyone.',
    keywords: ['AI trading signals', 'crypto price prediction', 'stock market AI', 'quantitative trading insights', 'bitcoin technical analysis', 'nifty 50 ai prediction'],
    authors: [{ name: 'ShursunT Quant Team', url: BASE_URL }],
    creator: 'ShursunT AI Inc.',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: BASE_URL,
        title: 'ShursunT AI | Quant-Grade Crypto Analytics & Trading Signals',
        description: 'Get an unfair advantage in the markets with institutional-grade AI analytics. 90% accuracy in trend detection for Crypto & Stocks.',
        siteName: 'ShursunT AI',
        images: [
            {
                url: `${BASE_URL}/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'ShursunT AI Trading Interface',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ShursunT AI | Quant-Grade Crypto Analytics & Trading Signals',
        description: 'Master the markets with ShursunT AI. Real-time predictions and high-conviction signals.',
        images: [`${BASE_URL}/twitter-image.png`],
        creator: '@shursunt_ai',
    },
    metadataBase: new URL(BASE_URL),
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: any;
}) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Provide all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#09090b" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="ShursunT" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            </head>
            <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
                <JsonLd />
                <NextIntlClientProvider messages={messages}>
                    <NextTopLoader
                        color="hsl(var(--primary))"
                        initialPosition={0.15}
                        showSpinner={false}
                        speed={150}
                        height={2}
                    />

                    <div className="fixed inset-0 z-[-1] pointer-events-none">
                        <StarsBackground starDensity={0.0002} allStarsTwinkle={true} minStarSize={0.5} maxStarSize={1.0} className="opacity-100" />
                        <ShootingStars minDelay={3000} maxDelay={6000} />
                    </div>



                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        themes={['light', 'dark', 'neon', 'cyber']}
                        enableSystem
                        disableTransitionOnChange
                    >
                        <GlobalErrorSuppressor />
                        <ServiceWorkerRegistration />
                        <AuthProvider>
                            {children}
                            <Toaster richColors position="bottom-right" theme="system" />
                        </AuthProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
