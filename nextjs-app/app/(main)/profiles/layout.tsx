import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Health Checkup Packages | Ayropath',
    description: 'Explore comprehensive health checkup packages from Ayropath. Full body checkups, diabetes screening, thyroid profiles and more. Free home sample collection. Powered by Thyrocare.',
    openGraph: {
        title: 'Health Checkup Packages | Ayropath',
        description: 'Explore comprehensive health checkup packages. Full body checkups, diabetes screening, thyroid profiles and more with free home collection.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Health Checkup Packages | Ayropath',
        description: 'Explore comprehensive health checkup packages from Ayropath.',
    },
    alternates: {
        canonical: '/profiles',
    },
};

export default function ProfilesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
