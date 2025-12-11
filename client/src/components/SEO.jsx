import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component for dynamic meta tags
 * Use this component on pages to set page-specific SEO metadata
 */
const SEO = ({
    title = 'Ayropath | Book Medical Tests Online in India | Thyrocare Partner',
    description = 'Ayropath is a trusted medical diagnostic booking platform in India. Book blood tests, full body checkups, and pathology tests powered by Thyrocare. Fast booking, affordable pricing, and secure online reports.',
    keywords = 'Ayropath, medical tests online, book blood tests, Thyrocare partner, diagnostic services India, full body checkup, pathology tests, health packages, lab test booking',
    canonical = 'https://ayropath.com/',
    ogImage = 'https://ayropath.com/og-image.png',
    ogType = 'website',
    structuredData = null,
}) => {
    const baseUrl = 'https://ayropath.com';
    const fullCanonical = canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href={fullCanonical} />

            {/* Open Graph */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={fullCanonical} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

SEO.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    canonical: PropTypes.string,
    ogImage: PropTypes.string,
    ogType: PropTypes.string,
    structuredData: PropTypes.object,
};

export default SEO;
