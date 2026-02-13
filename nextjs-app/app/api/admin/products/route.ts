import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { withAdminAuth } from '@/lib/auth';
import AdminActivity from '@/lib/models/AdminActivity';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import { ThyrocareService } from '@/lib/services/thyrocare';

interface ThyrocareProduct {
    code: string;
    type: string;
    [key: string]: unknown;
}

export async function POST(req: NextRequest) {
    return withAdminAuth(req, async (req, session) => {
        const startTime = Date.now();
        const { productType } = await req.json();

        if (!productType) {
            return NextResponse.json({ success: false, error: 'Product type is required' }, { status: 400 });
        }

        try {
            const thyrocareApiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

            const responseData = await ThyrocareService.makeRequest(async (apiKey) => {
                const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
                    ProductType: productType,
                    ApiKey: apiKey
                });
                return response.data;
            });

            if (responseData.response !== 'Success') {
                throw new Error('Thyrocare API error: ' + responseData.response);
            }

            let thyrocareProducts: ThyrocareProduct[] = [];
            const master = responseData.master || {};
            const type = productType.toUpperCase();

            if (type === 'OFFER') thyrocareProducts = master.offer || master.offers || [];
            else if (type === 'TEST') thyrocareProducts = master.tests || [];
            else if (type === 'PROFILE') thyrocareProducts = master.profile || [];
            else if (type === 'ALL') {
                thyrocareProducts = [...(master.offer || []), ...(master.tests || []), ...(master.profile || [])];
            }

            const allProductCodes = new Set(thyrocareProducts.map((p) => p.code).filter(Boolean));

            const combinedProducts = [];
            for (const tp of thyrocareProducts) {
                try {
                    let model: typeof Test | typeof Profile | typeof Offer = Test;
                    if (tp.type === 'PROFILE' || tp.type === 'POP') model = Profile;
                    else if (tp.type === 'OFFER') model = Offer;

                    const product = await (model as typeof Test).findOrCreateFromThyroCare(tp);
                    if (!product.isActive) {
                        product.isActive = true;
                        await product.save();
                    }

                    const combinedData = product.getCombinedData();
                    combinedData.isInThyrocare = true;
                    combinedProducts.push(combinedData);
                } catch {
                    console.error(`Error syncing product ${tp.code}`);
                }
            }

            // Handle orphaned products (in DB but not in ThyroCare)
            const orphanedProducts: Record<string, unknown>[] = [];
            const codesArray = allProductCodes.size > 0 ? Array.from(allProductCodes) : null;

            const handleOrphaned = async (model: typeof Test | typeof Profile | typeof Offer, mType: string) => {
                const filter = {
                    type: mType,
                    ...(codesArray && { code: { $nin: codesArray } })
                };
                // @ts-expect-error - Mongoose query filter type complexity
                const orphaned = await model.find(filter);
                for (const product of orphaned) {
                    if (product.isActive) {
                        product.isActive = false;
                        await product.save();
                    }
                    const combinedData = product.getCombinedData();
                    combinedData.isInThyrocare = false;
                    orphanedProducts.push(combinedData);
                }
            };

            if (type === 'ALL') {
                await handleOrphaned(Test, 'TEST');
                await handleOrphaned(Profile, 'PROFILE');
                await handleOrphaned(Offer, 'OFFER');
            } else if (type === 'TEST') await handleOrphaned(Test, 'TEST');
            else if (type === 'PROFILE') await handleOrphaned(Profile, 'PROFILE');
            else if (type === 'OFFER') await handleOrphaned(Offer, 'OFFER');

            const allProducts = [...combinedProducts, ...orphanedProducts];

            await AdminActivity.logActivity({
                adminId: session.adminId._id,
                sessionId: session._id,
                action: 'PRODUCT_FETCH',
                description: `Fetched ${productType} products (Sync: ${combinedProducts.length}, Orphaned: ${orphanedProducts.length})`,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: {
                    productType,
                    total: allProducts.length,
                    synced: combinedProducts.length,
                    orphaned: orphanedProducts.length
                }
            });

            return NextResponse.json({
                success: true,
                products: allProducts,
                metadata: {
                    totalProducts: allProducts.length,
                    syncedCount: combinedProducts.length,
                    orphanedCount: orphanedProducts.length
                }
            });

        } catch (error) {
            console.error('Migration API Error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json({ success: false, error: message }, { status: 500 });
        }
    });
}