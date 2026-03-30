import { Metadata } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import ProfilesPageClient from './ProfilesPageClient';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
    title: 'Health Checkup Packages | Thyrocare Profiles – Ayropath',
    description: 'Book Thyrocare health checkup packages online with free home sample collection. Full body checkups, diabetes screening, thyroid profiles and more. NABL accredited labs, reports in 24–48 hrs.',
    keywords: [
        'health checkup packages', 'thyrocare profiles', 'full body checkup online',
        'blood test packages', 'preventive health checkup', 'home sample collection',
        'NABL accredited lab', 'affordable health test', 'book health test online India',
    ],
    openGraph: {
        title: 'Health Checkup Packages | Thyrocare Profiles – Ayropath',
        description: 'Book Thyrocare health packages online. Full body checkups, thyroid profiles and more with free home collection.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Health Checkup Packages | Thyrocare Profiles – Ayropath',
        description: 'Book Thyrocare health packages online with free home collection.',
    },
    alternates: { canonical: '/profiles' },
};

interface ProfilesPageProps {
    limit?: number;
}

export default async function ProfilesPage({ limit }: ProfilesPageProps) {
    await connectToDatabase();

    const fetchLimit = limit || 12;

    const [profileDocs, totalCount] = await Promise.all([
        Profile.find({ isActive: true })
            .select('name type code customPricing thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category')
            .sort({ 'thyrocareData.bookedCount': -1 })
            .limit(fetchLimit)
            .lean(),
        Profile.countDocuments({ isActive: true }),
    ]);

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
        isActive: p.isActive,
    }));

    // ItemList JSON-LD for listing page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Health Checkup Packages',
        description: 'Thyrocare health checkup profiles available for online booking at Ayropath',
        numberOfItems: totalCount,
        itemListElement: initialData.slice(0, 10).map((pkg, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: pkg.name,
            url: `${siteUrl}/profiles/${pkg.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}/${pkg.type}/${pkg.code}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <ProfilesPageClient initialData={initialData as any} initialTotal={totalCount} />
        </>
    );
}
