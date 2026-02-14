import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import Cart from '@/lib/models/Cart';
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
    // Invalid token, continue as guest
  }
  return null;
};

// PUT /api/cart/items/[productCode] - Update item quantity
export async function PUT(req: NextRequest, { params }: { params: Promise<{ productCode: string }> }) {
  try {
    await connectToDatabase();

    const { productCode } = await params;
    const body = await req.json();
    const { productType, quantity } = body;

    if (!productType || !quantity) {
      return NextResponse.json(
        { success: false, message: 'Product type and quantity are required' },
        { status: 400 }
      );
    }

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
    const cookieStore = cookies();
    const guestSessionId = req.headers.get('x-guest-session-id') || (await cookieStore).get('guestSessionId')?.value;

    const user = await getUserFromToken(token);

    const cart = await Cart.findByUserOrGuest(user?._id, guestSessionId);

    if (!cart) {
      return NextResponse.json({ success: false, message: 'Cart not found' }, { status: 404 });
    }

    await cart.updateQuantity(productCode, productType, parseInt(quantity));
    const summary = cart.getSummary();

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    const message = error instanceof Error ? error.message : 'Failed to update cart item';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE /api/cart/items/[productCode] - Remove item from cart
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ productCode: string }> }) {
  try {
    await connectToDatabase();

    const { productCode } = await params;
    const body = await req.json();
    const { productType } = body;

    if (!productType) {
      return NextResponse.json(
        { success: false, message: 'Product type is required' },
        { status: 400 }
      );
    }

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
    const cookieStore = cookies();
    const guestSessionId = req.headers.get('x-guest-session-id') || (await cookieStore).get('guestSessionId')?.value;

    const user = await getUserFromToken(token);

    const cart = await Cart.findByUserOrGuest(user?._id, guestSessionId);

    if (!cart) {
      return NextResponse.json({ success: false, message: 'Cart not found' }, { status: 404 });
    }

    await cart.removeItem(productCode, productType);
    const summary = cart.getSummary();

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove item from cart';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}