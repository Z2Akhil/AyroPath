'use client';

import ProductCatalog from '@/components/admin/ProductCatalog';
import { Package } from 'lucide-react';

export default function PackagesPage() {
    return (
        <ProductCatalog
            type="PROFILE"
            title="Packages"
            icon={<Package className="w-6 h-6" />}
        />
    );
}
