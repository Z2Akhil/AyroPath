import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/providers/Providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ayropath - Health Diagnostics & Lab Tests at Home',
    template: '%s | Ayropath',
  },
  description: 'Book health checkups, blood tests & diagnostic packages online with Ayropath. NABL & CAP accredited labs in association with Thyrocare. Free home sample collection, affordable pricing & fast reports.',
  keywords: [
    'health checkup', 'blood test', 'lab test', 'diagnostic test', 'home sample collection',
    'Thyrocare', 'Ayropath', 'full body checkup', 'health package', 'CBC test', 'thyroid test',
    'lipid profile', 'liver function test', 'kidney function test', 'diabetes test',
    'preventive health checkup', 'online lab test booking', 'affordable health tests India',
  ],
  authors: [{ name: 'Ayropath' }],
  creator: 'Ayropath',
  publisher: 'Ayropath',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Ayropath',
    title: 'Ayropath - Health Diagnostics & Lab Tests at Home',
    description: 'Book health checkups & diagnostic packages online. NABL accredited labs, free home collection, affordable pricing & fast reports. Powered by Thyrocare.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ayropath - Health Diagnostics & Lab Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ayropath - Health Diagnostics & Lab Tests at Home',
    description: 'Book health checkups & diagnostic packages online. Free home sample collection & fast reports.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: '/',
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
};

// Organization JSON-LD — applies site-wide
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Ayropath Technologies Limited',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: 'India\'s trusted health diagnostics platform in association with Thyrocare. Book lab tests & health packages online with free home sample collection.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'admin@ayropath.com',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi'],
  },
  sameAs: [
    'https://www.instagram.com/ayropath',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}