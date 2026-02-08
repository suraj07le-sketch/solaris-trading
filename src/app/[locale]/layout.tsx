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
import { QueryProvider } from '@/components/providers/QueryProvider';

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
})

export const metadata: Metadata = {
    title: {
        default: 'ShursunT AI | Advanced Crypto Analytics & Trading Signals',
        template: '%s | ShursunT AI'
    },
    description: 'Maximize your crypto trading ROI with ShursunT AI. Real-time price predictions, market sentiment analysis, and 90% accurate AI trading indicators for Bitcoin, Ethereum, and Solana.',
    keywords: ['AI crypto signals', 'crypto price prediction', 'trading indicators', 'crypto analytics', 'bitcoin prediction', 'ethereum sentiment', 'AI trading bot'],
    authors: [{ name: 'ShursunT Team', url: 'https://shursunt.com' }],
    creator: 'ShursunT Inc.',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://shursunt.com',
        title: 'ShursunT AI | Advanced Crypto Analytics & Trading Signals',
        description: 'Maximize your crypto trading ROI with ShursunT AI. Real-time price predictions, market sentiment analysis, and 90% accurate AI trading indicators.',
        siteName: 'ShursunT AI',
        images: [
            {
                url: 'https://shursunt.com/og-image.png',
                width: 1200,
                height: 630,
                alt: 'ShursunT AI Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ShursunT AI | Advanced Crypto Analytics & Trading Signals',
        description: 'Maximize your crypto trading ROI with ShursunT AI. Real-time price predictions and market sentiment analysis.',
        images: ['https://shursunt.com/twitter-image.png'],
        creator: '@shursunt_ai',
    },
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
                <link rel="apple-touch-icon" href="/favicon.ico" />
            </head>
            <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
                <JsonLd />
                <NextIntlClientProvider messages={messages}>
                    <NextTopLoader
                        color="hsl(var(--primary))"
                        initialPosition={0.08}
                        showSpinner={false}
                        speed={200}
                        shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
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
                        <QueryProvider>
                            <AuthProvider>
                                {children}
                                <Toaster richColors position="bottom-right" theme="system" />
                            </AuthProvider>
                        </QueryProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
