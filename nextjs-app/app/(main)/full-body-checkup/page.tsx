import type { Metadata } from "next";
import Link from "next/link";
import connectToDatabase from "@/lib/db/mongoose";
import Profile from "@/lib/models/Profile";
import { slugify } from "@/lib/slugify";
import { CheckCircle, Home, Zap, Clock, Shield, MapPin } from "lucide-react";

export const revalidate = 86400; // Cache 24 hours

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export const metadata: Metadata = {
  title:
    "Full Body Checkup at Home – Affordable Health Packages by Thyrocare | Ayropath",
  description:
    "Get a comprehensive full body checkup with 80+ parameters. NABL & CAP certified Thyrocare labs, free home sample collection across India, digital reports in 24 hrs. Book now starting ₹499.",
  keywords: [
    "full body checkup",
    "full body checkup at home",
    "full body checkup near me",
    "full body checkup packages India",
    "Thyrocare full body checkup",
    "health checkup packages",
    "preventive health checkup",
    "blood test at home",
    "home sample collection",
    "affordable health checkup",
    "full body checkup under 1000",
    "NABL accredited lab",
    "CAP accredited Thyrocare",
    "complete blood count test",
    "80 parameter health test",
    "100 parameter health test",
    "full body checkup for women",
    "health checkup for senior citizens",
    "diabetes screening package",
    "cardiac risk profile test",
  ],
  alternates: { canonical: "/full-body-checkup" },
  openGraph: {
    title:
      "Full Body Checkup at Home – Affordable Thyrocare Packages | Ayropath",
    description:
      "Book full body checkup online. 80+ parameters, NABL certified Thyrocare labs, free home collection, reports in 24 hrs.",
    type: "website",
    siteName: "Ayropath",
    locale: "en_IN",
    url: `${siteUrl}/full-body-checkup`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Body Checkup at Home | Ayropath",
    description:
      "Book full body checkup with 80+ parameters. NABL & CAP certified labs, free home collection.",
  },
};

// ─── Structured Data ─────────────────────────────────────────────────────────

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
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Book a Full Body Checkup at Home with Ayropath",
  description:
    "Book a comprehensive full body checkup from the comfort of your home in 3 simple steps.",
  totalTime: "PT10M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Select Your Package",
      text: "Choose from Thyrocare health packages like Aarogyam, full body checkup under ₹999, or condition-specific profiles.",
      url: `${siteUrl}/profiles`,
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Schedule Home Collection",
      text: "Pick a convenient time slot. Our certified phlebotomist visits your home for sample collection at zero extra cost.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Get Digital Reports",
      text: "Receive your comprehensive test reports online within 24–48 hours, processed at NABL & CAP accredited Thyrocare labs.",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is included in a full body checkup?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A full body checkup typically includes 60–100+ parameters covering CBC (complete blood count), liver function tests (LFT), kidney function tests (KFT), thyroid profile (TSH/T3/T4), lipid profile, blood sugar/HbA1c, Vitamin D, Vitamin B12, iron studies, and urine analysis. Ayropath's Thyrocare packages cover all these and more.",
      },
    },
    {
      "@type": "Question",
      name: "Is fasting required for a full body checkup?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most full body checkup packages require 10–12 hours of fasting for accurate blood sugar and lipid readings. You may drink plain water. For packages not requiring fasting, you can book at any time of day.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a full body checkup cost in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Full body checkup prices range from ₹499 (basic 60-parameter packages) to ₹3,000+ (premium 100+ parameter packages with vitamins and hormones). Ayropath offers Thyrocare packages starting at ₹499 with free home collection included.",
      },
    },
    {
      "@type": "Question",
      name: "Are Ayropath labs NABL accredited?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Ayropath processes all tests at Thyrocare's NABL and CAP accredited laboratories — among the most advanced automated labs in Asia. This ensures internationally standardised accuracy for every test.",
      },
    },
    {
      "@type": "Question",
      name: "How quickly will I receive my test reports?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most full body checkup reports are delivered digitally within 24–48 hours after sample collection. Urgent reports for select tests are available sooner.",
      },
    },
    {
      "@type": "Question",
      name: "Is home sample collection available in my city?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ayropath offers free home sample collection across 200+ cities in India including Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Jaipur, and Lucknow.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between Aarogyam 1.1, Aarogyam C, and Aarogyam B?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Aarogyam packages are Thyrocare's flagship full body checkup profiles. Aarogyam 1.1 covers 72 parameters and is ideal for a basic annual check. Aarogyam C includes 98 parameters with thyroid. Aarogyam B covers 64 parameters for routine check. All include CBC, liver, kidney, lipid, and thyroid tests.",
      },
    },
  ],
};

const medicalWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Full Body Checkup at Home – Ayropath",
  url: `${siteUrl}/full-body-checkup`,
  description:
    "Comprehensive guide to full body checkup packages by Thyrocare. Book online with free home sample collection across India.",
  about: {
    "@type": "MedicalTest",
    name: "Full Body Checkup",
    description:
      "A comprehensive panel of 60–100+ diagnostic tests covering blood, liver, kidney, thyroid, lipid profile and more.",
    usedToDiagnose: [
      { "@type": "MedicalCondition", name: "Diabetes" },
      { "@type": "MedicalCondition", name: "Thyroid Disorder" },
      { "@type": "MedicalCondition", name: "Anemia" },
      { "@type": "MedicalCondition", name: "Vitamin D Deficiency" },
      { "@type": "MedicalCondition", name: "Kidney Disease" },
      { "@type": "MedicalCondition", name: "Liver Disease" },
    ],
  },
};

// ─── Static Data ──────────────────────────────────────────────────────────────

const parameterTiers = [
  {
    label: "Basic",
    params: "60–72",
    highlight: "CBC, Liver, Kidney, Lipid",
    price: "₹499–₹799",
    bestFor: "Annual health check",
    color: "blue",
  },
  {
    label: "Advanced",
    params: "80–98",
    highlight: "+ Thyroid, Blood Sugar, Iron",
    price: "₹799–₹1,499",
    bestFor: "Comprehensive screening",
    color: "indigo",
  },
  {
    label: "Premium",
    params: "100+",
    highlight: "+ Vitamins D/B12, Hormones, Cardiac",
    price: "₹1,499–₹2,999",
    bestFor: "Complete health audit",
    color: "purple",
  },
];

const trustPoints = [
  { icon: Shield, text: "NABL & CAP Accredited Labs" },
  { icon: Home, text: "Free Home Sample Collection" },
  { icon: Clock, text: "Reports in 24–48 Hours" },
  { icon: CheckCircle, text: "200+ Cities Covered" },
  { icon: Zap, text: "Instant Online Booking" },
  { icon: MapPin, text: "Thyrocare Certified Network" },
];

