import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import HomeCarousel from "@/components/home/HomeCarousel";
import HealthConcernSection from "@/components/home/HealthConcernSection";
import HowItWorks from "@/components/home/HowItWorks";
import TrustStats from "@/components/home/TrustStats";
import ProfilePage from "./profiles/page";
import OfferPage from "./offers/page";
import TestPage from "./tests/page";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export const metadata: Metadata = {
  title: {
    absolute: "Online Full Body Checkup & Blood Tests at Home | Ayropath",
  },
  description:
    "Book full body checkups & blood tests online with Ayropath. Home sample collection, accurate results & easy reports. Book your test today.",
  keywords: [
    // Primary keywords from Google Doc & Spreadsheet
    "affordable full body checkup online",
    "full body checkup with free home collection online",
    "book blood tests online with home collection",
    "health checkup packages for adults online",
    "complete blood test package price",
    "home blood collection with online reports",
    "preventive health checkup online",
    "executive health checkup online",
    "online full body checkup",
    "Preventive health checkup",
    "Executive health checkup",
    "preventive health checkups at home",
    "online lab test booking India",
    "Thyrocare health packages",
    "NABL accredited lab tests",
    "Thyrocare labs",
    "health packages India",
    "diagnostic tests online",
    "wellness checkup",
    // Core booking
    "book blood test online", "order blood test online", "online lab test booking",
    "book lab test online India", "book health test online India",
    // At-home
    "blood test at home", "home blood test", "lab test home collection",
    "full body checkup at home", "free home sample collection",
    // Thyrocare branded
    "Thyrocare home collection", "Thyrocare full body checkup",
    "Thyrocare CBC test", "Thyrocare home sample collection",
    // Generic checkup
    "online health checkup", "complete health checkup online", "annual health checkup online",
    "health checkup packages",
    // Specific tests
    "online vitamin D test", "online thyroid blood test",
    "online HbA1c test", "online liver function test",
    // Priority profile names
    "Executive Full Body Health Checkup", "Complete Health Checkup with Vitamins",
    "Aarogyam Tax Saver Basic", "Aarogyam Tax Saver Advanced",
    "New Aarogyam Basic with USTSH",
    "Aarogyam Male", "Aarogyam Female",
    "Senior Citizen Profile Male", "Senior Citizen Profile Female",
    // Tax
    "section 80D health checkup", "tax saver health package",
    // Local
    "blood test Jamshedpur", "lab test Jamshedpur home collection",
    "diagnostic lab Jharkhand", "health checkup Jamshedpur",
    // Informational
    "difference between aarogyam packages", "which thyrocare package is best",
    "fasting required for blood test", "NABL accredited lab",
    "blood test without prescription", "Ayropath",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Online Full Body Checkup & Blood Tests at Home | Ayropath",
    description:
      "Book full body checkups & blood tests online with Ayropath. Home sample collection, accurate results & easy reports. Book your test today.",
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

// FAQPage JSON-LD — matching Google Doc Q&A exactly
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I book a blood test on Ayropath?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Browse packages or individual tests, select your preferred option and time slot, and confirm your address. A certified phlebotomist will visit at the chosen time, and reports follow within 24–48 hours.",
      },
    },
    {
      "@type": "Question",
      name: "What is included in a full body checkup?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A typical checkup includes a complete blood count, liver and kidney function tests, thyroid profile, lipid profile, blood sugar and HbA1c, vitamin D and B12, iron studies, uric acid and urine analysis. The exact list depends on the package.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to fast before the test?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many packages require fasting for 10 to 12 hours, and you can usually drink plain water. Each package page and your booking confirmation mention the fasting requirement.",
      },
    },
    {
      "@type": "Question",
      name: "Is sample collection at home safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Certified Thyrocare phlebotomists use sterile, single-use equipment, and samples travel in bio-safe containers to NABL & CAP accredited laboratories.",
      },
    },
    {
      "@type": "Question",
      name: "Can I book tests without a doctor's prescription?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most diagnostic tests can be booked directly. If you are unsure which tests you need, choose a package that matches your age and health goals, or consult your doctor.",
      },
    },
    {
      "@type": "Question",
      name: "Can I claim a tax deduction on my checkup?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Under Section 80D, you can claim up to ₹5,000 a year for preventive health checkups. The Aarogyam Tax Saver packages are built for this, and your payment receipt works as proof.",
      },
    },
  ],
};



