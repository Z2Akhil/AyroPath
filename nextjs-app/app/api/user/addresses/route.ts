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

// GET /api/user/addresses
export async function GET(req: NextRequest) {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({ success: true, addresses: user.addresses });
}

// POST /api/user/addresses
export async function POST(req: NextRequest) {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

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
            user.addresses.forEach(a => { a.isDefault = false; });
        }

        const newAddress = {
            houseNo: houseNo.trim(),
            roadName: roadName?.trim() || '',
            area: area?.trim() || '',
            locality: locality?.trim() || '',
            city: city.trim(),
            state: state.trim(),
            pincode,
            isDefault: isDefault || user.addresses.length === 0,
        };

        user.addresses.push(newAddress as any);
        await user.save();

        const added = user.addresses[user.addresses.length - 1];
        return NextResponse.json({ success: true, address: added }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add address';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
