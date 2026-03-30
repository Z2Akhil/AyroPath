import { Metadata } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Test from '@/lib/models/Test';
import TestsPageClient from './TestsPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Individual Lab Tests & Diagnostics | Thyrocare – Ayropath',
    description: 'Book individual Thyrocare lab tests online with free home sample collection. Blood tests, thyroid tests, diabetes tests, liver function, kidney function and more. NABL accredited labs, reports in 24–48 hrs.',
    keywords: [
        'thyrocare individual tests', 'blood test online', 'lab test booking',
        'thyroid test home collection', 'diabetes test online', 'CBC test price',
        'liver function test', 'kidney function test', 'NABL lab test india',
        'diagnostic test booking india',
    ],
    openGraph: {
        title: 'Individual Lab Tests & Diagnostics | Thyrocare – Ayropath',
        description: 'Book individual Thyrocare lab tests online with free home collection. NABL accredited labs, affordable pricing.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Lab Tests & Diagnostics | Thyrocare – Ayropath',
        description: 'Book individual Thyrocare lab tests online with free home collection.',
    },
    alternates: { canonical: '/tests' },
};

interface TestsPageProps {
    limit?: number;
}

export default async function TestsPage({ limit }: TestsPageProps) {
    await connectToDatabase();

    const fetchLimit = limit || 12;

    const [testDocs, totalCount] = await Promise.all([
        Test.find({ isActive: true })
            .select('name type code customPricing thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category')
            .limit(fetchLimit)
            .lean(),
        Test.countDocuments({ isActive: true }),
    ]);

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
        isActive: t.isActive,
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Individual Lab Tests',
        description: 'Individual Thyrocare diagnostic tests available for online booking at Ayropath',
        numberOfItems: totalCount,
        itemListElement: initialData.slice(0, 10).map((test, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: test.name,
            url: `${siteUrl}/profiles/${test.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}/${test.type}/${test.code}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <TestsPageClient initialData={initialData as any} initialTotal={totalCount} />
        </>
    );
}
