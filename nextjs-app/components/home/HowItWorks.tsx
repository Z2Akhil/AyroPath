const STEPS = [
  {
    step: "1",
    icon: "🔍",
    title: "Choose Your Test",
    desc: "Search from 500+ lab tests and health packages at best prices.",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    num: "text-blue-600",
  },
  {
    step: "2",
    icon: "🏠",
    title: "Home Collection",
    desc: "Our certified phlebotomist visits your home at a time that suits you.",
    bg: "bg-green-50",
    ring: "ring-green-200",
    num: "text-green-600",
  },
  {
    step: "3",
    icon: "📋",
    title: "Get Your Reports",
    desc: "Receive digital reports within 24–48 hours directly on your phone.",
    bg: "bg-purple-50",
    ring: "ring-purple-200",
    num: "text-purple-600",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">How It Works</h2>
      <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.step} className="relative flex flex-col items-center text-center">
            {i < STEPS.length - 1 && (
              <div className="absolute top-5 left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] h-0.5 bg-gray-200 z-0" />
            )}
            <div className={`relative z-10 w-10 h-10 rounded-xl ring-1 ${s.bg} ${s.ring} flex items-center justify-center text-xl mb-2 shadow-sm`}>
              {s.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${s.num}`}>Step {s.step}</span>
            <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1">{s.title}</h3>
            <p className="text-[10px] text-gray-500 leading-snug">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
