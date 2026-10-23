import Link from "next/link";

const TRUST_BADGES = [
  { icon: "✓", text: "NABL & CAP Certified" },
  { icon: "✓", text: "Free Home Collection" },
  { icon: "✓", text: "Reports in 24–48 hrs" },
  { icon: "✓", text: "200+ Cities" },
];

export default function Hero() {
  return (
    <section className="px-4 pt-8 pb-6 md:pt-12 md:pb-8 text-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4 max-w-4xl mx-auto">
        Affordable Full Body Checkup Online with Free Home Collection Starting at ₹499
      </h1>

      <p className="max-w-3xl mx-auto text-sm sm:text-base text-gray-700 mb-3 leading-relaxed">
        Looking after your health should not mean taking a day off work, sitting in a crowded waiting room, or paying more than you planned. Ayropath brings trusted diagnostics to your phone and your doorstep, so you can choose an affordable full body checkup online and get on with your day. Every sample is processed at NABL and CAP accredited Thyrocare laboratories, which handle testing for more than 2,000 hospitals across India.
      </p>

      <p className="max-w-3xl mx-auto text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
        Our packages start at ₹499 and cover 60 to 100+ parameters, including blood sugar, thyroid, liver, kidney, cholesterol and vitamins. If you need something more specific, you can also choose single lab tests from ₹199. Prices are shown upfront with no hidden charges, so you know exactly what you are paying for before you confirm your booking.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {TRUST_BADGES.map((b) => (
          <span
            key={b.text}
            className="flex items-center gap-1.5 text-xs text-gray-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full"
          >
            <span className="text-green-600 font-bold">{b.icon}</span>
            {b.text}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/profiles"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          View Full Body Checkup Packages
        </Link>
        <Link
          href="/tests"
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold rounded-xl border border-gray-200 transition-colors shadow-sm"
        >
          Individual Tests from ₹199
        </Link>
      </div>
    </section>
  );
}
