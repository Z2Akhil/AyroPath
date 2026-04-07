import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/providers/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Full Body Checkup at Home – Book Health Packages | Ayropath",
    template: "%s | Ayropath",
  },
  description:
    "Book full body checkup with 80+ parameters. Free home sample collection across India. NABL & CAP accredited Thyrocare labs. Digital reports in 24–48 hrs. Book now starting ₹499.",
  keywords: [
    // Tier 1 — High Commercial Intent
    "full body checkup",
    "full body checkup near me",
    "health checkup packages",
    "preventive health checkup",
    "blood test at home",
    "Thyrocare full body checkup",
    "health checkup packages India",
    "home sample collection",
    "book lab test online",
    // Tier 2 — Thyrocare Branded
    "Thyrocare",
    "Thyrocare Aarogyam",
    "Thyrocare Aarogyam C",
    "Thyrocare Aarogyam 1.1",
    "Thyrocare home collection",
    "Thyrocare blood test price",
    "Aarogyam packages",
    "Aarogyam Basic",
    "Aarogyam Advanced",
    "Aarogyam Male",
    "Aarogyam Female",
    "Ayropath",
    // Tier 2 — Service Specific
    "blood test",
    "lab test",
    "diagnostic test",
    "CBC test",
    "thyroid test",
    "TSH T3 T4 test",
    "lipid profile",
    "liver function test",
    "kidney function test",
    "diabetes screening",
    "HbA1c test",
    "Vitamin D test",
    "Vitamin B12 test",
    "cardiac risk profile",
    "uric acid test",
    "creatinine test",
    "online lab test booking",
    // Tier 3 — Demographics
    "full body checkup for women",
    "health checkup for senior citizens",
    "senior citizen health package",
    // Tier 3 — City Specific
    "full body checkup Delhi",
    "full body checkup Mumbai",
    "full body checkup Ranchi",
    "full body checkup Jamshedpur",
    "full body checkup Bengaluru",
    "full body checkup Hyderabad",
    "full body checkup Dhanbad",
    "Thyrocare home collection Delhi",
    "Thyrocare home collection Mumbai",
    // Tier 3 — Price Point
    "full body checkup under 1000",
    "affordable health checkup India",
    "cheap blood test at home",
    "health package under 999",
    // Legacy Thyrocare product names
    "Executive Full Body Health Checkup",
    "Complete Health Checkup with Vitamins",
    "Aarogyam Tax Saver",
    "Senior Citizen Profile Male Female",
    "NABL accredited lab India",
    "CAP accredited lab",
    "preventive healthcare India",
  ],
  authors: [{ name: "Ayropath" }],
  creator: "Ayropath",
  publisher: "Ayropath",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Ayropath",
    title: "Full Body Checkup at Home – Book Health Packages | Ayropath",
    description:
      "Book full body checkup with 80+ parameters. NABL & CAP accredited Thyrocare labs, free home sample collection, digital reports in 24–48 hrs. Powered by Thyrocare.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ayropath - Full Body Checkup & Health Diagnostics at Home",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Body Checkup at Home – Book Lab Tests | Ayropath",
    description:
      "Book full body checkup with 80+ parameters. Free home sample collection, NABL accredited Thyrocare labs & fast reports.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Organization JSON-LD — applies site-wide
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ayropath Technologies Limited",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description:
    "India's trusted health diagnostics platform in association with Thyrocare. Book lab tests & health packages online with free home sample collection.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "admin@ayropath.com",
    contactType: "customer service",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: ["https://www.instagram.com/ayropath"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${dmSans.variable} antialiased min-h-screen flex flex-col`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
