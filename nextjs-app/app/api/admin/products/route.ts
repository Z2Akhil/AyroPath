import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { withAdminAuth } from '@/lib/auth';
import AdminActivity from '@/lib/models/AdminActivity';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import { ThyrocareService } from '@/lib/services/thyrocare';

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

            let thyrocareProducts = [];
            const master = responseData.master || {};
            const type = productType.toUpperCase();

            if (type === 'OFFER') thyrocareProducts = master.offer || master.offers || [];
            else if (type === 'TEST') thyrocareProducts = master.tests || [];
            else if (type === 'PROFILE') thyrocareProducts = master.profile || [];
            else if (type === 'ALL') {
                thyrocareProducts = [...(master.offer || []), ...(master.tests || []), ...(master.profile || [])];
            }

            const allProductCodes = new Set(thyrocareProducts.map((p: any) => p.code).filter(Boolean));

            const combinedProducts = [];
            for (const tp of thyrocareProducts) {
                try {
                    let model: any = Test;
                    if (tp.type === 'PROFILE' || tp.type === 'POP') model = Profile;
                    else if (tp.type === 'OFFER') model = Offer;

                    const product = await model.findOrCreateFromThyroCare(tp);
                    if (!product.isActive) {
                        product.isActive = true;
                        await product.save();
                    }

                    const combinedData = product.getCombinedData();
                    combinedData.isInThyrocare = true;
                    combinedProducts.push(combinedData);
                } catch (err) {
                    console.error(`Error syncing product ${tp.code}:`, err);
                }
            }

            // Step 5: Handle orphaned products (in DB but not in ThyroCare)
            const orphanedProducts = [];
            const modelsToCheck = [];
            if (type === 'ALL') {
                modelsToCheck.push({ model: Test, type: 'TEST' });
                modelsToCheck.push({ model: Profile, type: 'PROFILE' });
                modelsToCheck.push({ model: Offer, type: 'OFFER' });
            } else if (type === 'TEST') modelsToCheck.push({ model: Test, type: 'TEST' });
            else if (type === 'PROFILE') modelsToCheck.push({ model: Profile, type: 'PROFILE' });
            else if (type === 'OFFER') modelsToCheck.push({ model: Offer, type: 'OFFER' });

            for (const { model, type: mType } of modelsToCheck) {
                const query: any = { type: mType };
                if (allProductCodes.size > 0) {
                    query.code = { $nin: Array.from(allProductCodes) };
                }

                const orphaned = await model.find(query);
                for (const product of orphaned) {
                    if (product.isActive) {
                        product.isActive = false;
                        await product.save();
                    }
                    const combinedData = product.getCombinedData();
                    combinedData.isInThyrocare = false;
                    orphanedProducts.push(combinedData);
                }
            }

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

        } catch (error: any) {
            console.error('Migration API Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
    });
}
