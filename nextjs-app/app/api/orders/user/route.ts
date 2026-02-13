import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

// Helper to get user from token
const getUserFromToken = async (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive && user.isVerified) {
      return user;
    }
  } catch {
    // Invalid token
  }
  return null;
};

// GET /api/orders/user - Get user orders
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: orders,
      metadata: {
        totalOrders: orders.length
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}