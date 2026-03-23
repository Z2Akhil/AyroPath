import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Your Cart',
    description: 'Review your selected health test packages and proceed to book your appointment with Ayropath. Free home sample collection available.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
