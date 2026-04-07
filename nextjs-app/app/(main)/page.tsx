import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import HomeCarousel from "@/components/home/HomeCarousel";
import ProfilePage from "./profiles/page";
import OfferPage from "./offers/page";
import TestPage from "./tests/page";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export const metadata: Metadata = {
  title: "Full Body Checkup at Home – Book Lab Tests Online | Ayropath",
  description:
    "Book full body checkup & individual lab tests online with Ayropath. 80+ parameters, NABL & CAP accredited Thyrocare labs, free home sample collection across India. Reports in 24–48 hrs. Starting ₹499.",
  keywords: [
    "full body checkup at home",
    "book lab test online India",
    "Thyrocare home collection",
    "health checkup packages",
    "preventive health checkup",
    "blood test at home",
    "NABL accredited lab",
    "affordable full body checkup",
    "Ayropath",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Full Body Checkup at Home – Book Lab Tests Online | Ayropath",
    description:
      "Book full body checkup with 80+ parameters. Free home sample collection across India. NABL & Thyrocare labs. Digital reports in 24–48 hrs.",
    url: siteUrl,
    siteName: "Ayropath",
    locale: "en_IN",
    type: "website",
  },
};

// WebSite schema — enables Google Sitelinks Searchbox
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ayropath",
  url: siteUrl,
  description:
    "India's trusted platform for full body checkups & lab tests at home. Powered by Thyrocare.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/profiles?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <div className="max-w-7xl mx-auto sm:px-6 py-10">
        {/* Visually-hidden H1 for SEO — the Hero carries the visual headline */}
        <h1 className="sr-only">
          Full Body Checkup at Home – Book Affordable Health Packages by Thyrocare | Ayropath
        </h1>

        <Hero />

        {/* Packages Section */}
        <div className="mb-8">
          <ProfilePage limit={4} />
          <div className="text-right px-4 sm:px-6">
            <Link href="/profiles" className="text-blue-600 hover:underline font-medium">
              See More
            </Link>
          </div>
        </div>

        {/* Offers Section */}
        <div className="mb-8">
          <OfferPage limit={8} />
          <div className="text-right px-4 sm:px-6">
            <Link href="/offers" className="text-blue-600 hover:underline font-medium">
              See More
            </Link>
          </div>
        </div>

        {/* Tests Section */}
        <div className="mb-8">
          <TestPage limit={8} />
          <div className="text-right px-4 sm:px-6">
            <Link href="/tests" className="text-blue-600 hover:underline font-medium">
              See More
            </Link>
          </div>
        </div>

        <HomeCarousel />
      </div>
    </>
  );
}
