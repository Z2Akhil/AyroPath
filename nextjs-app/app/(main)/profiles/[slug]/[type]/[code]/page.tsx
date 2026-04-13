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
        if (n.includes('tax') && n.includes('basic')) return `${name} – Thyrocare 80D Health Package | Book at ₹${price} | Ayropath`;
        if (n.includes('tax') && n.includes('advanced')) return `${name} – Section 80D Advanced Health Package Thyrocare | Book at ₹${price}`;
        if (n.includes('tax')) return `${name} – Thyrocare 80D Health Package | Book at ₹${price}`;
        if (n.includes('senior') && n.includes('male')) return `${name} – Senior Citizen Male Health Checkup | Thyrocare | Ayropath`;
        if (n.includes('senior') && n.includes('female')) return `${name} – Senior Citizen Female Health Checkup | Thyrocare | Ayropath`;
        if (n.includes('senior')) return `${name} – Senior Citizen Health Checkup Thyrocare | Ayropath`;
        if (n.includes('executive')) return `${name} – Book Executive Full Body Health Checkup at ₹${price} | Thyrocare`;
        if (n.includes('vitamin')) return `${name} – Complete Health Checkup with Vitamins | Book at ₹${price} | Thyrocare`;
        if (n.includes('ustsh')) return `${name} – New Aarogyam Basic with USTSH | Book at ₹${price} | Thyrocare`;
        if (n.includes('female')) return `${name} – Aarogyam Female Health Profile | Book at ₹${price} | Thyrocare`;
        if (n.includes('male')) return `${name} – Aarogyam Male Health Profile | Book at ₹${price} | Thyrocare`;
        if (n.includes('aarogyam')) return `${name} – Thyrocare Aarogyam Health Profile | Book at ₹${price}`;
        return `${name} – Thyrocare ${pkgType === 'OFFER' ? 'Offer Package' : 'Health Profile'} | Book at ₹${price}`;
    }

    // ── Intent-specific description: keyword-rich, matches search intent
    function buildPageDescription(name: string, price: number, count: number, tests: string, pkgType: string): string {
        const n = name.toLowerCase();
        const testsSnippet = tests ? ` Includes ${tests}.` : '';
        if (n.includes('tax') && n.includes('basic')) return `Book ${name} online at ₹${price}. Claim Section 80D tax deduction. ${count} parameters.${testsSnippet} Free home sample collection. NABL & CAP accredited Thyrocare labs. Reports in 24–48 hrs.`;
        if (n.includes('tax') && n.includes('advanced')) return `Book ${name} at ₹${price}. Section 80D tax benefit eligible. Comprehensive ${count}-parameter advanced health package.${testsSnippet} Free home collection, NABL accredited Thyrocare labs.`;
        if (n.includes('tax')) return `Book ${name} at ₹${price}. Claim Section 80D tax benefit. ${count} parameters.${testsSnippet} Free home collection, NABL accredited Thyrocare labs.`;
        if (n.includes('senior') && n.includes('male')) return `Book ${name} online at ₹${price}. Comprehensive health checkup for elderly men – ${count} parameters covering PSA, testosterone, cardiac, diabetes & bone health.${testsSnippet} Free home collection, Thyrocare labs.`;
        if (n.includes('senior') && n.includes('female')) return `Book ${name} online at ₹${price}. Complete health screening for elderly women – ${count} parameters covering bone density, cardiac, diabetes & hormonal health.${testsSnippet} Free home collection, Thyrocare labs.`;
        if (n.includes('senior')) return `Book ${name} at ₹${price} – Comprehensive health checkup for senior citizens. ${count} parameters.${testsSnippet} Free home collection, Thyrocare labs.`;
        if (n.includes('executive')) return `Book ${name} at ₹${price} – Premium executive full body health screening. ${count} parameters.${testsSnippet} Covers cardiac, liver, kidney, thyroid, vitamins & more. Free home collection, NABL & CAP accredited.`;
        if (n.includes('vitamin')) return `Book ${name} at ₹${price} – Full body checkup with vitamin deficiency screening. ${count} parameters including Vitamin D, B12 & nutritional markers.${testsSnippet} Free home collection, NABL accredited.`;
        if (n.includes('ustsh')) return `Book ${name} at ₹${price} – Includes USTSH urine TSH test in addition to full body parameters. ${count} tests.${testsSnippet} Free home collection, Thyrocare labs.`;
        if (n.includes('female')) return `Book ${name} at ₹${price} – Women's comprehensive health profile including thyroid, hormonal & nutritional parameters. ${count} tests.${testsSnippet} Free home collection, NABL accredited.`;
        if (n.includes('male')) return `Book ${name} at ₹${price} – Men's comprehensive health profile covering cardiovascular, metabolic & organ health. ${count} tests.${testsSnippet} Free home collection, NABL accredited.`;
        return `Book ${name} at ₹${price}. Thyrocare health profile. ${count} parameters.${testsSnippet} Free home collection, NABL accredited labs, reports in 24–48 hrs.`;
    }

    const title = buildPageTitle(product.name, displayPrice, product.type);
    const description = buildPageDescription(product.name, displayPrice, testCount, testNames, product.type);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ayropath.com';
    const canonicalUrl = `${baseUrl}/profiles/${slug}/${type}/${code}`;

    // ── Per-profile keyword clusters (mapped from seoKeywords file) ──────────
    const nameLower = product.name.toLowerCase();

    // Common high-intent terms for every profile page
    const commonKeywords = [
        'thyrocare home collection', 'book blood test online', 'NABL accredited lab test',
        'free home sample collection', 'diagnostic lab test online', 'health checkup packages India',
        'lab test at home', 'online lab test booking', 'blood test without prescription',
        'Thyrocare authorised partner', 'NABL certified lab India',
    ];

    // Profile-specific keyword clusters
    function buildPackageKeywords(n: string, name: string, price: number): string[] {
        if (n.includes('executive')) return [
            name, `${name} price`, `${name} cost`, `${name} package`,
            'executive health checkup', 'full body health checkup', 'executive full body checkup',
            'premium executive health screening', 'comprehensive full body checkup',
            'executive wellness checkup', 'executive full body health checkup package',
            'executive full body health checkup cost', 'executive health screening cost',
            'executive full body health checkup near me', 'benefits of executive full body health checkup',
            'what includes executive health checkup', 'advanced full body health checkup',
            'executive health checkup for heart', 'full body checkup for cancer detection',
            `book ${name} online`, `${name} Thyrocare`, `${name} home collection`,
            'executive full body health checkup reviews', 'prepare for full body executive checkup',
        ];
        if (n.includes('vitamin')) return [
            name, `${name} price`, `${name} cost`,
            'complete health checkup with vitamins', 'full body health checkup vitamins',
            'comprehensive health checkup vitamins', 'total health checkup package vitamins',
            'complete health checkup including vitamin levels', 'full health screening with vitamin test',
            'yearly complete health checkup vitamins', 'what is complete health checkup with vitamins',
            'vitamin D test in health checkup', 'B12 vitamin checkup package',
            'blood test vitamins full checkup', 'detect vitamin deficiency health checkup',
            'which vitamins in complete health checkup', 'nutrient panel complete health screening',
            `book ${name} online`, `${name} Thyrocare`, 'vitamin deficiency test at home',
        ];
        if (n.includes('tax') && n.includes('basic')) return [
            name, `${name} price`, `${name} cost`,
            'aarogyam tax saver basic', 'thyrocare aarogyam tax saver basic',
            'aarogyam tax saver basic package', 'aarogyam basic tax saver',
            'tax saver basic health checkup', 'section 80d aarogyam tax saver basic',
            'tax saver health package basic', '80d deduction aarogyam basic',
            'income tax saver health check aarogyam', 'aarogyam tax saver for itr',
            'aarogyam tax saver basic tests list', 'parameters in aarogyam tax saver basic',
            `book ${name} online`, `${name} home sample`, 'aarogyam tax saver basic vs advanced',
            '80D tax saving health checkup', 'section 80D health test',
        ];
        if (n.includes('tax') && n.includes('advanced')) return [
            name, `${name} price`, `${name} cost`,
            'aarogyam tax saver advanced', 'thyrocare aarogyam tax saver advanced',
            'section 80D aarogyam tax saver advanced', 'tax saving health checkup aarogyam',
            '80D deduction aarogyam advanced', 'preventive checkup tax saver package',
            'health package under 80D aarogyam', 'aarogyam tax saver advanced vs basic',
            'best tax saver full body checkup', 'aarogyam packages comparison',
            `book ${name} online`, `${name} home collection`,
            'tax saver health package advanced', 'aarogyam tax saver advanced reports',
        ];
        if (n.includes('ustsh')) return [
            name, `${name} price`, `${name} cost`,
            'new aarogyam basic with ustsh', 'aarogyam basic with ustsh',
            'thyrocare aarogyam basic ustsh', 'aarogyam basic ustsh package',
            'latest aarogyam basic with ustsh', 'ustsh test in aarogyam basic',
            'new aarogyam basic ustsh parameters', 'what is new aarogyam basic with ustsh',
            'tests in aarogyam basic ustsh', 'aarogyam basic with ustsh reports',
            `book ${name} online`, `${name} home collection`,
            'aarogyam basic with ustsh vs basic', 'aarogyam basic ustsh worth it',
        ];
        if (n.includes('male') && !n.includes('female') && !n.includes('senior')) return [
            name, `${name} price`, `${name} cost`,
            'aarogyam male', 'aarogyam male package', 'thyrocare aarogyam male',
            'aarogyam male health check', 'aarogyam male full body test',
            'aarogyam male test list', 'parameters in aarogyam male',
            'aarogyam male reports', 'aarogyam male blood tests',
            `book aarogyam male`, 'aarogyam male online booking',
            'aarogyam male home collection', 'health checkup for men',
            `${name} Thyrocare`, 'men health profile test', 'male full body checkup',
        ];
        if (n.includes('female') && !n.includes('senior')) return [
            name, `${name} price`, `${name} cost`,
            'aarogyam female package', 'aarogyam female profile', 'aarogyam female test',
            'thyrocare aarogyam female', 'aarogyam female health checkup',
            'aarogyam female hormone test', 'aarogyam female thyroid panel',
            'aarogyam female reproductive health', `book aarogyam female`,
            'aarogyam female home sample', 'order aarogyam female online',
            'health checkup for women', "women's health profile test",
            `${name} Thyrocare`, 'female full body checkup', 'aarogyam female reviews',
        ];
        if (n.includes('senior') && n.includes('male')) return [
            name, `${name} price`, `${name} cost`,
            'senior citizen male health profile test', 'elderly man profile blood test',
            'senior male medical profile screening', 'older male citizen health test panel',
            'PSA test for senior men', 'prostate screening elderly male',
            'testosterone levels test senior male', 'hormone panel senior citizen male',
            'senior male cholesterol profile test', 'heart health screening elderly man',
            'A1C test senior male profile', 'blood sugar screening elderly man',
            'bone density test senior male', 'comprehensive health profile senior male',
            'annual physical elderly man labs', 'senior wellness test panel male',
            `book ${name} online`, 'health checkup for elderly men India',
        ];
        if (n.includes('senior') && n.includes('female')) return [
            name, `${name} price`, `${name} cost`,
            'senior citizen female profile test', 'elderly female profile exam',
            'senior woman health profile test', 'female senior citizen diagnostic test',
            'senior female health assessment', 'elderly woman medical profile',
            'senior citizen female wellness test', 'senior woman cognitive profile test',
            'female senior bone density test', 'elderly female heart health screening',
            'senior citizen female diabetes check', 'older woman blood pressure profile',
            `book ${name} online`, 'health checkup for elderly women India',
        ];
        return [name, `${name} Thyrocare`, `book ${name} online`];
    }

    const packageKeywords = buildPackageKeywords(nameLower, product.name, displayPrice);

    // Demographic keywords derived from package name
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

    // Dynamic keywords for this specific test — merges all keyword sources
    const keywords = [
        ...new Set([
            ...packageKeywords,
            ...demographicKeywords,
            ...groupKeywords,
            ...commonKeywords,
        ]),
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