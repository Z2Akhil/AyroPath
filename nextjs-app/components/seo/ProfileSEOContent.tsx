// Server Component — intentionally NO 'use client' directive.
// This renders static, crawlable HTML that Google indexes to rank this page
// for generic (non-branded) search queries. Do NOT add 'use client' here.

interface Product {
    name: string;
    type: string;
    testCount?: number;
    fasting?: string;
    childs?: Array<{ name?: string; groupName?: string }>;
    category?: string;
}

interface ProfileSEOContentProps {
    product: Product;
    displayPrice: number;
}

// ─── Helper: "Who should take this?" ────────────────────────────────────────
function buildTargetAudience(name: string): string[] {
    const n = name.toLowerCase();
    const base = [
        'Anyone above 18 years who wants to proactively monitor their health',
        'People with a family history of lifestyle diseases like diabetes or hypertension',
        'Individuals with no recent blood work done in the last 6–12 months',
    ];
    if (n.includes('executive')) return [
        'Working professionals and corporate executives aged 30 and above',
        'Individuals seeking a comprehensive single-test snapshot of their entire health',
        'People with sedentary lifestyles, high stress, or irregular food habits',
        'Those looking for the most thorough and complete health screening available',
        ...base,
    ];
    if (n.includes('vitamin')) return [
        'People experiencing unexplained fatigue, weakness, or lethargy',
        'Individuals suspected of Vitamin D or Vitamin B12 deficiency',
        'Those with restricted diets, vegans, or individuals with low sun exposure',
        'Anyone wanting a full-body checkup that also screens for nutritional deficiencies',
        ...base,
    ];
    if (n.includes('tax')) return [
        'Salaried individuals and self-employed professionals looking to claim Section 80D deduction',
        'People who want a comprehensive health checkup while saving on income tax',
        'Those who want NABL-certified lab reports accepted by insurance providers',
        'Individuals seeking maximum value from their annual preventive health investment',
        ...base,
    ];
    if (n.includes('senior')) return [
        'Senior citizens aged 55 years and above',
        'Elderly individuals managing chronic conditions like diabetes, hypertension, or thyroid',
        'Family members who want a thorough annual health assessment for aging parents',
        'Those monitoring kidney, liver, and heart function as a routine preventive measure',
        ...base,
    ];
    if (n.includes('female') || n.includes('women')) return [
        'Women of all ages who want to proactively monitor their health',
        'Working women with a busy schedule who prefer home sample collection',
        'Women above 30 years for preventive thyroid, hormonal, and nutritional screening',
        'Expecting or planning-to-conceive women who want a comprehensive baseline profile',
        ...base,
    ];
    if (n.includes('male') || n.includes('men')) return [
        'Men of all ages looking to monitor cardiovascular, metabolic, and organ health',
        'Men above 30 who have not had a blood test in over a year',
        'Working professionals with irregular sleep, high stress, or poor dietary habits',
        'Men with a family history of heart disease, diabetes, or kidney problems',
        ...base,
    ];
    // Generic fallback
    return [
        'Individuals who want a baseline understanding of their current health status',
        'Those managing lifestyle diseases like diabetes, hypertension, or thyroid issues',
        'People above 25 years with no recent complete health assessment',
        ...base,
    ];
}

// ─── Helper: Package-specific FAQ additions ──────────────────────────────────
function buildExtraFaqs(name: string, displayPrice: number): Array<{ q: string; a: string }> {
    const n = name.toLowerCase();
    const extra: Array<{ q: string; a: string }> = [];

    if (n.includes('tax')) {
        extra.push({
            q: `Does ${name} qualify for Section 80D tax deduction?`,
            a: `Yes. Preventive health checkup expenses up to ₹5,000 per year are eligible as a deduction under Section 80D of the Income Tax Act. The ${name} invoice from Ayropath can be used to claim this benefit.`,
        });
        extra.push({
            q: `What documents are needed for 80D tax claim for ${name}?`,
            a: `You need the payment receipt and the invoice generated at the time of booking on Ayropath. No additional documents are typically required. Consult your tax advisor for confirmation.`,
        });
    }
    if (n.includes('senior')) {
        extra.push({
            q: `Why is a specialized health package recommended for senior citizens?`,
            a: `Senior citizens are more susceptible to conditions like kidney disease, heart problems, thyroid dysfunction, anemia, and bone disorders. ${name} is curated to screen all these simultaneously in a single visit, reducing the need for multiple separate tests.`,
        });
    }
    if (n.includes('vitamin')) {
        extra.push({
            q: `Which vitamin deficiencies does ${name} screen for?`,
            a: `${name} typically screens for Vitamin D (25-OH), Vitamin B12, and may include other nutritional markers. Low levels of these vitamins are linked to fatigue, bone loss, neurological issues, and immunity problems.`,
        });
    }
    if (n.includes('executive')) {
        extra.push({
            q: `Why is ${name} considered a complete health checkup?`,
            a: `${name} covers a wide spectrum of health parameters including cardiac risk, liver function, kidney function, thyroid panel, blood sugar, CBC, lipid profile, and more — making it one of the most thorough health screening packages available.`,
        });
    }
    if (n.includes('aarogyam')) {
        extra.push({
            q: `Is ${name} from Thyrocare reliable?`,
            a: `Yes. All Aarogyam/Thyrocare tests are conducted in NABL & CAP accredited laboratories with internationally benchmarked quality standards. The results are clinically accurate and accepted by hospitals, doctors, and insurance companies across India.`,
        });
    }
    return extra;
}

