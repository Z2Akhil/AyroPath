import { Metadata } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import ProfilesPageClient from './ProfilesPageClient';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
    title: {
        absolute: 'Thyrocare & Aarogyam Full Body Checkup at Home | Ayropath',
    },
    description: "Book a full body checkup at home with Ayropath's Thyrocare health packages. Enjoy free home sample collection and digital reports in 24-48 hrs.",
    keywords: [
        // Target keywords from content document
        'full body checkup at home',
        'normal routine urine test',
        'routine urine analysis report online',
        'aarogyam male health checkup',
        'aarogyam female health checkup',
        'full body checkup thyrocare',
        'aarogyam advanced health checkup',
        'aarogyam xl pro health checkup',
        // Supporting high-intent keywords
        'Thyrocare profiles',
        'health checkup packages',
        'Thyrocare packages online',
        'diagnostic test packages',
        'blood test at home',
        'health screening tests',
        'Aarogyam profile price',
        'home sample collection',
        'NABL accredited labs',
        'digital reports',
        'preventive health checkups',
        'full body checkup packages India',
        'Aarogyam packages',
        'preventive health checkup',
        'affordable health test India',
        'Thyrocare authorised partner',
    ],
    openGraph: {
        title: 'Thyrocare & Aarogyam Full Body Checkup at Home | Ayropath',
        description: "Book a full body checkup at home with Ayropath's Thyrocare health packages. Enjoy free home sample collection and digital reports in 24-48 hrs.",
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Thyrocare & Aarogyam Full Body Checkup at Home | Ayropath',
        description: "Book a full body checkup at home with Ayropath's Thyrocare health packages. Enjoy free home sample collection and digital reports in 24-48 hrs.",
    },
    alternates: { canonical: '/profiles' },
};

interface ProfilesPageProps {
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

export default async function ProfilesPage({ limit, showHeader, mobileScroll }: ProfilesPageProps) {
    await connectToDatabase();

    const fetchLimit = limit || 20;

    const isHomeWidget = !!limit;
    const SELECT = 'name type code customPricing customImage thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category imageLocation thyrocareData.imageLocation imageMaster thyrocareData.imageMaster isFeatured featuredOrder';

    let profileDocs: any[];
    const totalCount = await Profile.countDocuments({ isActive: true });

    if (isHomeWidget) {
        // Fetch ALL featured items (no limit) so the home page count matches admin
        profileDocs = await Profile.find({ isActive: true, isFeatured: true })
            .select(SELECT).sort({ featuredOrder: 1 }).lean();
        if (profileDocs.length === 0) {
            profileDocs = await Profile.find({ isActive: true })
                .select(SELECT).sort({ 'thyrocareData.bookedCount': -1 }).limit(fetchLimit).lean();
        }
    } else {
        profileDocs = await Profile.find({ isActive: true })
            .select(SELECT).sort({ 'thyrocareData.bookedCount': -1 }).limit(fetchLimit).lean();
    }

    // Serialize to plain objects compatible with Product type
    const initialData = profileDocs.map((p: any) => ({
        code: p.code,
        name: p.name,
        type: p.type,
        sellingPrice: p.customPricing?.sellingPrice || p.thyrocareData?.rate?.b2C || 0,
        rate: {
            b2C: p.thyrocareData?.rate?.b2C || 0,
            offerRate: p.thyrocareData?.rate?.offerRate || 0,
        },
        testCount: p.thyrocareData?.testCount || 0,
        fasting: p.thyrocareData?.fasting || '',
        category: p.thyrocareData?.category || '',
        customImage: p.customImage?.url ? { url: p.customImage.url, publicId: p.customImage.publicId } : null,
        imageLocation: p.imageLocation || null,
        imageMaster: p.imageMaster ? JSON.parse(JSON.stringify(p.imageMaster)) : null,
        thyrocareData: p.thyrocareData ? {
            imageLocation: p.thyrocareData.imageLocation || null,
            imageMaster: p.thyrocareData.imageMaster ? JSON.parse(JSON.stringify(p.thyrocareData.imageMaster)) : null
        } : null,
        isActive: p.isActive,
    }));

    // CollectionPage & ItemList JSON-LD for listing page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';
    const collectionPageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Full Body Checkup & Thyrocare Health Packages Online',
        description: "Book a full body checkup at home with Ayropath's Thyrocare health packages. Enjoy free home sample collection and digital reports in 24-48 hrs.",
        url: `${siteUrl}/profiles`,
        mainEntity: {
            '@type': 'ItemList',
            name: 'Health Checkup Packages & Thyrocare Profiles',
            numberOfItems: totalCount,
            itemListElement: initialData.slice(0, 10).map((pkg, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                    '@type': 'Product',
                    name: pkg.name,
                    description: `${pkg.name} with ${pkg.testCount} tests. Free home sample collection by NABL accredited lab.`,
                    url: `${siteUrl}/profiles/${pkg.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}/${pkg.type}/${pkg.code}`,
                    offers: {
                        '@type': 'Offer',
                        price: pkg.sellingPrice,
                        priceCurrency: 'INR',
                        availability: 'https://schema.org/InStock',
                    },
                },
            })),
        },
    };

    const faqProfilesJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'How long does the home collection visit take?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The phlebotomist usually completes the blood draw and sample collection in 10 to 15 minutes.',
                },
            },
            {
                '@type': 'Question',
                name: 'Do I need to fast before a full body checkup?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Most full body checkups require 10 to 12 hours of overnight fasting for accurate blood sugar and lipid readings. You may drink plain water.',
                },
            },
            {
                '@type': 'Question',
                name: 'How quickly do I receive my reports?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Digital reports are delivered to your registered email and Ayropath dashboard within 24 to 48 hours.',
                },
            },
            {
                '@type': 'Question',
                name: 'Are Ayropath reports accepted by doctors and hospitals?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. All tests are processed at NABL and CAP accredited Thyrocare laboratories, making the reports valid across India.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I book for multiple family members in one slot?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. You can add tests for family members during booking and the phlebotomist will collect all samples in the same visit.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is home sample collection really free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Free home sample collection is included with every package on Ayropath with no hidden technician or travel fees.',
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqProfilesJsonLd) }}
            />
            <ProfilesPageClient initialData={initialData as any} initialTotal={totalCount} limit={limit} showHeader={showHeader} mobileScroll={mobileScroll} />
        </>
    );
}
