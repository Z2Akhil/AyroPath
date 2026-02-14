import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Test from '@/lib/models/Test';
import Offer from '@/lib/models/Offer';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await connectToDatabase();

    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Product code is required' },
        { status: 400 }
      );
    }

    // Search in all product collections
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

    return NextResponse.json({
      success: true,
      product: product.getCombinedData()
    });

  } catch (error) {
    console.error('Error fetching product by code:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch product',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}