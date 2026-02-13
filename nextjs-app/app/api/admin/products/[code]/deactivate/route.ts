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
            let deactivatedProduct;
            let found = false;

            // Try Test model
            const test = await Test.findOne({ code });
            if (test) {
                test.isActive = false;
                await test.save();
                deactivatedProduct = test.getCombinedData();
                found = true;
            }

            // Try Profile model
            if (!found) {
                const profile = await Profile.findOne({ code });
                if (profile) {
                    profile.isActive = false;
                    await profile.save();
                    deactivatedProduct = profile.getCombinedData();
                    found = true;
                }
            }

            // Try Offer model
            if (!found) {
                const offer = await Offer.findOne({ code });
                if (offer) {
                    offer.isActive = false;
                    await offer.save();
                    deactivatedProduct = offer.getCombinedData();
                    found = true;
                }
            }

            if (!found) {
                return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
            }

            await AdminActivity.logActivity({
                adminId: session.adminId._id,
                sessionId: session._id,
                action: 'PRODUCT_DEACTIVATE',
                description: `Deactivated product ${code}`,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { code }
            });

            return NextResponse.json({ success: true, product: deactivatedProduct, message: 'Product deactivated successfully' });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json({ success: false, error: message }, { status: 500 });
        }
    });
}