const cityList = [
  { name: "Delhi", slug: "delhi" },
  { name: "Mumbai", slug: "mumbai" },
  { name: "Bengaluru", slug: "bengaluru" },
  { name: "Hyderabad", slug: "hyderabad" },
  { name: "Chennai", slug: "chennai" },
  { name: "Pune", slug: "pune" },
  { name: "Kolkata", slug: "kolkata" },
  { name: "Ahmedabad", slug: "ahmedabad" },
  { name: "Jaipur", slug: "jaipur" },
  { name: "Lucknow", slug: "lucknow" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FullBodyCheckupPage() {
  await connectToDatabase();

  // Fetch top 6 packages to showcase
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

  return (
    <>
      {/* ── Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(medicalWebPageJsonLd),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* ── Hero / H1 Section ── */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Breadcrumb */}
            <nav className="flex justify-center items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-800 font-medium">
                Full Body Checkup
              </span>
            </nav>

            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Full Body Checkup at Home —{" "}
              <span className="text-blue-600">
                Affordable Thyrocare Packages
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Comprehensive health screening with 60–100+ parameters. NABL &
              CAP accredited labs, free home sample collection across India &
              digital reports in 24 hours. Book starting{" "}
              <strong className="text-blue-700">₹499</strong>.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/profiles"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                <CheckCircle size={20} />
                Book Full Body Checkup
              </Link>
              <Link
                href="/tests"
                className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors"
              >
                Browse Individual Tests
              </Link>
            </div>
          </div>
        </section>

        {/* ── Trust Signals ── */}
        <section className="bg-blue-600 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {trustPoints.map((tp, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center text-white gap-2"
                >
                  <tp.icon className="w-6 h-6 text-blue-200" />
                  <span className="text-xs font-semibold leading-tight">
                    {tp.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
          {/* ── What is a Full Body Checkup? ── */}
          <section aria-labelledby="what-is-heading">
            <h2
              id="what-is-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6"
            >
              What is a Full Body Checkup?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
              <p>
                A <strong>full body checkup</strong> is a comprehensive
                preventive health screening that assesses your overall health
                through a wide panel of blood tests and diagnostic markers. It
                helps detect common medical conditions like diabetes, thyroid
                disorders, anaemia, vitamin deficiencies, liver disease, and
                kidney dysfunction — often before symptoms appear.
              </p>
              <p>
                Doctors recommend a yearly full body checkup for adults over 30
                and twice a year for those above 45. Early detection through
                routine screening can significantly reduce the risk of serious
                health complications and lower lifetime healthcare costs.
              </p>
              <p>
                Ayropath partners with{" "}
                <strong>Thyrocare Technologies</strong> — India's largest
                automated diagnostic lab — to offer affordable, accurate full
                body checkup packages with free home sample collection.
              </p>
            </div>
          </section>

          {/* ── Parameter Comparison Table ── */}
          <section aria-labelledby="packages-heading">
            <h2
              id="packages-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8"
            >
              Full Body Checkup Package Comparison
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {parameterTiers.map((tier, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border-2 p-8 hover:shadow-lg transition-shadow ${
                    i === 1
                      ? "border-blue-500 shadow-blue-100 shadow-md"
                      : "border-gray-100"
                  }`}
                >
                  {i === 1 && (
                    <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                    {tier.label} Checkup
                  </h3>
                  <p className="text-3xl font-black text-blue-700 mb-2">
                    {tier.params}{" "}
                    <span className="text-base font-medium text-gray-500">
                      parameters
                    </span>
                  </p>
                  <p className="text-sm font-semibold text-gray-600 mb-1">
                    {tier.highlight}
                  </p>
                  <p className="text-lg font-bold text-gray-800 mb-4">
                    {tier.price}
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    Best for: {tier.bestFor}
                  </p>
                  <Link
                    href="/profiles"
                    className="block text-center bg-blue-600 text-white rounded-full px-6 py-2.5 font-bold hover:bg-blue-700 transition-colors"
                  >
                    View Packages
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              All packages include{" "}
              <strong>free home sample collection</strong> and digital reports.
            </p>
          </section>

          {/* ── Top Packages from DB ── */}
          {packages.length > 0 && (
            <section aria-labelledby="top-packages-heading">
              <h2
                id="top-packages-heading"
                className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8"
              >
                Popular Full Body Checkup Packages
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
                  See All Health Packages
                </Link>
              </div>
            </section>
          )}

          {/* ── What's Typically Included ── */}
          <section aria-labelledby="included-heading">
            <h2
              id="included-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8"
            >
              What&apos;s Included in a Full Body Checkup?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  category: "Complete Blood Count (CBC)",
                  tests: [
                    "Haemoglobin",
                    "RBC Count",
                    "WBC Count",
                    "Platelet Count",
                    "Haematocrit",
                  ],
                },
                {
                  category: "Thyroid Profile",
                  tests: ["TSH", "T3 (Triiodothyronine)", "T4 (Thyroxine)"],
                },
                {
                  category: "Liver Function Test (LFT)",
                  tests: [
                    "SGOT (AST)",
                    "SGPT (ALT)",
                    "Alkaline Phosphatase",
                    "Total Bilirubin",
                    "Total Protein",
                    "Albumin",
                  ],
                },
                {
                  category: "Kidney Function Test (KFT)",
                  tests: [
                    "Creatinine",
                    "Blood Urea Nitrogen",
                    "Uric Acid",
                    "eGFR",
                  ],
                },
                {
                  category: "Lipid Profile",
                  tests: [
                    "Total Cholesterol",
                    "HDL Cholesterol",
                    "LDL Cholesterol",
                    "Triglycerides",
                  ],
                },
                {
                  category: "Blood Sugar & Diabetes",
                  tests: ["Fasting Glucose", "HbA1c", "Post-Prandial Glucose"],
                },
                {
                  category: "Vitamins (Premium Packages)",
                  tests: ["Vitamin D Total", "Vitamin B12", "Folate"],
                },
                {
                  category: "Urine Analysis",
                  tests: ["Colour", "pH", "Protein", "Glucose", "Cells"],
                },
              ].map((group, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                >
                  <h3 className="font-extrabold text-gray-900 mb-3">
                    {group.category}
                  </h3>
                  <ul className="space-y-1">
                    {group.tests.map((test, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        {test}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── How It Works ── */}
          <section aria-labelledby="how-it-works-heading">
            <h2
              id="how-it-works-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 text-center"
            >
              How to Book Full Body Checkup at Home
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Select Package",
                  desc: "Choose from Thyrocare full body checkup packages starting ₹499. Filter by parameter count, condition, or price.",
                },
                {
                  step: "02",
                  title: "Schedule Collection",
                  desc: "Pick your preferred time slot. A certified phlebotomist visits your home — free of charge, pan India.",
                },
                {
                  step: "03",
                  title: "Get Reports Online",
                  desc: "Receive comprehensive digital reports within 24–48 hours, processed by NABL & CAP accredited Thyrocare labs.",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="relative bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-lg transition-shadow"
                >
                  <span className="text-6xl font-black text-blue-50 absolute top-4 right-6">
                    {s.step}
                  </span>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-3 relative z-10">
                    {s.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── City Links ── */}
          <section aria-labelledby="cities-heading">
            <h2
              id="cities-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6"
            >
              Full Body Checkup by City
            </h2>
            <p className="text-gray-600 mb-8">
              Free Thyrocare home collection available across 200+ cities in
              India. Find packages and book in your city:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {cityList.map((city) => (
                <Link
                  key={city.slug}
                  href={`/full-body-checkup/${city.slug}`}
                  className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-semibold text-gray-700 hover:text-blue-700"
                >
                  <MapPin size={14} className="text-blue-500" />
                  {city.name}
                </Link>
              ))}
            </div>
          </section>

          {/* ── FAQ Section ── */}
          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8"
            >
              Frequently Asked Questions — Full Body Checkup
            </h2>
            <div className="space-y-6">
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
        </div>
      </div>
    </>
  );
}
