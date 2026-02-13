import Head from 'next/head';

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogType?: string;
    ogImage?: string;
    twitterHandle?: string;
}

const SEO = ({
    title = "Ayropath - Diagnostics & Lab Tests at Home",
    description = "Book diagnostic tests and full body checkups at home with Ayropath. Quality results, affordable prices, and convenient home sample collection.",
    canonical,
    ogType = "website",
    ogImage = "/og-image.jpg",
    twitterHandle = "@ayropath"
}: SEOProps) => {
    const siteTitle = title.includes("Ayropath") ? title : `${title} | Ayropath`;

    return (
        <Head>
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph */}
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
            {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
        </Head>
    );
};

export default SEO;
