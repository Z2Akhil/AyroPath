import { Metadata } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Offer from '@/lib/models/Offer';
import OffersPageClient from './OffersPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Health Package Offers & Discounts | Thyrocare Tests – Ayropath',
    description: 'Browse discounted Thyrocare health packages and offers. Book online with free home sample collection. NABL accredited labs. Save up to 60% on diagnostic tests.',
    keywords: [
        'thyrocare offers', 'discounted health packages', 'health test offers india',
        'cheap blood test packages', 'diagnostic offers', 'affordable health checkup',
        'home collection blood test offer', 'thyrocare discount', 'buy health test online',
    ],
    openGraph: {
        title: 'Health Package Offers & Discounts | Thyrocare Tests – Ayropath',
        description: 'Browse discounted Thyrocare health packages. Save up to 60% with free home collection.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Health Package Offers & Discounts – Ayropath',
        description: 'Browse discounted Thyrocare health packages. Save up to 60% with free home collection.',
    },
    alternates: { canonical: '/offers' },
};

interface OffersPageProps {
    limit?: number;
}

export default async function OffersPage({ limit }: OffersPageProps) {
    await connectToDatabase();

    const fetchLimit = limit || 12;

    const [offerDocs, totalCount] = await Promise.all([
        Offer.find({ isActive: true })
            .select('name type code customPricing thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category imageLocation thyrocareData.imageLocation imageMaster thyrocareData.imageMaster')
            .limit(fetchLimit)
            .lean(),
        Offer.countDocuments({ isActive: true }),
    ]);

    const initialData = offerDocs.map((o: any) => ({
        code: o.code,
        name: o.name,
        type: o.type,
        sellingPrice: o.customPricing?.sellingPrice || o.thyrocareData?.rate?.offerRate || 0,
        rate: {
            b2C: o.thyrocareData?.rate?.b2C || 0,
            offerRate: o.thyrocareData?.rate?.offerRate || 0,
        },
        testCount: o.thyrocareData?.testCount || 0,
        fasting: o.thyrocareData?.fasting || '',
        category: o.thyrocareData?.category || '',
        imageLocation: o.imageLocation || null,
        imageMaster: o.imageMaster ? JSON.parse(JSON.stringify(o.imageMaster)) : null,
        thyrocareData: o.thyrocareData ? { 
            imageLocation: o.thyrocareData.imageLocation || null,
            imageMaster: o.thyrocareData.imageMaster ? JSON.parse(JSON.stringify(o.thyrocareData.imageMaster)) : null
        } : null,
        isActive: o.isActive,
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Health Package Offers',
        description: 'Discounted Thyrocare health test offers available for online booking at Ayropath',
        numberOfItems: totalCount,
        itemListElement: initialData.slice(0, 10).map((offer, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: offer.name,
            url: `${siteUrl}/profiles/${offer.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}/${offer.type}/${offer.code}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <OffersPageClient initialData={initialData as any} initialTotal={totalCount} limit={limit} />
        </>
    );
}

