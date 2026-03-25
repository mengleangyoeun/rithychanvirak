import type { Metadata } from "next";
import { Inter, Livvic } from "next/font/google";
import "@fontsource/kantumruy-pro/300.css";
import "@fontsource/kantumruy-pro/400.css";
import "@fontsource/kantumruy-pro/500.css";
import "@fontsource/kantumruy-pro/600.css";
import "@fontsource/kantumruy-pro/700.css";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Optimize font loading
  preload: true,
});


const livvic = Livvic({
  weight: ['300', '400', '500', '600', '700', '900'],
  subsets: ["latin"],
  variable: "--font-livvic",
  display: 'swap',
  preload: true, // Critical for headings
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rithychanvirak.com'),
  title: {
    default: 'Rithy Chanvirak - Professional Photographer',
    template: '%s | Rithy Chanvirak',
  },
  description: 'Discover stunning photography by Rithy Chanvirak. Specializing in capturing compelling visual stories through professional portrait, event, and creative photography.',
  keywords: ['photography', 'photographer', 'portraits', 'events', 'professional photography', 'Rithy Chanvirak'],
  openGraph: {
    title: 'Rithy Chanvirak - Professional Photographer',
    description: 'Discover stunning photography by Rithy Chanvirak. Specializing in capturing compelling visual stories.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Rithy Chanvirak',
    images: [{ url: '/images/logo/logo_white.png', width: 1200, height: 630, alt: 'Rithy Chanvirak Photography' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rithy Chanvirak - Professional Photographer',
    description: 'Discover stunning photography by Rithy Chanvirak. Specializing in capturing compelling visual stories.',
    images: ['/images/logo/logo_white.png'],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} ${livvic.variable} antialiased min-h-screen flex flex-col`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
        <Analytics />
      </body>
    </html>
  );
}
