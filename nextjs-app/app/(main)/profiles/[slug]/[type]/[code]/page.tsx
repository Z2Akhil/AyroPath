import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import Test from '@/lib/models/Test';
import { slugify } from '@/lib/slugify';
import PackageDetailClient from './PackageDetailClient';
import ProductJsonLd from '@/components/seo/ProductJsonLd';

interface PageProps {
    params: Promise<{
        slug: string;
        type: string;
        code: string;
    }>;
}

// Server-side data fetching function
async function getProduct(code: string) {
    try {
        await connectToDatabase();

        const [test, profile, offer] = await Promise.all([
            Test.findOne({ code, isActive: true }),
            Profile.findOne({ code, isActive: true }),
            Offer.findOne({ code, isActive: true })
        ]);

        const product = test || profile || offer;
        if (!product) return null;

        // Serialize to plain JS object — strips Mongoose internals that cause
        // "Maximum call stack size exceeded" when passed to client components
        return JSON.parse(JSON.stringify(product.getCombinedData()));
    } catch (error) {
        console.error('Error fetching product for SSR:', error);
        return null;
    }
}

// Helper to compute display price on the server (same logic as productUtils.ts)
function getServerDisplayPrice(product: any) {
    if (!product) return { displayPrice: 0, originalPrice: 0 };

    let thyrocarePrice = 0;
    if (product.type === 'OFFER') {
        thyrocarePrice = product.rate?.offerRate || 0;
    } else {
        thyrocarePrice = product.rate?.b2C || 0;
    }

    const sellingPrice = product.sellingPrice || thyrocarePrice;
    return { displayPrice: sellingPrice, originalPrice: thyrocarePrice };
}

// Dynamic metadata for SEO — runs on the server before the page renders
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, type, code } = await params;
    const product = await getProduct(code);

    if (!product) {
        return {
            title: 'Package Not Found | Ayropath',
            description: 'The requested health package could not be found.',
        };
    }

    const { displayPrice } = getServerDisplayPrice(product);
    const testCount = product.testCount || product.childs?.length || 0;

    const testNames = (product.childs || [])
        .slice(0, 5)
        .map((c: any) => c.name)
        .filter(Boolean)
        .join(', ');

    // Include 'Thyrocare' in title — critical for ranking on "AAROGYAM C Thyrocare test" queries
    const title = `${product.name} Thyrocare ${product.type === 'OFFER' ? 'Offer' : 'Test'} – Book at ₹${displayPrice} | Ayropath`;
    const description = `Book ${product.name} (Thyrocare) online with Ayropath. ${testCount} parameters${testNames ? ` – ${testNames}` : ''}. Starting at ₹${displayPrice}. Free home sample collection, NABL accredited labs, reports in 24–48 hours.`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ayropath.com';
    const canonicalUrl = `${baseUrl}/profiles/${slug}/${type}/${code}`;

    // Dynamic keywords for this specific test
    const keywords = [
        product.name,
        `${product.name} Thyrocare`,
        `${product.name} test price`,
        `${product.name} includes`,
        `${product.name} home collection`,
        `book ${product.name} online`,
        `${product.name} parameters`,
        'thyrocare test booking',
        'home sample collection',
        'NABL accredited lab test',
    ];

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: 'Ayropath',
            type: 'website',
            locale: 'en_IN',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

// Server Component — fetches data and passes to client component
export default async function PackageDetailPage({ params }: PageProps) {
    const { slug, type, code } = await params;
    const product = await getProduct(code);

    if (!product) {
        notFound();
    }

    const { displayPrice } = getServerDisplayPrice(product);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ayropath.com';
    const canonicalUrl = `${baseUrl}/profiles/${slug}/${type}/${code}`;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
            { '@type': 'ListItem', position: 2, name: 'Packages', item: `${baseUrl}/profiles` },
            { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <ProductJsonLd product={product} displayPrice={displayPrice} canonicalUrl={canonicalUrl} />
            <PackageDetailClient product={product} />
        </>
    );
}