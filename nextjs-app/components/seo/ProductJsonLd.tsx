import { slugify } from '@/lib/slugify';

interface ProductJsonLdProps {
    product: {
        name: string;
        code: string;
        type: string;
        category?: string;
        testCount?: number;
        fasting?: string;
        childs?: Array<{ name?: string; groupName?: string }>;
    };
    displayPrice: number;
    canonicalUrl: string;
}

export default function ProductJsonLd({ product, displayPrice, canonicalUrl }: ProductJsonLdProps) {
    const testCount = product.testCount || product.childs?.length || 0;
    const testNames = (product.childs || [])
        .slice(0, 10)
        .map((c) => c.name)
        .filter(Boolean)
        .join(', ');

    // Unique parameter groups
    const groups = [...new Set((product.childs || []).map(c => c.groupName).filter(Boolean))];
    const topGroups = groups.slice(0, 3).join(', ');

    const description = `${product.name} is a Thyrocare ${product.type === 'OFFER' ? 'offer' : 'health package'} with ${testCount} parameters${testNames ? ` including ${testNames}` : ''}. ${product.fasting === 'CF' ? 'Fasting of 8–10 hours required.' : 'No fasting required.'}`;

    // Expiry 30 days out for price freshness signal
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    // FAQ answers generated from product data
    const faqItems = [
        {
            question: `What is ${product.name}?`,
            answer: `${product.name} is a comprehensive Thyrocare ${product.type === 'OFFER' ? 'offer package' : 'health profile'} with ${testCount} diagnostic parameters${topGroups ? ` covering ${topGroups}` : ''}. Book it online on Ayropath with free home sample collection.`,
        },
        {
            question: `Is fasting required for ${product.name}?`,
            answer: product.fasting === 'CF'
                ? `Yes, fasting for 8–10 hours is required before ${product.name}. You may drink water. Avoid heavy meals, tea, coffee, or juices before the test.`
                : `No, fasting is not required for ${product.name}. You can book it at any convenient time of the day.`,
        },
        {
            question: `What is the price of ${product.name}?`,
            answer: `${product.name} is available at ₹${displayPrice} on Ayropath with free home sample collection across India. Reports are delivered within 24–48 hours.`,
        },
        {
            question: `What tests are included in ${product.name}?`,
            answer: `${product.name} includes ${testCount} parameters${testNames ? `: ${testNames}` : ''}. All tests are processed at NABL & CAP accredited Thyrocare laboratories.`,
        },
        {
            question: `How to book ${product.name} online?`,
            answer: `You can book ${product.name} on Ayropath in 3 simple steps: 1) Select your test and preferred time slot, 2) Our certified phlebotomist visits your home for sample collection, 3) Access your reports online within 24–48 hours.`,
        },
        {
            question: `Is home sample collection available for ${product.name}?`,
            answer: `Yes, free home sample collection for ${product.name} is available across major cities in India including Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Pune, Kolkata, Ranchi, Jamshedpur, and more. A certified Thyrocare phlebotomist visits at your preferred time slot.`,
        },
        {
            question: `How long does it take to get ${product.name} reports?`,
            answer: `${product.name} reports are typically delivered within 24 to 48 hours after sample collection. Reports are accessible digitally via your Ayropath account and can also be downloaded as a PDF.`,
        },
    ];

    const jsonLdGraph = [
        // Product schema for price rich snippets
        {
            '@type': 'Product',
            name: product.name,
            description,
            sku: product.code,
            category: product.category || 'Health Checkup',
            brand: {
                '@type': 'Brand',
                name: 'Thyrocare', // ← CRITICAL: matches "AAROGYAM C Thyrocare" searches
            },
            offers: {
                '@type': 'Offer',
                price: displayPrice.toString(),
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: canonicalUrl,
                priceValidUntil,
                seller: {
                    '@type': 'Organization',
                    name: 'Ayropath',
                    url: 'https://ayropath.com',
                },
            },
            // NOTE: aggregateRating intentionally omitted — add only after real reviews are collected
            // to avoid Google manual penalty for fabricated review counts.
        },
        // MedicalTest schema for healthcare vertical
        {
            '@type': 'MedicalTest',
            name: product.name,
            description,
            code: {
                '@type': 'MedicalCode',
                codeValue: product.code,
                codingSystem: 'Thyrocare',
            },
            ...(product.childs && product.childs.length > 0 && {
                subTest: product.childs.slice(0, 8).map(c => ({
                    '@type': 'MedicalTest',
                    name: c.name,
                })),
            }),
        },
        // FAQPage schema for expanded rich snippets (7 questions)
        {
            '@type': 'FAQPage',
            mainEntity: faqItems.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
        },
        // Speakable schema — enables Google Assistant to read key sections aloud
        {
            '@type': 'WebPage',
            speakable: {
                '@type': 'SpeakableSpecification',
                cssSelector: ['h1', '.product-description', '.product-price', '.faq-section'],
            },
            url: canonicalUrl,
        },
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': jsonLdGraph,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
