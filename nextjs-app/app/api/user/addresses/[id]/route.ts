import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';

const getUserFromToken = async (req: NextRequest) => {
    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
        await connectToDatabase();
        const user = await User.findById(decoded.id);
        if (user?.isActive && user?.isVerified) return user;
    } catch { }
    return null;
};

// PUT /api/user/addresses/[id]
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const address = user.addresses.find((a: any) => a._id.toString() === id);
    if (!address) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });

    try {
        const { houseNo, roadName, area, locality, city, state, pincode, isDefault } = await req.json();

        if (!houseNo?.trim() || !city?.trim() || !state?.trim() || !pincode) {
            return NextResponse.json(
                { success: false, message: 'House no, city, state, and pincode are required' },
                { status: 400 }
            );
        }

        if (!/^\d{6}$/.test(pincode)) {
            return NextResponse.json({ success: false, message: 'Pincode must be exactly 6 digits' }, { status: 400 });
        }

        if (isDefault) {
            user.addresses.forEach((a: any) => { a.isDefault = false; });
        }

        address.houseNo = houseNo.trim();
        address.roadName = roadName?.trim() || '';
        address.area = area?.trim() || '';
        address.locality = locality?.trim() || '';
        address.city = city.trim();
        address.state = state.trim();
        address.pincode = pincode;
        address.isDefault = isDefault ?? address.isDefault;

        await user.save();
        return NextResponse.json({ success: true, address });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update address';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

// DELETE /api/user/addresses/[id]
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const idx = user.addresses.findIndex((a: any) => a._id.toString() === id);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });

    const wasDefault = user.addresses[idx].isDefault;
    user.addresses.splice(idx, 1);

    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();
    return NextResponse.json({ success: true, message: 'Address deleted' });
}