// ─── Helper: Main FAQ items ──────────────────────────────────────────────────
function buildFaqItems(product: Product, displayPrice: number) {
    const testCount = product.testCount || product.childs?.length || 0;
    const testNames = (product.childs || [])
        .slice(0, 6)
        .map((c) => c.name)
        .filter(Boolean)
        .join(', ');
    const groups = [
        ...new Set((product.childs || []).map((c) => c.groupName).filter(Boolean)),
    ] as string[];
    const topGroups = groups.slice(0, 3).join(', ');

    const core = [
        {
            q: `What is ${product.name}?`,
            a:
                `${product.name} is a comprehensive Thyrocare health profile with ${testCount} diagnostic parameters` +
                `${topGroups ? `, covering key areas like ${topGroups}` : ''}. ` +
                `It is available for online booking at Ayropath with free home sample collection across India, ` +
                `backed by NABL & CAP accredited Thyrocare laboratories.`,
        },
        {
            q: `What tests are included in ${product.name}?`,
            a:
                `${product.name} includes ${testCount} parameters` +
                `${testNames ? ` such as ${testNames}` : ''}` +
                `${groups.length > 0 ? `, spanning groups like ${topGroups}` : ''}. ` +
                `All tests are processed at Thyrocare's accredited labs.`,
        },
        {
            q: `What is the price of ${product.name}?`,
            a: `${product.name} is currently priced at ₹${displayPrice} on Ayropath, inclusive of free home sample collection. Reports are delivered digitally within 24–48 hours of collection.`,
        },
        {
            q: `Is fasting required for ${product.name}?`,
            a:
                product.fasting === 'CF'
                    ? `Yes. A fasting period of 8–10 hours is required before your ${product.name} sample is collected. You may drink plain water. Avoid food, tea, coffee, or juice to ensure accurate results.`
                    : `No fasting is required for ${product.name}. You can book it and have your sample collected at any convenient time of the day.`,
        },
        {
            q: `How do I book ${product.name} online?`,
            a: `Booking ${product.name} on Ayropath takes under 2 minutes: Select the package → Choose your preferred date and time slot → Our certified Thyrocare phlebotomist visits your home → Reports delivered online in 24–48 hours.`,
        },
        {
            q: `Is home sample collection available for ${product.name}?`,
            a:
                `Yes. Free home sample collection for ${product.name} is available across major Indian cities including Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Ranchi, Jamshedpur, and Dhanbad. ` +
                `A Thyrocare-certified phlebotomist visits your location at your chosen time slot.`,
        },
        {
            q: `When will I receive my ${product.name} report?`,
            a: `${product.name} reports are typically emailed and made available in your Ayropath account within 24 to 48 hours after sample collection. You can view and download your full PDF report anytime.`,
        },
        {
            q: `Are the labs conducting ${product.name} tests certified?`,
            a: `Yes. All samples for ${product.name} are processed at Thyrocare's NABL and CAP accredited laboratories — the same labs trusted by over 2,000 hospitals across India. You can be confident in the clinical accuracy of your results.`,
        },
    ];

    return [...core, ...buildExtraFaqs(product.name, displayPrice)];
}

