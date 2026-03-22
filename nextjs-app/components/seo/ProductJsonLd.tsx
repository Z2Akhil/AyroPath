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
}

export default function ProductJsonLd({ product, displayPrice }: ProductJsonLdProps) {
    const testCount = product.testCount || product.childs?.length || 0;
    const testNames = (product.childs || [])
        .slice(0, 10)
        .map((c) => c.name)
        .filter(Boolean)
        .join(', ');

    const description = `${product.name} - Comprehensive health checkup package with ${testCount} tests${testNames ? ` including ${testNames}` : ''}. ${product.fasting === 'CF' ? 'Fasting required.' : 'No fasting required.'}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        sku: product.code,
        category: product.category || 'Health Checkup',
        brand: {
            '@type': 'Brand',
            name: 'Ayropath',
        },
        provider: {
            '@type': 'Organization',
            name: 'Ayropath',
            url: 'https://ayropath.com',
        },
        offers: {
            '@type': 'Offer',
            price: displayPrice.toString(),
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name: 'Ayropath',
            },
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
