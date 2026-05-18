const STATS = [
  { value: "2L+", label: "Tests Done" },
  { value: "200+", label: "Cities Covered" },
  { value: "NABL", label: "Certified Labs" },
  { value: "₹199", label: "Tests from" },
];

export default function TrustStats() {
  return (
    <section className="mx-4 mb-10 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-blue-400 divide-y sm:divide-y-0">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center justify-center py-5 px-4 text-center ${i >= 2 ? "sm:border-t-0" : ""}`}
          >
            <span className="text-2xl font-extrabold tracking-tight">{s.value}</span>
            <span className="text-xs text-blue-100 mt-0.5 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
