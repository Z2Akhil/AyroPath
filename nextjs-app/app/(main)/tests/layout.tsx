import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Lab Tests & Diagnostics | Ayropath',
    description: 'Browse individual lab tests and diagnostic services from Ayropath. Blood tests, urine tests, thyroid tests, diabetes tests and more. Affordable pricing with free home sample collection.',
    openGraph: {
        title: 'Lab Tests & Diagnostics | Ayropath',
        description: 'Browse individual lab tests and diagnostic services. Blood tests, thyroid tests, diabetes tests and more with affordable pricing.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Lab Tests & Diagnostics | Ayropath',
        description: 'Browse individual lab tests and diagnostic services from Ayropath.',
    },
    alternates: {
        canonical: '/tests',
    },
};

export default function TestsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