// ─── Helper: Long-form description ──────────────────────────────────────────
function buildDescription(product: Product, displayPrice: number): React.ReactNode {
    const testCount = product.testCount || product.childs?.length || 0;
    const groups = [
        ...new Set((product.childs || []).map((c) => c.groupName).filter(Boolean)),
    ] as string[];
    const topGroups = groups.slice(0, 5).join(', ');
    const fastingNote =
        product.fasting === 'CF'
            ? 'An 8–10 hour fast is required before sample collection.'
            : 'No fasting is needed — sample can be collected at any time.';

    return (
        <>
            <p className="text-gray-600 leading-relaxed text-sm mb-3">
                <strong>{product.name}</strong> is a Thyrocare-certified{' '}
                {product.type === 'OFFER' ? 'special offer package' : 'health profile'} with{' '}
                <strong>{testCount} diagnostic parameters</strong>, designed for individuals who want a reliable,
                clinically accurate snapshot of their overall health — all from the comfort of home.
                {topGroups && (
                    <> The panel covers essential health areas including <strong>{topGroups}</strong>, giving
                    you and your doctor a complete picture.</>
                )}
            </p>
            <p className="text-gray-600 leading-relaxed text-sm mb-3">
                Booking {product.name} through Ayropath means your sample is collected by a certified Thyrocare
                phlebotomist at your doorstep — with <strong>no hidden charges</strong> and{' '}
                <strong>free home collection</strong>. All samples are processed at{' '}
                <strong>NABL &amp; CAP accredited Thyrocare laboratories</strong>, the gold standard for diagnostic
                accuracy in India. Your digital report is delivered within <strong>24–48 hours</strong>.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm">
                Currently available at <strong>₹{displayPrice}</strong>, {product.name} is one of the most affordable
                ways to get a thorough health assessment without stepping out. {fastingNote}
            </p>
        </>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────
import type React from 'react';

export default function ProfileSEOContent({ product, displayPrice }: ProfileSEOContentProps) {
    const faqItems = buildFaqItems(product, displayPrice);
    const audience = buildTargetAudience(product.name);

    const healthAreas = [
        ...new Set(
            (product.childs || []).map((c) => c.groupName).filter(Boolean) as string[]
        ),
    ];

    const testCount = product.testCount || product.childs?.length || 0;
    const topTests = (product.childs || []).slice(0, 8).map((c) => c.name).filter(Boolean);

    return (
        <div className="bg-gray-50 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-14">
                <div className="lg:w-2/3 space-y-12">

                    {/* ── 1. About This Package ── */}
                    <section aria-labelledby="about-heading">
                        <h2 id="about-heading" className="text-2xl font-bold text-gray-900 mb-4">
                            About {product.name}
                        </h2>
                        <div className="profile-description">
                            {buildDescription(product, displayPrice)}
                        </div>
                    </section>

                    {/* ── 2. Key Health Areas ── */}
                    {healthAreas.length > 0 && (
                        <section aria-labelledby="areas-heading">
                            <h2 id="areas-heading" className="text-2xl font-bold text-gray-900 mb-4">
                                Key Health Areas Covered in {product.name}
                            </h2>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {healthAreas.map((area, i) => (
                                    <span
                                        key={i}
                                        className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100"
                                    >
                                        {area}
                                    </span>
                                ))}
                            </div>
                            {topTests.length > 0 && (
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    <span className="font-semibold text-gray-700">Tests include: </span>
                                    {topTests.join(' · ')}
                                    {testCount > topTests.length && ` · and ${testCount - topTests.length} more`}
                                </p>
                            )}
                        </section>
                    )}

                    {/* ── 3. Who Should Take This Test ── */}
                    <section aria-labelledby="audience-heading">
                        <h2 id="audience-heading" className="text-2xl font-bold text-gray-900 mb-4">
                            Who Should Take {product.name}?
                        </h2>
                        <ul className="space-y-2">
                            {audience.map((point, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* ── 4. What to Expect ── */}
                    <section aria-labelledby="expect-heading">
                        <h2 id="expect-heading" className="text-2xl font-bold text-gray-900 mb-4">
                            What to Expect When You Book {product.name}
                        </h2>
                        <ol className="space-y-4">
                            {[
                                {
                                    step: '1. Book Online in 2 Minutes',
                                    detail: `Select ${product.name} on Ayropath, choose your preferred date, and confirm your address. No advance payment in some areas.`,
                                },
                                {
                                    step: '2. Free Home Collection',
                                    detail: 'A certified Thyrocare phlebotomist arrives at your home with all sterile equipment. The sample collection process takes under 5 minutes.',
                                },
                                {
                                    step: '3. Lab Processing at NABL-Certified Facility',
                                    detail: `Your ${product.name} sample is processed at Thyrocare's NABL & CAP accredited laboratory — ensuring results that are accurate and trusted by doctors.`,
                                },
                                {
                                    step: '4. Digital Report Within 24–48 Hours',
                                    detail: 'Your complete report is delivered to your registered email and accessible in your Ayropath account. Download your PDF anytime.',
                                },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4 text-sm">
                                    <span className="bg-blue-100 text-blue-700 font-black rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-xs">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-gray-900">{item.step}</p>
                                        <p className="text-gray-600 mt-0.5">{item.detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* ── 5. FAQ Section ── */}
                    {/* Native <details>/<summary> — no JS required, fully Google-crawlable */}
                    <section className="profile-faq" aria-labelledby="faq-heading">
                        <h2 id="faq-heading" className="text-2xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions – {product.name}
                        </h2>
                        <div className="space-y-3">
                            {faqItems.map((item, i) => (
                                <details
                                    key={i}
                                    className="group border border-gray-200 rounded-2xl bg-white overflow-hidden"
                                >
                                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-sm gap-4">
                                        <span>{item.q}</span>
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
                                        {item.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>

                    {/* ── 6. Trust Strip ── */}
                    <section
                        aria-label="Why Ayropath"
                        className="bg-white rounded-2xl border border-gray-100 p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
                    >
                        {[
                            { stat: 'NABL & CAP', label: 'Accredited Labs' },
                            { stat: '24–48 hrs', label: 'Report Delivery' },
                            { stat: '100% Safe', label: 'Sterile Collection' },
                            { stat: 'Free', label: 'Home Collection' },
                        ].map((item, i) => (
                            <div key={i}>
                                <p className="text-lg font-black text-blue-700">{item.stat}</p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{item.label}</p>
                            </div>
                        ))}
                    </section>

                </div>
            </div>
        </div>
    );
}
