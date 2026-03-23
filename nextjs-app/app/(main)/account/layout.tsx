import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Account',
    description: 'Manage your Ayropath account, view your orders, update profile, and track your health test bookings.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
