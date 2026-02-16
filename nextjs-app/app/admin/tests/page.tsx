'use client';

import ProductCatalog from '@/components/admin/ProductCatalog';
import { Microscope } from 'lucide-react';

export default function TestsPage() {
    return (
        <ProductCatalog
            type="TEST"
            title="Tests"
            icon={<Microscope className="w-6 h-6" />}
        />
    );
}
