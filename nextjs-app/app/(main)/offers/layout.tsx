import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Health Test Offers & Discounts | Ayropath',
    description: 'Browse discounted health test packages and offers from Ayropath. Save up to 50% on comprehensive health checkups with free home sample collection. Powered by Thyrocare.',
    openGraph: {
        title: 'Health Test Offers & Discounts | Ayropath',
        description: 'Browse discounted health test packages and offers. Save up to 50% on comprehensive health checkups with free home sample collection.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Health Test Offers & Discounts | Ayropath',
        description: 'Browse discounted health test packages and offers from Ayropath.',
    },
    alternates: {
        canonical: '/offers',
    },
};

export default function OffersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