export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Hero — includes main H1 + introductory prose */}
        <Hero />

        {/* Category tiles */}
        <CategoryGrid />

        {/* Promotional banners */}
        <div className="px-4 mb-10">
          <HomeCarousel />
        </div>

        {/* Tests by Health Concern — dynamic, DB-backed */}
        <HealthConcernSection />

        {/* Popular Health Packages */}
        <section className="mb-10">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-lg font-bold text-gray-900">Popular Full Body Health Checkup Packages from Thyrocare</h2>
            <Link href="/profiles" className="text-sm font-medium text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="px-4 mb-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Ayropath offers a diverse range of <strong>health checkup packages</strong> meticulously designed to cater to every individual&apos;s specific needs. From age-specific and gender-specific screenings to comprehensive executive and basic options, our selection ensures everyone finds their ideal match. Explore our popular <strong>Thyrocare health packages</strong> or consider a <strong>complete blood test package price</strong> that fits your budget. Each package includes various essential parameters at competitive prices. For ultimate convenience, you can book your <strong>full body checkup with free home collection online</strong>, making vital health monitoring accessible and hassle-free. Discover our extensive <strong>health checkup packages for adults online</strong> today and invest in your well-being.
            </p>
          </div>
          <ProfilePage limit={4} showHeader={false} mobileScroll={true} />
        </section>

        {/* Offers */}
        <section className="mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Exclusive Offers on Health Checkup Packages &amp; Lab Tests</h2>
            <Link href="/offers" className="text-sm font-medium text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <OfferPage limit={6} showHeader={false} mobileScroll={true} />
        </section>

        {/* Book Blood Tests Online with Home Collection */}
        <section className="px-4 mb-10 max-w-7xl mx-auto">
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100 mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
              Book Blood Tests Online with Home Collection
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              You do not always need a complete package. Your doctor may have asked for just one or two tests, or you may want to monitor a known condition. In that case, you can <strong>book blood tests online with home collection</strong> in under two minutes. Search for the test, choose a convenient slot, enter your address and confirm. Most diagnostic tests can be booked directly, without a prescription.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="bg-white p-4 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">Popular Individual Tests (Starting from ₹199)</h3>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• Thyroid profile</li>
                  <li>• Routine Urine Analysis</li>
                  <li>• Liver function test (LFT)</li>
                  <li>• Kidney function test (KFT)</li>
                  <li>• Vitamin D test</li>
                </ul>
                <p className="mt-2.5 text-xs text-gray-500">
                  Not sure which test you need? Browse by health concern, such as thyroid, diabetes, heart health, liver, kidney or anemia.
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Have a Prescription?</h3>
                  <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                    If your doctor has given you a list of tests, you can upload the prescription and we will help you find the matching tests, so nothing gets missed.
                  </p>
                </div>
                <div className="mt-3">
                  <Link
                    href="/prescription"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Upload Prescription Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Popular Lab Tests: Individual Blood Tests
          </h3>
          <TestPage limit={6} showHeader={false} mobileScroll={true} />
        </section>

        {/* Health Checkup Packages for Adults Online */}
        <section className="px-4 mb-10 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 rounded-3xl p-6 sm:p-8 border border-indigo-100">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
              Health Checkup Packages for Adults Online
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              A good checkup depends on your age, lifestyle and family history. Our <strong>health checkup packages for adults online</strong> are designed so that you can match a package to your needs instead of paying for tests you do not require. Each package page lists every parameter included, so you can compare options with confidence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-3">Choose a Package That Fits You</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li><strong>Routine annual screening:</strong> Aarogyam Basic and Doctor Recommended Full Body Checkup Basic cover the essentials.</li>
                  <li><strong>Wider screening with vitamins:</strong> Complete Health Check with Vitamins and Advanced Full Body Checkup add vitamin D and B12 to core panels.</li>
                  <li><strong>Gender-specific care:</strong> Aarogyam Male and Aarogyam Female focus on risks that matter most to each group.</li>
                  <li><strong>Parents and elders:</strong> Senior Citizen Profiles for males and females support age-related health monitoring.</li>
                  <li><strong>Diabetes care:</strong> The Jaanch Diabetic Profile supports regular sugar monitoring.</li>
                </ul>
              </div>
              <div className="bg-white/80 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Save Tax While You Stay Healthy</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Preventive checkup expenses of up to ₹5,000 a year can qualify for a deduction under Section 80D of the Income Tax Act. The Aarogyam Tax Saver packages are designed for this purpose, and your Ayropath payment receipt serves as documentation. It is a simple way to look after your health and your finances together.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/profiles"
                    className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Explore Tax Saver Packages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Complete Blood Test Package Price */}
        <section className="px-4 mb-10 max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
              Complete Blood Test Package Price
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Cost is usually the first question people ask. The <strong>complete blood test package price</strong> at Ayropath depends on how many parameters a package covers and whether it includes extras such as vitamins, hormones or cardiac markers. A wider panel naturally costs more, but it also gives you a fuller picture of your health.
            </p>
            
            <h3 className="font-bold text-gray-900 text-base mb-3">Sample Package Prices</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-900 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Tests Included</th>
                    <th className="py-3 px-4">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 text-xs sm:text-sm">
                  <tr>
                    <td className="py-3 px-4 font-medium">Advanced Full Body Checkup with Vitamins</td>
                    <td className="py-3 px-4">92</td>
                    <td className="py-3 px-4 font-bold text-blue-700">₹1,800</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Complete Health Check with Vitamins</td>
                    <td className="py-3 px-4">122</td>
                    <td className="py-3 px-4 font-bold text-blue-700">₹2,099</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Aarogyam Male Package</td>
                    <td className="py-3 px-4">103</td>
                    <td className="py-3 px-4 font-bold text-blue-700">₹2,799</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Extensive Full Body Health Checkup</td>
                    <td className="py-3 px-4">127</td>
                    <td className="py-3 px-4 font-bold text-blue-700">₹3,699</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              * Prices are as listed on the website and may change with offers. Please check the packages page for current rates.
            </p>

            <h3 className="font-bold text-gray-900 text-sm mb-1.5">What Affects the Price?</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              The number of tests, the inclusion of advanced markers and any running discounts all play a part. Compare packages side by side and read the test list before choosing, so you pay only for what suits you.
            </p>
          </div>
        </section>

        {/* Home Blood Collection with Online Reports */}
        <section className="px-4 mb-10 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-teal-50/70 via-white to-blue-50/70 rounded-3xl p-6 sm:p-8 border border-teal-100">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
              Home Blood Collection with Online Reports
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Convenience should not end when the sample leaves your home. With <strong>home blood collection with online reports</strong>, the whole journey, from booking to results, happens without a single trip to the lab.
            </p>
            <h3 className="font-bold text-gray-900 text-sm mb-1.5">Digital Reports in 24–48 Hours</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Your results arrive within 24 to 48 hours of sample pickup. They are sent to your registered email and stored in your Ayropath account as a downloadable PDF. You can open them anytime, share them with your doctor in seconds, and compare them with future results to track changes over the years.
            </p>
          </div>
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Trust stat bar */}
        <TrustStats />

        {/* Why Customers Trust Us for Preventive Health Checkups? */}
        <section className="px-4 mt-16 mb-10 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-teal-50/60 rounded-3xl p-6 sm:p-8 border border-blue-100">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
              Why Customers Trust Us for Preventive Health Checkups?
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              People choose Ayropath because we keep the process simple and the pricing honest. Here is what you can expect:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                <span>Testing at NABL &amp; CAP accredited laboratories</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                <span>Over 500 tests and health packages to choose from</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                <span>Individual tests starting from ₹199</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                <span>Service across 200+ cities in India</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                <span>Special offers and seasonal discounts on popular packages</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Full Body Checkup with Free Home Collection Online */}
        <section className="px-4 mb-10 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
              Full Body Checkup with Free Home Collection Online
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Many of us postpone routine screening because visiting a diagnostic centre feels like a chore. This is especially true for working professionals, new parents and senior citizens. A <strong>full body checkup with free home collection online</strong> removes that barrier. You pick a package and a time slot, and a certified phlebotomist arrives at your door at no extra cost.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 text-base mb-3">How the Home Visit Works?</h3>
                <ol className="space-y-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed list-decimal list-inside">
                  <li><strong>Book online:</strong> Choose a package and a time slot, then enter your address.</li>
                  <li><strong>Prepare:</strong> Most packages need an overnight fast of 10 to 12 hours. Plain water is fine. Your booking confirmation explains exactly how to prepare.</li>
                  <li><strong>Sample collection:</strong> The phlebotomist uses sterile, single-use equipment and carries your samples in bio-safe containers directly to the lab.</li>
                  <li><strong>Get reports:</strong> Results reach your email and your Ayropath account within 24 to 48 hours of pickup.</li>
                </ol>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">Who Benefits The Most?</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    This option suits elderly parents who find travel difficult, people with tight work schedules, and anyone who wants a stress-free first checkup. It also works well when the whole family wants to be tested on the same day.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href="tel:9955955296"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    <span>📞</span> Contact Us: 9955955296
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Ayropath? ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="why-ayropath-heading" className="mt-16 px-4 sm:px-0 bg-gray-50 rounded-3xl p-8 md:p-12">
          <h2 id="why-ayropath-heading" className="text-2xl font-extrabold text-gray-900 mb-6">
            Why Choose Ayropath for Your Online Full Body Checkup &amp; Lab Tests?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-700 leading-relaxed">
            <div>
              <p className="mb-4">
                Ayropath stands as India&apos;s premier platform for convenient{" "}
                <strong>online lab test booking</strong> and comprehensive{" "}
                <strong>full body checkup packages at home</strong>. Partnering with
                Thyrocare, India&apos;s largest automated diagnostic lab, we ensure
                every test is processed at{" "}
                <Link href="/lab-standards" className="font-semibold text-blue-700 hover:underline">
                  NABL &amp; CAP accredited laboratories
                </Link>{" "}
                with internationally benchmarked accuracy.
              </p>
              <p className="mb-4">
                Whether you seek a complete{" "}
                <Link href="/full-body-checkup" className="font-semibold text-blue-700 hover:underline">
                  preventive health checkup online
                </Link>
                , an annual wellness assessment, or specific diagnostic tests like
                a <strong>thyroid profile</strong>, <strong>HbA1c</strong>, or{" "}
                <strong>Vitamin D test</strong> – Ayropath provides the most
                competitive Thyrocare pricing, complete with{" "}
                <strong>free home sample collection</strong> across 200+ Indian
                cities. Before tests, make sure to{" "}
                <Link href="/blog/how-to-prepare-for-fasting-blood-test" className="text-blue-600 hover:underline font-medium">
                  prepare for fasting blood test
                </Link>
                .
              </p>
              <p className="mb-4">
                Our certified phlebotomists conduct collections at your preferred
                time using sterile, single-use equipment, ensuring no queues or travel.
                Your digital lab test reports are delivered within{" "}
                <strong>24–48 hours</strong>, readily accessible from your Ayropath
                account.
              </p>
              <div className="bg-white/80 p-4 rounded-xl border border-gray-200 mt-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 mb-1">
                  Comprehensive Health Assessments for Every Need
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ayropath empowers you with tailored diagnostic solutions, making comprehensive health assessments accessible from the comfort of your home. Whether you need routine blood work or highly specialized panels, our convenient diagnostic tests online cover a full spectrum of health needs, ensuring a complete and insightful overview of your well-being.
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 mb-4">What Sets Ayropath Apart for Your Health Checkup Needs?</h3>
              <ul className="space-y-3">
                {[
                  { title: "NABL & CAP Accredited Labs", desc: <>Tests processed at <Link href="/lab-standards" className="text-blue-600 hover:underline font-medium">NABL &amp; CAP accredited laboratories</Link> — trusted by 2,000+ hospitals across India.</> },
                  { title: "Free Home Sample Collection", desc: "A certified phlebotomist visits your home at zero extra cost, pan India." },
                  { title: "Thyrocare Aarogyam Packages", desc: <>Detailed checkup profiles including <Link href="/blog/thyrocare-aarogyam-packages-explained" className="text-blue-600 hover:underline font-medium">Thyrocare Aarogyam packages</Link> customized for all age groups.</> },
                  { title: "Section 80D Tax Benefit", desc: "Preventive health checkup expenses up to ₹5,000 per year are eligible for tax deduction under Section 80D." },
                  { title: "Digital Reports in 24–48 hrs", desc: "Receive your full lab report by email and download your PDF anytime from your account." },
                  { title: "Book Without Prescription", desc: "Most diagnostic lab tests can be booked directly online without a doctor's prescription." },
                  { title: "Starting at ₹499", desc: "Starting at just ₹499, access affordable full body checkup packages online, meticulously covering 60–100+ parameters. Our comprehensive health checkups guarantee complete transparency, ensuring you receive exceptional value with absolutely no hidden charges. Book your essential health screening today." },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">{item.title}: </span>
                      <span className="text-gray-600">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ───────────────────────────────────────────────────────── */}
        <section aria-labelledby="home-faq-heading" className="mt-16 px-4 sm:px-0 mb-10">
          <h2 id="home-faq-heading" className="text-2xl font-extrabold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqJsonLd.mainEntity.map((faq, i) => (
              <details
                key={i}
                className="group border border-gray-200 rounded-2xl bg-white overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-sm gap-4">
                  <span>{faq.name}</span>
                  <svg
                    className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 pt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                  {faq.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Get Started Today */}
        <section className="px-4 mb-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 shadow-md">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">Get Started Today</h3>
            <p className="text-blue-100 text-sm max-w-xl mx-auto mb-6">
              1. Choose your test or package from 500+ options. <br />
              2. Pick a time that suits you for the sample pickup. <br />
              3. Receive your reports digitally within 24–48 hours.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/profiles"
                className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold rounded-xl transition shadow-sm"
              >
                Browse All Health Packages
              </Link>
              <Link
                href="/tests"
                className="px-6 py-3 bg-blue-800/80 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition"
              >
                Book Individual Tests
              </Link>
            </div>
          </div>
        </section>

        {/* Hidden keywords for indexing per Google Doc instructions */}
        <div className="sr-only" aria-hidden="true">
          affordable full body checkup online, full body checkup with free home collection online, book blood tests online with home collection, health checkup packages for adults online, complete blood test package price, home blood collection with online reports, preventive health checkup online, executive health checkup online, online full body checkup
        </div>
      </div>
    </>
  );
}
