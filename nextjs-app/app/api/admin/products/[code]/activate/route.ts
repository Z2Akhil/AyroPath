import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import AdminActivity from '@/lib/models/AdminActivity';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    return withAdminAuth(req, async (req, session) => {
        const startTime = Date.now();
        const { code } = await params;

        if (!code) {
            return NextResponse.json({ success: false, error: 'Product code is required' }, { status: 400 });
        }

        try {
            let activatedProduct;
            let found = false;

            // Try Test model
            const test = await Test.findOne({ code });
            if (test) {
                test.isActive = true;
                await test.save();
                activatedProduct = test.getCombinedData();
                found = true;
            }

            // Try Profile model
            if (!found) {
                const profile = await Profile.findOne({ code });
                if (profile) {
                    profile.isActive = true;
                    await profile.save();
                    activatedProduct = profile.getCombinedData();
                    found = true;
                }
            }

            // Try Offer model
            if (!found) {
                const offer = await Offer.findOne({ code });
                if (offer) {
                    offer.isActive = true;
                    await offer.save();
                    activatedProduct = offer.getCombinedData();
                    found = true;
                }
            }

            if (!found) {
                return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
            }

            await AdminActivity.logActivity({
                adminId: session.adminId._id,
                sessionId: session._id,
                action: 'PRODUCT_ACTIVATE',
                description: `Activated product ${code}`,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { code }
            });

            return NextResponse.json({ success: true, product: activatedProduct, message: 'Product activated successfully' });

        } catch (error: any) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
    });
}
