import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Livvic } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const livvic = Livvic({
  weight: ['300', '400', '500', '600', '700', '900'],
  subsets: ["latin"],
  variable: "--font-livvic",
});

export const metadata: Metadata = {
  title: 'Rithy Chanvirak - Professional Photographer',
  description: 'Discover stunning photography by Rithy Chanvirak. Specializing in capturing compelling visual stories through professional portrait, event, and creative photography.',
  keywords: ['photography', 'photographer', 'portraits', 'events', 'professional photography', 'Rithy Chanvirak'],
  openGraph: {
    title: 'Rithy Chanvirak - Professional Photographer',
    description: 'Discover stunning photography by Rithy Chanvirak. Specializing in capturing compelling visual stories.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rithy Chanvirak - Professional Photographer',
    description: 'Discover stunning photography by Rithy Chanvirak. Specializing in capturing compelling visual stories.',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${livvic.variable} antialiased min-h-screen flex flex-col`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
