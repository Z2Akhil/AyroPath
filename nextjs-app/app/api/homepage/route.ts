import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Test from '@/lib/models/Test';
import Offer from '@/lib/models/Offer';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const [offers, profiles, tests] = await Promise.all([
      Offer.find({ isActive: true }).limit(8),
      Profile.find({ isActive: true }).limit(4),
      Test.find({ isActive: true }).limit(8)
    ]);

    return NextResponse.json({
      success: true,
      offers: offers.map(o => o.getCombinedData()),
      profiles: profiles.map(p => p.getCombinedData()),
      tests: tests.map(t => t.getCombinedData())
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch homepage data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
