import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import Test from '@/lib/models/Test';
import { slugify } from '@/lib/slugify';
import PackageDetailClient from './PackageDetailClient';
import ProductJsonLd from '@/components/seo/ProductJsonLd';
import ProfileSEOContent from '@/components/seo/ProfileSEOContent';

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

    // ── Intent-specific title: matches real search queries per package type
    function buildPageTitle(name: string, price: number, pkgType: string): string {
        const n = name.toLowerCase();
        if (n.includes('tax')) return `${name} – Thyrocare 80D Health Package | Book at ₹${price}`;
        if (n.includes('senior')) return `${name} – Senior Citizen Health Checkup Thyrocare | Ayropath`;
        if (n.includes('executive')) return `${name} – Executive Full Body Health Checkup | Book at ₹${price}`;
        if (n.includes('vitamin')) return `${name} – Full Body + Vitamin Deficiency Test Thyrocare | Ayropath`;
        if (n.includes('female') || n.includes('women')) return `${name} – Women's Health Checkup Thyrocare | Book at ₹${price}`;
        if (n.includes('male') || n.includes('men')) return `${name} – Men's Health Checkup Thyrocare | Book at ₹${price}`;
        if (n.includes('aarogyam')) return `${name} – Thyrocare Aarogyam Health Profile | Book at ₹${price}`;
        return `${name} – Thyrocare ${pkgType === 'OFFER' ? 'Offer Package' : 'Health Profile'} | Book at ₹${price}`;
    }

    // ── Intent-specific description: keyword-rich, matches search intent
    function buildPageDescription(name: string, price: number, count: number, tests: string, pkgType: string): string {
        const n = name.toLowerCase();
        const testsSnippet = tests ? ` Includes ${tests}.` : '';
        if (n.includes('tax')) return `Book ${name} at ₹${price}. Claim Section 80D tax benefit. ${count} parameters.${testsSnippet} Free home collection, NABL accredited Thyrocare labs.`;
        if (n.includes('senior')) return `Book ${name} at ₹${price} – Comprehensive health checkup for senior citizens. ${count} parameters.${testsSnippet} Free home collection, Thyrocare labs.`;
        if (n.includes('executive')) return `Book ${name} at ₹${price} – Complete executive health screening. ${count} parameters.${testsSnippet} Free home collection, NABL & CAP accredited.`;
        if (n.includes('vitamin')) return `Book ${name} at ₹${price} – Full body + vitamin deficiency screening. ${count} parameters.${testsSnippet} Free home collection, NABL accredited.`;
        return `Book ${name} at ₹${price}. Thyrocare health profile. ${count} parameters.${testsSnippet} Free home collection, NABL accredited labs, reports in 24–48 hrs.`;
    }

    const title = buildPageTitle(product.name, displayPrice, product.type);
    const description = buildPageDescription(product.name, displayPrice, testCount, testNames, product.type);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ayropath.com';
    const canonicalUrl = `${baseUrl}/profiles/${slug}/${type}/${code}`;

    // Demographic keywords derived from package name
    const nameLower = product.name.toLowerCase();
    const demographicKeywords: string[] = [];
    if (nameLower.includes('male')) {
        demographicKeywords.push('health checkup for men', 'male health profile', "men's health test");
    }
    if (nameLower.includes('female')) {
        demographicKeywords.push('health checkup for women', 'female health profile', "women's health test");
    }
    if (nameLower.includes('senior')) {
        demographicKeywords.push('senior citizen health checkup', 'health test for elderly', 'health package for aged');
    }
    if (nameLower.includes('executive')) {
        demographicKeywords.push('executive health checkup', 'corporate health screening', 'comprehensive full body checkup');
    }
    if (nameLower.includes('vitamin')) {
        demographicKeywords.push('vitamin deficiency test', 'vitamin D B12 blood test', 'nutritional deficiency screening');
    }
    if (nameLower.includes('tax')) {
        demographicKeywords.push('80D tax saving health checkup', 'section 80D health test', 'tax saver health package');
    }

    // Test group names as additional topical keywords
    const groupKeywords = [
        ...new Set(
            (product.childs || []).map((c: any) => c.groupName).filter(Boolean)
        ),
    ] as string[];

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
        ...demographicKeywords,
        ...groupKeywords,
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
            {/* Server-rendered content for Google to crawl — description, health areas, FAQ */}
            <ProfileSEOContent product={product} displayPrice={displayPrice} />
        </>
    );
}