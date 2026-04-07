import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CITIES, getCityBySlug } from "@/lib/cityData";
import connectToDatabase from "@/lib/db/mongoose";
import Profile from "@/lib/models/Profile";
import { slugify } from "@/lib/slugify";
import { CheckCircle, MapPin, Clock, Shield, Home } from "lucide-react";

export const revalidate = 86400;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

// ─── Static Params ─────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

// ─── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: "Not Found" };

  return {
    title: `Full Body Checkup in ${city.name} – Home Sample Collection | Ayropath`,
    description: city.description,
    keywords: [
      `full body checkup ${city.name}`,
      `full body checkup in ${city.name}`,
      `blood test at home ${city.name}`,
      `health checkup packages ${city.name}`,
      `Thyrocare home collection ${city.name}`,
      `Thyrocare ${city.name}`,
      `lab test ${city.name}`,
      `preventive health checkup ${city.name}`,
      `full body checkup near me ${city.name}`,
      `affordable health checkup ${city.name}`,
      `NABL accredited lab ${city.name}`,
      `home sample collection ${city.name}`,
    ],
    alternates: { canonical: `/full-body-checkup/${city.slug}` },
    openGraph: {
      title: `Full Body Checkup in ${city.name} – Free Home Collection | Ayropath`,
      description: city.description,
      url: `${siteUrl}/full-body-checkup/${city.slug}`,
      siteName: "Ayropath",
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Full Body Checkup in ${city.name} | Ayropath`,
      description: city.description,
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function CityCheckupPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  await connectToDatabase();
  const topPackages = await Profile.find({ isActive: true })
    .select(
      "name type code customPricing thyrocareData.rate thyrocareData.testCount"
    )
    .sort({ "thyrocareData.bookedCount": -1 })
    .limit(6)
    .lean();

  const packages = (topPackages as any[]).map((p) => ({
    code: p.code,
    name: p.name,
    type: p.type,
    testCount: p.thyrocareData?.testCount || 0,
    price: p.customPricing?.sellingPrice || p.thyrocareData?.rate?.b2C || 0,
    slug: slugify(p.name || "health-package"),
  }));

  // ── Structured Data ──

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Full Body Checkup",
        item: `${siteUrl}/full-body-checkup`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: city.name,
        item: `${siteUrl}/full-body-checkup/${city.slug}`,
      },
    ],
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: `Ayropath – Full Body Checkup ${city.name}`,
    description: city.description,
    url: `${siteUrl}/full-body-checkup/${city.slug}`,
    telephone: "+91-9999999999",
    email: "admin@ayropath.com",
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "State",
        name: city.state,
        containedInPlace: {
          "@type": "Country",
          name: "India",
        },
      },
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: city.lat,
      longitude: city.lng,
    },
    medicalSpecialty: "Pathology",
    isPartOf: {
      "@type": "Organization",
      name: "Ayropath Technologies Limited",
      url: siteUrl,
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is home sample collection available in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Ayropath provides free home sample collection across all major zones of ${city.name}, ${city.state}. A certified Thyrocare phlebotomist visits your home at your preferred time slot.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the cost of full body checkup in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Full body checkup packages in ${city.name} start from ₹499 (basic 60-parameter panel) to ₹2,999 (premium 100+ parameters with vitamins). All packages include free home sample collection and digital reports within 24–48 hours.`,
        },
      },
      {
        "@type": "Question",
        name: `How long does it take to receive reports in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${city.deliveryNote || `Reports are delivered digitally within 24–48 hours for most ${city.name} bookings.`} All samples are processed at NABL & CAP accredited Thyrocare laboratories.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link
                href="/full-body-checkup"
                className="hover:text-blue-600 transition-colors"
              >
                Full Body Checkup
              </Link>
              <span>/</span>
              <span className="text-gray-800 font-medium">{city.name}</span>
            </nav>

            <div className="flex items-start gap-3 mb-4">
              <div className="bg-blue-100 text-blue-700 rounded-full p-2 mt-1">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                  Full Body Checkup in {city.name} —{" "}
                  <span className="text-blue-600">Free Home Collection</span>
                </h1>
                <p className="text-lg text-gray-600 mt-3 max-w-3xl leading-relaxed">
                  {city.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/profiles"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                <CheckCircle size={20} />
                Book Now in {city.name}
              </Link>
              <Link
                href="/full-body-checkup"
                className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors"
              >
                View All Packages
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 mt-10 pt-10 border-t border-gray-100">
              {[
                {
                  icon: Shield,
                  label: "NABL & CAP Accredited Labs",
                  color: "text-green-600",
                },
                {
                  icon: Home,
                  label: "Free Home Collection",
                  color: "text-blue-600",
                },
                {
                  icon: Clock,
                  label: "Reports in 24–48 Hours",
                  color: "text-indigo-600",
                },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <badge.icon className={`w-5 h-5 ${badge.color}`} />
                  {badge.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
          {/* ── City-Specific Context ── */}
          <section aria-labelledby="city-context-heading">
            <h2
              id="city-context-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6"
            >
              Full Body Checkup in {city.name} — Why It Matters
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p>{city.bodyBlurb}</p>
            </div>
          </section>

          {/* ── Package Listings ── */}
          {packages.length > 0 && (
            <section aria-labelledby="city-packages-heading">
              <h2
                id="city-packages-heading"
                className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8"
              >
                Available Full Body Checkup Packages in {city.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <Link
                    key={pkg.code}
                    href={`/profiles/${pkg.slug}/${pkg.type}/${pkg.code}`}
                    className="group border border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg transition-all"
                  >
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                      {pkg.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {pkg.testCount} parameters
                      </span>
                      <span className="font-black text-blue-700 text-lg">
                        ₹{pkg.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Includes free home collection in {city.name}
                    </p>
                    <span className="inline-block mt-4 text-xs font-bold text-blue-600 group-hover:underline">
                      View & Book →
                    </span>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link
                  href="/profiles"
                  className="inline-block border border-blue-600 text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors"
                >
                  See All Packages Available in {city.name}
                </Link>
              </div>
            </section>
          )}

          {/* ── FAQ ── */}
          <section aria-labelledby="city-faq-heading">
            <h2
              id="city-faq-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8"
            >
              FAQs — Full Body Checkup in {city.name}
            </h2>
            <div className="space-y-5">
              {faqJsonLd.mainEntity.map((faq, i) => (
                <div
                  key={i}
                  className="border border-gray-100 rounded-2xl p-6 bg-gray-50"
                >
                  <h3 className="font-extrabold text-gray-900 mb-3">
                    {faq.name}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Other Cities ── */}
          <section aria-labelledby="other-cities-heading">
            <h2
              id="other-cities-heading"
              className="text-xl font-extrabold text-gray-900 mb-5"
            >
              Full Body Checkup in Other Cities
            </h2>
            <div className="flex flex-wrap gap-3">
              {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
                <Link
                  key={c.slug}
                  href={`/full-body-checkup/${c.slug}`}
                  className="inline-flex items-center gap-1 border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all"
                >
                  <MapPin size={12} className="text-blue-400" />
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
