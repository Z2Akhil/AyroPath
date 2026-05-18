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
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
        Everything for your healthcare needs
      </h1>

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
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          Browse Packages
        </Link>
        <Link
          href="/tests"
          className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold rounded-xl border border-gray-200 transition-colors shadow-sm"
        >
          Individual Tests
        </Link>
      </div>
    </section>
  );
}
