import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';

// GET /api/client/products/[code] - Get product by code
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        await connectToDatabase();

        const { code } = await params;

        // Try to find product in all collections
        const [test, profile, offer] = await Promise.all([
            Test.findOne({ code, isActive: true }),
            Profile.findOne({ code, isActive: true }),
            Offer.findOne({ code, isActive: true })
        ]);

        const product = test || profile || offer;

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Get combined data (includes both DB and Thyrocare data)
        const productData = product.getCombinedData();

        return NextResponse.json({
            success: true,
            product: productData
        });

    } catch (error: any) {
        console.error('Error fetching product by code:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch product';
        return NextResponse.json(
            { success: false, message, error: message },
            { status: 500 }
        );
    }
}
