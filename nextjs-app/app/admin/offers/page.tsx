'use client';

export const dynamic = 'force-dynamic';

import ProductCatalog from '@/components/admin/ProductCatalog';
import { Tag } from 'lucide-react';

export default function OffersPage() {
    return (
        <ProductCatalog
            type="OFFER"
            title="Offers"
            icon={<Tag className="w-6 h-6" />}
        />
    );
}
