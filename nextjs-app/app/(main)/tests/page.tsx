import { Metadata } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Test from '@/lib/models/Test';
import TestsPageClient from './TestsPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: {
        absolute: 'Individual Blood Tests & Diagnostics Online | Ayropath',
    },
    description: 'Book individual lab tests online with Ayropath. Free home sample collection, NABL accredited results & reports in 24-48 hours. Diabetes, thyroid, B12 & more.',
    keywords: [
        // Target keywords from content document
        'lab tests online',
        'diabetes blood results',
        'hemoglobin blood results',
        'vitamin b12 blood results',
        'liver function test price online',
        'diabetes test price online',
        'blood sugar test online',
        'thyroid test online',
        'beta hcg blood test online',
        'beta hcg test for pregnancy',
        // Primary and AI suggested keywords from SEO audit deck
        'individual blood tests', 'single blood tests at home',
        'home sample collection', 'at-home blood sample collection',
        'diagnostic tests online', 'NABL accredited lab tests',
        'blood testing services', 'diagnostic services India', 'medical test booking', 'affordable lab tests',
        // Specific tests
        'CBC test at home', 'blood test price India', 'thyroid test TSH', 'TSH T3 T4 test online',
        'HbA1c test home collection', 'Vitamin D test price', 'Vitamin B12 test', 'iron deficiency test',
        'uric acid test online', 'creatinine test at home', 'SGOT SGPT liver test',
        'cholesterol test home collection', 'fasting glucose test',
        'Thyrocare individual tests', 'blood test online India', 'lab test booking',
    ],
    openGraph: {
        title: 'Individual Blood Tests & Diagnostics Online | Ayropath',
        description: 'Book individual lab tests online with Ayropath. Free home sample collection, NABL accredited results & reports in 24-48 hours. Diabetes, thyroid, B12 & more.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Individual Blood Tests & Diagnostics Online | Ayropath',
        description: 'Book individual lab tests online with Ayropath. Free home sample collection, NABL accredited results & reports in 24-48 hours.',
    },
    alternates: { canonical: '/tests' },
};

interface TestsPageProps {
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

export default async function TestsPage({ limit, showHeader, mobileScroll }: TestsPageProps) {
    await connectToDatabase();

    const fetchLimit = limit || 20;

    const isHomeWidget = !!limit;
    const SELECT = 'name type code customPricing thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category imageLocation thyrocareData.imageLocation imageMaster thyrocareData.imageMaster isFeatured featuredOrder';

    let testDocs: any[];
    const totalCount = await Test.countDocuments({ isActive: true });

    if (isHomeWidget) {
        // Fetch ALL featured items (no limit) so the home page count matches admin
        testDocs = await Test.find({ isActive: true, isFeatured: true })
            .select(SELECT).sort({ featuredOrder: 1 }).lean();
        if (testDocs.length === 0) {
            testDocs = await Test.find({ isActive: true })
                .select(SELECT).sort({ name: 1 }).limit(fetchLimit).lean();
        }
    } else {
        testDocs = await Test.find({ isActive: true })
            .select(SELECT).sort({ name: 1 }).limit(fetchLimit).lean();
    }

    const initialData = testDocs.map((t: any) => ({
        code: t.code,
        name: t.name,
        type: t.type,
        sellingPrice: t.customPricing?.sellingPrice || t.thyrocareData?.rate?.b2C || 0,
        rate: {
            b2C: t.thyrocareData?.rate?.b2C || 0,
            offerRate: t.thyrocareData?.rate?.offerRate || 0,
        },
        testCount: t.thyrocareData?.testCount || 0,
        fasting: t.thyrocareData?.fasting || '',
        category: t.thyrocareData?.category || '',
        imageLocation: t.imageLocation || null,
        imageMaster: t.imageMaster ? JSON.parse(JSON.stringify(t.imageMaster)) : null,
        thyrocareData: t.thyrocareData ? { 
            imageLocation: t.thyrocareData.imageLocation || null,
            imageMaster: t.thyrocareData.imageMaster ? JSON.parse(JSON.stringify(t.thyrocareData.imageMaster)) : null
        } : null,
        isActive: t.isActive,
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';
    const collectionPageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Lab Tests Online – Book Individual Blood Tests with Home Sample Pickup',
        description: 'Book individual lab tests online with Ayropath. Free home sample collection, NABL accredited results & reports in 24-48 hours. Diabetes, thyroid, B12 & more.',
        url: `${siteUrl}/tests`,
        mainEntity: {
            '@type': 'ItemList',
            name: 'Individual Lab Tests & Diagnostics',
            numberOfItems: totalCount,
            itemListElement: initialData.slice(0, 10).map((test, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                    '@type': 'Product',
                    name: test.name,
                    description: `${test.name} individual blood test with free home collection. Processed at NABL accredited laboratories.`,
                    url: `${siteUrl}/profiles/${test.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}/${test.type}/${test.code}`,
                    offers: {
                        '@type': 'Offer',
                        price: test.sellingPrice,
                        priceCurrency: 'INR',
                        availability: 'https://schema.org/InStock',
                    },
                },
            })),
        },
    };

    const faqTestsJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Can I book a single blood test without a full package?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. You can order any individual test from our catalogue of 550+ tests without having to book a full health package.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is home sample collection free for individual tests?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Ayropath provides free home sample collection for individual tests and packages alike, with no extra travel charge.',
                },
            },
            {
                '@type': 'Question',
                name: "Do I need a doctor's prescription?",
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Most routine tests (sugar, thyroid, CBC, vitamins, lipid) do not require a prescription. You can book them directly online.',
                },
            },
            {
                '@type': 'Question',
                name: 'How should I prepare for a fasting blood test?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Fast for 8 to 12 hours overnight. Drink only plain water. Avoid morning tea, coffee, breakfast, tobacco and strenuous exercise before sample collection.',
                },
            },
            {
                '@type': 'Question',
                name: 'When will I receive my test report?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Most routine test reports are ready within 24 hours of sample pickup. Specialized tests may take 36 to 48 hours. You will receive an SMS and WhatsApp notification with your download link.',
                },
            },
            {
                '@type': 'Question',
                name: 'How do I know the results are accurate?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'All samples are processed at NABL and CAP accredited Thyrocare laboratories using automated robotic analysers with internal and external quality control checks.',
                },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqTestsJsonLd) }}
            />
            <TestsPageClient initialData={initialData as any} initialTotal={totalCount} limit={limit} showHeader={showHeader} mobileScroll={mobileScroll} />
        </>
    );
}
