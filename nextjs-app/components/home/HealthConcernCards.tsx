import Link from "next/link";

const CONCERNS = [
  { label: "Full Body Checkup", sub: "80+ parameters", href: "/full-body-checkup", bg: "bg-red-100", text: "text-red-700", icon: "🧬" },
  { label: "Diabetes", sub: "HbA1c, Fasting, PP", href: "/tests?q=diabetes", bg: "bg-orange-100", text: "text-orange-700", icon: "💉" },
  { label: "Thyroid", sub: "TSH, T3, T4", href: "/tests?q=thyroid", bg: "bg-purple-100", text: "text-purple-700", icon: "🦋" },
  { label: "Heart Care", sub: "Lipid profile", href: "/tests?q=heart", bg: "bg-pink-100", text: "text-pink-700", icon: "❤️" },
  { label: "Vitamins", sub: "B12, D3, Iron", href: "/tests?q=vitamin", bg: "bg-yellow-100", text: "text-yellow-700", icon: "☀️" },
  { label: "Liver", sub: "LFT & enzymes", href: "/tests?q=liver", bg: "bg-lime-100", text: "text-lime-700", icon: "🫀" },
  { label: "Kidney", sub: "KFT & creatinine", href: "/tests?q=kidney", bg: "bg-teal-100", text: "text-teal-700", icon: "🫘" },
  { label: "Senior Care", sub: "60+ panel", href: "/profiles?q=senior", bg: "bg-indigo-100", text: "text-indigo-700", icon: "👴" },
  { label: "Fever & Infection", sub: "CBC, CRP, Widal", href: "/tests?q=fever", bg: "bg-sky-100", text: "text-sky-700", icon: "🌡️" },
  { label: "Women's Health", sub: "Hormones & more", href: "/tests?q=women", bg: "bg-rose-100", text: "text-rose-700", icon: "🌸" },
];

export default function HealthConcernCards() {
  return (
    <section className="px-4 mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Lab Tests by Health Concern</h2>
      <div className="grid grid-rows-2 grid-flow-col auto-cols-[8.5rem] gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid-rows-1 md:grid-flow-row md:grid-cols-5 md:overflow-visible md:pb-0">
        {CONCERNS.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`
              flex flex-col gap-2 p-4 rounded-2xl
              ${c.bg}
              hover:scale-[1.03] hover:shadow-md transition-all duration-200
            `}
          >
            <span className="text-3xl">{c.icon}</span>
            <span className={`text-sm font-bold leading-tight ${c.text}`}>{c.label}</span>
            <span className="text-xs text-gray-500 leading-tight">{c.sub}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
